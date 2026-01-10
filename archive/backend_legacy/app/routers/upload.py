from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from typing import Optional
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/upload", tags=["upload"])

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# Debug: print config to verify it loaded
print(f"Cloudinary configured: {os.getenv('CLOUDINARY_CLOUD_NAME')}")

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    folder: Optional[str] = Form("campus-eats")
):
    """
    Upload an image to Cloudinary
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file contents
        contents = await file.read()
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type="image"
        )
        
        return {
            "success": True,
            "url": result["secure_url"],
            "public_id": result["public_id"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/qr")
async def upload_qr_code(
    file: UploadFile = File(...),
    old_public_id: Optional[str] = Form(None)
):
    """
    Upload a QR Code image to Cloudinary (and delete old one if provided)
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # 1. Delete old image if it exists
        if old_public_id:
            try:
                print(f"Deleting old QR code: {old_public_id}")
                cloudinary.uploader.destroy(old_public_id)
            except Exception as e:
                print(f"Warning: Failed to delete old QR code: {e}")
                # Continue with upload even if delete fails
        
        # 2. Upload new image
        contents = await file.read()
        
        result = cloudinary.uploader.upload(
            contents,
            folder="campus-eats/qr-codes",
            resource_type="image"
        )
        
        return {
            "success": True,
            "url": result["secure_url"],
            "public_id": result["public_id"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
