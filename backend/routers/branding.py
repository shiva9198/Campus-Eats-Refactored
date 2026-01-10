from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/campus",
    tags=["branding"],
)

class BrandingResponse(BaseModel):
    name: str
    logoUrl: str

@router.get("/branding", response_model=BrandingResponse)
async def get_branding():
    """
    Returns campus-specific branding information.
    Static configuration for Release.
    """
    import time
    timestamp = int(time.time())
    return {
        "name": "Campus Eats University",
        # Relative path to allow client to construct full URL based on its connection (LAN/Emulator)
        "logoUrl": f"/static/logo.png?v={timestamp}" 
    }
