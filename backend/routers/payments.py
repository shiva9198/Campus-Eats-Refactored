from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models, database, dependencies

router = APIRouter(
    prefix="/payments",
    tags=["payments"],
)

from pydantic import BaseModel, Field

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
def submit_payment(payment: PaymentSubmit, db: Session = Depends(database.get_db)):
    """Student submits payment proof (Manual UTR Only)"""
    order = db.query(models.Order).filter(models.Order.id == payment.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
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

    # Generate OTP (Simple 4-digit for demo)
    import random
    otp = str(random.randint(1000, 9999))
    
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

