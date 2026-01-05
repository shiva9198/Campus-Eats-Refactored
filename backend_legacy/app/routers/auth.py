"""
Authentication Router
Handles login, registration, and OTP verification
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional
import random
import time

from app.services.appwrite_service import appwrite_service
from app.services.email_service import email_service
from app.config import settings

router = APIRouter()

# In-memory OTP storage (use Redis in production)
otp_store: dict = {}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    mobileNumber: str
    department: Optional[str] = "General"


class SendOTPRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))


@router.post("/login")
async def login(request: LoginRequest):
    """
    Login user with email and password
    """
    try:
        session = await appwrite_service.create_session(
            request.email, 
            request.password
        )
        return {
            "success": True,
            "session": session
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/register")
async def register(request: RegisterRequest, background_tasks: BackgroundTasks):
    """
    Register a new user and send verification OTP
    """
    try:
        # Create user in Appwrite Auth
        user = await appwrite_service.create_user(
            email=request.email,
            password=request.password,
            name=request.name
        )

        # Create user document in database
        user_doc = await appwrite_service.create_user_document(
            user_id=user["$id"],
            name=request.name,
            email=request.email,
            password=request.password,  # Note: Store hashed in production
            mobile_number=request.mobileNumber,
            department=request.department
        )

        # Generate and store OTP
        otp = generate_otp()
        otp_store[request.email] = {
            "otp": otp,
            "expires": time.time() + (settings.OTP_EXPIRY_MINUTES * 60),
            "user_id": user["$id"]
        }

        # Send OTP email in background
        if settings.SMTP_HOST:
            background_tasks.add_task(
                email_service.send_otp_email,
                request.email,
                request.name,
                otp
            )
        
        # ALWAYS PRINT OTP FOR DEBUGGING IN RENDER LOGS
        print(f"============================================")
        print(f"DEBUG OTP for {request.email}: {otp}")
        print(f"============================================")

        return {
            "success": True,
            "message": "Registration successful. Please check Render logs for OTP if email fails.",
            "userId": user["$id"],
            "debug_otp": otp  # Always return OTP for now
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/send-otp")
async def send_otp(request: SendOTPRequest, background_tasks: BackgroundTasks):
    """
    Send OTP to email for verification
    """
    otp = generate_otp()
    otp_store[request.email] = {
        "otp": otp,
        "expires": time.time() + (settings.OTP_EXPIRY_MINUTES * 60)
    }

    # Send email synchronously to debug issues
    email_success = False
    email_message = "Email not configured"
    
    
    if settings.SMTP_HOST:
        background_tasks.add_task(
            email_service.send_otp_email,
            request.email,
            "User",
            otp
        )
        email_message = "Email sending queued in background"
    else:
        email_message = "SMTP not configured"
        
    print(f"============================================")
    print(f"DEBUG OTP for {request.email}: {otp}")
    print(f"============================================")
    
    return {
        "success": True, # Keep true to not block UI flow
        "message": f"OTP Status: {email_message} (Check Logs)",
        "debug_otp": otp, # Always return debug OTP
        "email_sent": email_success
    }


@router.post("/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """
    Verify OTP and mark user as verified
    """
    stored = otp_store.get(request.email)

    if not stored:
        raise HTTPException(status_code=400, detail="No OTP found for this email")

    if time.time() > stored["expires"]:
        del otp_store[request.email]
        raise HTTPException(status_code=400, detail="OTP has expired")

    if stored["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # OTP is valid - update user
    if "user_id" in stored:
        try:
            await appwrite_service.update_user_verified(stored["user_id"])
        except Exception as e:
            print(f"Failed to update user verification: {e}")

    del otp_store[request.email]

    return {"success": True, "message": "Email verified successfully"}
