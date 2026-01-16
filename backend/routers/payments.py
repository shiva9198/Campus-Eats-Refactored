import secrets
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from db import models, session as database
from core import dependencies
from core.config import upload_payment_proof, generate_signed_url

router = APIRouter(
    prefix="/payments",
    tags=["payments"],
)

class PaymentSubmit(BaseModel):
    order_id: int
    utr: str = Field(..., min_length=4, max_length=50, description="Unique Transaction Reference (UTR)")
    # STRICT: No screenshot_url allowed

class PaymentVerify(BaseModel):
    order_id: int
    verified_by: str

class PaymentReject(BaseModel):
    order_id: int
    rejected_by: str
    reason: str

@router.post("/submit")
def submit_payment(
    payment: PaymentSubmit, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_active_user)
):
    """Student submits payment proof (Manual UTR Only)"""
    order = db.query(models.Order).filter(models.Order.id == payment.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # SECURITY: Users can only submit payment for their own orders
    if order.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to submit payment for this order")
    
    # Secure Rule: Status -> Pending_Verification
    current_status = order.status
    if current_status not in ["Pending", "Payment_Rejected"]:
        raise HTTPException(status_code=400, detail=f"Cannot submit payment for order in '{current_status}' state.")

    # FRAUD PREVENTION: Check for duplicate UTR
    # repurposing 'verification_proof' column for UTR to avoid migration
    duplicate_utr = db.query(models.Order).filter(
        models.Order.verification_proof == payment.utr,
        models.Order.id != order.id # Ignore self
    ).first()
    
    if duplicate_utr:
        raise HTTPException(status_code=400, detail="This UTR has already been used. Please check your transaction details.")

    order.payment_submitted = True
    order.status = "Pending_Verification"
    order.verification_proof = payment.utr # Store UTR in proof column
    
    db.commit()
    return {"message": "Payment submitted for verification", "status": order.status}

@router.post("/verify")
def verify_payment(
    verification: PaymentVerify, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.require_admin)
):
    """Admin verifies payment -> Generates OTP -> Status: Paid"""
    order = db.query(models.Order).filter(models.Order.id == verification.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != "Pending_Verification":
        # Allow re-verification if needed? No, strict flow.
        raise HTTPException(status_code=400, detail=f"Order is not pending verification (Current: {order.status})")

    # Generate cryptographically secure 6-digit OTP
    otp = ''.join(secrets.choice('0123456789') for _ in range(6))
    
    order.status = "Paid"
    order.otp = otp
    order.verified_by = verification.verified_by
    order.payment_submitted = True # Confirm flag
    
    db.commit()
    db.refresh(order)
    return {
        "success": True, 
        "message": "Payment verified", 
        "order_id": order.id,
        "status": order.status,
        "otp": otp 
    }

@router.post("/reject")
def reject_payment(
    rejection: PaymentReject, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.require_admin)
):
    """Admin rejects payment"""
    order = db.query(models.Order).filter(models.Order.id == rejection.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = "Payment_Rejected"
    order.rejection_reason = rejection.reason
    order.verified_by = rejection.rejected_by # Track who rejected
    order.payment_submitted = False # Reset flag so they can try again? Or keep True history? 
    # Logic: If rejected, they must re-submit. Let's keep payment_submitted=False to allow UI to show "Submit" again?
    # Actually ui check status.
    
    db.commit()
    return {"success": True, "message": "Payment rejected", "status": order.status}


# NEW: Cloudinary Payment Proof Endpoints

@router.post("/upload-proof")
async def upload_payment_proof_endpoint(
    order_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_active_user)
):
    """Upload payment screenshot for an order"""
    
    # Validate order exists and belongs to user
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Validate order status
    if order.status not in ["Pending", "Payment_Rejected"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot upload proof for order in '{order.status}' state"
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed")
    
    # Validate file size (max 5MB)
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    
    try:
        # Upload to Cloudinary (no init_cloudinary call - already done at startup)
        public_id = upload_payment_proof(file_bytes, order_id, current_user["id"])
        
        # Store ONLY public_id, not URL
        order.verification_proof = public_id
        # REVIEW FIX: Reset status to Pending_Verification on re-upload
        order.status = "Pending_Verification"
        order.payment_submitted = True
        db.commit()
        
        return {
            "success": True,
            "message": "Payment proof uploaded successfully",
            "public_id": public_id
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{order_id}/payment-proof")
def get_payment_proof_url(
    order_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_active_user)
):
    """Get signed URL for payment proof (owner or admin only)"""
    
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Authorization: Admin OR order owner
    is_authorized = (
        current_user["role"] == "admin" or 
        order.user_id == current_user["id"]
    )
    
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to view payment proof")
    
    if not order.verification_proof:
        raise HTTPException(status_code=404, detail="No payment proof uploaded")
    
    # Check if verification_proof looks like a Cloudinary public_id (not a UTR)
    # Simple heuristic: Cloudinary IDs contain "payment_proofs/"
    if "payment_proofs/" not in order.verification_proof:
        raise HTTPException(
            status_code=404, 
            detail="Payment proof is UTR-based, not an image"
        )
    
    try:
        # Generate signed URL (expires in 5 minutes) - no init call needed
        signed_url = generate_signed_url(order.verification_proof, expiry_seconds=300)
        
        return {
            "url": signed_url,
            "expires_in_seconds": 300
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate URL: {str(e)}")

