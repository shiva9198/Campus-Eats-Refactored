"""
Cloudinary Configuration and Helper Functions
Secure payment proof uploads with signed URLs
"""

import time
import cloudinary
import cloudinary.uploader
import cloudinary.api
from pydantic_settings import BaseSettings
from functools import lru_cache


class CloudinarySettings(BaseSettings):
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_cloudinary_settings():
    return CloudinarySettings()


def init_cloudinary():
    """Initialize Cloudinary configuration - call once at startup"""
    settings = get_cloudinary_settings()
    
    if not settings.cloudinary_cloud_name:
        return False
    
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True
    )
    return True


def upload_payment_proof(file_bytes: bytes, order_id: int, user_id: int) -> str:
    """
    Upload payment proof to Cloudinary as private resource
    
    Args:
        file_bytes: Image file bytes
        order_id: Order ID
        user_id: User ID
    
    Returns:
        public_id (NOT URL) - store this in database
    """
    result = cloudinary.uploader.upload(
        file_bytes,
        folder="payment_proofs",
        public_id=f"order_{order_id}_user_{user_id}",
        resource_type="image",
        type="private",  # CRITICAL: Private access only
        overwrite=True,
        invalidate=True
    )
    
    return result['public_id']


def generate_signed_url(public_id: str, expiry_seconds: int = 300) -> str:
    """
    Generate signed URL for private image
    
    Args:
        public_id: Cloudinary public_id from db.session
        expiry_seconds: URL expiry time (default: 5 minutes)
    
    Returns:
        Signed URL with expiration
    """
    url, options = cloudinary.utils.cloudinary_url(
        public_id,
        type="private",
        sign_url=True,
        secure=True,
        expires_at=int(time.time()) + expiry_seconds
    )
    
    return url
