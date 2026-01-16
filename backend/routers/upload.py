from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import shutil
import os
import uuid
from typing import List

router = APIRouter(
    prefix="/upload",
    tags=["upload"]
)

UPLOAD_DIR = "static/uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image file (Day 11: Phase 3 Foundation).
    Saves to local storage (production-safe for this scale).
    """
    # 1. Validate File Extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG, PNG, WEBP allowed.")

    # 2. Validate File Size (enforce MAX_FILE_SIZE limit)
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_FILE_SIZE // 1024 // 1024}MB.")
    await file.seek(0)  # Reset file pointer for saving

    # 3. Generate Secure Filename
    secure_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, secure_filename)

    # 4. Save File
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    # 5. Return Public URL
    # Assuming app is running at root, static mounted at /static
    # In production, this domain should be configured via env vars.
    # For now, we return a relative path or full path based on request not available easily here without Request object.
    # Returning clean relative path is safest for Client to prepend base URL.
    
    return {
        "url": f"/static/uploads/{secure_filename}",
        "filename": secure_filename,
        "success": True
    }
