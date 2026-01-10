"""
Payments Router
Handles payment verification and webhooks (when enabled)
"""
from fastapi import APIRouter, HTTPException, Request, Header, Form, File, UploadFile
from pydantic import BaseModel
from typing import Optional
import hmac
import hashlib
import os
import time
import cloudinary
import cloudinary.uploader

from app.services.appwrite_service import appwrite_service
from app.config import settings

router = APIRouter()

# Configure Cloudinary for payments
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


class ManualVerifyRequest(BaseModel):
    orderId: str
    transactionId: Optional[str] = None
    verifiedBy: str


class PaymentModeRequest(BaseModel):
    mode: str
    upi_id: Optional[str] = None
    gateway: Optional[str] = None
    qr_image_url: Optional[str] = None
    qr_public_id: Optional[str] = None


@router.get("/mode")
async def get_payment_mode():
    """
    Get current payment mode.
    Mobile app uses this to decide which UI to show:
    - 'gateway': Show payment gateway integration (auto-verify)
    - 'manual': Show UPI ID + screenshot upload flow
    """
    try:
        mode_info = await appwrite_service.get_payment_mode()
        
        # Also fetch QR settings
        qr_url = await appwrite_service.get_admin_setting("qr_image_url")
        qr_public_id = await appwrite_service.get_admin_setting("qr_public_id")
        
        return {
            "success": True,
            **mode_info,
            "qr_image_url": qr_url.get("value") if qr_url else None,
            "qr_public_id": qr_public_id.get("value") if qr_public_id else None
        }
    except Exception as e:
        # Default to manual if can't determine
        return {
            "success": True,
            "mode": "manual",
            "upi_id": None
        }


@router.post("/mode")
async def set_payment_mode(request: PaymentModeRequest):
    """
    Update payment mode settings
    """
    try:
        print(f"DEBUG: Received set_payment_mode request: {request}") # LOG REQUEST
        if request.mode == 'manual':
            # Disable gateway
            await appwrite_service.save_admin_setting('payment_gateway', 'none', 'payment')
            
            # Handle UPI ID
            if request.upi_id:
                print(f"DEBUG: Saving UPI ID: {request.upi_id}") # LOG UPI SAVE
                await appwrite_service.save_admin_setting('upi_id', request.upi_id, 'payment')
            else:
                # If upi_id is empty/null, delete it
                print("DEBUG: Deleting UPI ID") # LOG UPI DELETE
                await appwrite_service.delete_admin_setting('upi_id')
            
            # Handle QR Image
            if request.qr_image_url:
                await appwrite_service.save_admin_setting('qr_image_url', request.qr_image_url, 'payment')
            else:
                 # If explicit empty string/None sent, user might be deleting it 
                 # (UI logic should handle explicitly sending empty string to delete)
                 if request.qr_image_url == "":
                    await appwrite_service.delete_admin_setting('qr_image_url')

            if request.qr_public_id:
                await appwrite_service.save_admin_setting('qr_public_id', request.qr_public_id, 'payment')
            elif request.qr_public_id == "":
                await appwrite_service.delete_admin_setting('qr_public_id')
                
        elif request.mode == 'gateway' and request.gateway:
            await appwrite_service.save_admin_setting('payment_gateway', request.gateway, 'payment')
            
        return {"success": True, "message": "Payment settings updated"}
    except Exception as e:
        import traceback
        traceback.print_exc() # PRINT FULL STACK TRACE
        print(f"ERROR in set_payment_mode: {str(e)}") # LOG ERROR
        raise HTTPException(status_code=400, detail=f"Detailed Error: {str(e)}")


@router.post("/verify-manual")
async def verify_payment_manual(request: Request):
    """
    Manually verify a payment with screenshot upload (Manual Form Parsing)
    """
    try:
        # Debug incoming form
        form = await request.form()
        print(f"🔍 DEBUG: Received Form Data. Keys: {form.keys()}")
        
        orderId = form.get("orderId")
        transactionId = form.get("transactionId")
        file_obj = form.get("file")
        
        print(f"📝 DEBUG: orderId={orderId}")
        print(f"💳 DEBUG: transactionId={transactionId}")
        print(f"📁 DEBUG: file_obj type: {type(file_obj)}")
        print(f"📁 DEBUG: file_obj: {file_obj}")
        
        if file_obj:
            print(f"📁 DEBUG: file_obj attributes: {dir(file_obj)}")
            if hasattr(file_obj, 'filename'):
                print(f"📁 DEBUG: filename: {file_obj.filename}")
            if hasattr(file_obj, 'content_type'):
                print(f"📁 DEBUG: content_type: {file_obj.content_type}")
            if hasattr(file_obj, 'size'):
                print(f"📁 DEBUG: size: {file_obj.size}")

        if not orderId:
            raise HTTPException(status_code=400, detail="Missing orderId in form data")

        file_bytes = None
        if file_obj and hasattr(file_obj, 'read'):
            print("📁 DEBUG: Reading file content...")
            file_bytes = await file_obj.read()
            print(f"📁 DEBUG: Read {len(file_bytes) if file_bytes else 0} bytes")
        else:
            print("❌ DEBUG: No file_obj or file_obj doesn't have read method")

        print(f"🔄 DEBUG: About to call submit_payment_proof with file_bytes={len(file_bytes) if file_bytes else 0} bytes")

        # Call service - coordinates Cloudinary and Repository update
        try:
            order = await appwrite_service.submit_payment_proof(
                order_id=str(orderId),
                transaction_id=str(transactionId) if transactionId else None,
                file_bytes=file_bytes
            )
            print(f"✅ DEBUG: Order updated via Repository. Status: {order.get('status', 'unknown')}")
            
            # Debug the order response
            print(f"🔍 DEBUG: Full order response keys: {order.keys() if order else 'None'}")
            if order:
                print(f"🔍 DEBUG: payment_screenshot_url: {order.get('payment_screenshot_url')}")
                print(f"🔍 DEBUG: paymentScreenshot: {order.get('paymentScreenshot')}")
                print(f"🔍 DEBUG: screenshotUrl: {order.get('screenshotUrl')}")
                
        except Exception as service_err:
            print(f"❌ ERROR: Repository update failed: {service_err}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Service update failed: {str(service_err)}")
        
        return {
            "success": True,
            "message": "Payment proof submitted via 2.0 Repository",
            "order": order,
            "screenshotUrl": order.get("payment_screenshot_url")
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        # Return 400 but detailed
        raise HTTPException(status_code=400, detail=f"verify-manual failed: {str(e)}")


@router.post("/reject")
async def reject_payment(request: dict):
    """
    Reject a payment
    """
    try:
        order = await appwrite_service.reject_payment(
            order_id=request.get("orderId"),
            rejected_by=request.get("rejectedBy"),
            reason=request.get("reason", "Payment verification failed")
        )
        
        return {
            "success": True,
            "message": "Payment rejected",
            "order": order
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/approve")
async def approve_payment(request: ManualVerifyRequest):
    """
    Approve/Verify a payment (Admin Action)
    """
    try:
        import random
        # Generate OTP
        otp = str(random.randint(100000, 999999))

        order = await appwrite_service.verify_payment(
            order_id=request.orderId,
            verified_by=request.verifiedBy,
            otp=otp,
            transaction_id=request.transactionId
        )
        
        return {
            "success": True,
            "message": "Payment verified",
            "order": order,
            "otp": otp
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


# --- Webhook Endpoint (Disabled by default) ---

@router.post("/webhook")
async def payment_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature")
):
    """
    Handle payment gateway webhooks
    Currently supports: Razorpay
    
    NOTE: This endpoint is disabled until webhook credentials are configured.
    """
    if not settings.WEBHOOK_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Webhook processing is not enabled. Configure WEBHOOK_ENABLED=true and WEBHOOK_SECRET in settings."
        )

    try:
        body = await request.body()
        
        # Verify signature (Razorpay example)
        if x_razorpay_signature and settings.WEBHOOK_SECRET:
            expected = hmac.new(
                settings.WEBHOOK_SECRET.encode(),
                body,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(expected, x_razorpay_signature):
                raise HTTPException(status_code=401, detail="Invalid webhook signature")

        # Parse payload
        import json
        payload = json.loads(body)
        
        # Process based on event type
        event = payload.get("event")
        
        if event == "payment.captured":
            # Payment successful
            payment_id = payload.get("payload", {}).get("payment", {}).get("entity", {}).get("id")
            order_id = payload.get("payload", {}).get("payment", {}).get("entity", {}).get("notes", {}).get("order_id")
            
            if order_id:
                otp = str(random.randint(100000, 999999))
                await appwrite_service.verify_payment(
                    order_id=order_id,
                    verified_by="Webhook",
                    transaction_id=payment_id,
                    otp=otp
                )
                
                # TODO: Send notification to user
                
                return {"success": True, "message": "Payment verified via webhook"}

        return {"success": True, "message": "Webhook received"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/webhook/status")
async def webhook_status():
    """
    Check if webhook processing is enabled
    """
    return {
        "enabled": settings.WEBHOOK_ENABLED,
        "message": "Configure WEBHOOK_ENABLED and WEBHOOK_SECRET to enable" if not settings.WEBHOOK_ENABLED else "Webhooks are active"
    }
