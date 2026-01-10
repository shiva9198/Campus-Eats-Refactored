"""
Admin Router
Handles admin operations, settings, and analytics
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from app.services.appwrite_service import appwrite_service
from app.services.encryption import encrypt_value, decrypt_value
from app.services.broadcast_service import broadcast_service
from app.config import settings


router = APIRouter()


class AdminSettingRequest(BaseModel):
    key: str
    value: str
    category: str  # payment, email, notification


class AdminSettingResponse(BaseModel):
    key: str
    value: str  # Masked for sensitive data
    category: str
    updatedAt: Optional[int] = None


# --- Settings Endpoints ---

@router.get("/settings")
async def get_settings():
    """
    Get all admin settings (values masked for sensitive keys)
    """
    try:
        settings_list = await appwrite_service.list_admin_settings()
        
        # Mask sensitive values
        masked = []
        sensitive_keys = ["password", "secret", "key", "api"]
        for s in settings_list:
            is_sensitive = any(k in s["key"].lower() for k in sensitive_keys)
            masked.append({
                "key": s["key"],
                "value": "********" if is_sensitive else s.get("value", ""),
                "category": s.get("category", "general"),
                "updatedAt": s.get("updatedAt")
            })
        
        return {"success": True, "settings": masked}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/settings")
async def save_setting(request: AdminSettingRequest):
    """
    Save an admin setting (sensitive values are encrypted)
    """
    try:
        # Encrypt sensitive values
        sensitive_keys = ["password", "secret", "key", "api"]
        is_sensitive = any(k in request.key.lower() for k in sensitive_keys)
        
        value_to_store = encrypt_value(request.value) if is_sensitive else request.value
        
        result = await appwrite_service.save_admin_setting(
            key=request.key,
            value=value_to_store,
            category=request.category
        )
        
        # Trigger Broadcast for Guard Logic
        if "status" in request.key.lower():
            is_open = request.value.lower() in ["open", "true", "active", "1"]
            if "shop" in request.key.lower():
                await broadcast_service.notify_shop_status(is_open)
            else:
                await broadcast_service.notify_section_status(request.key, is_open)
        
        return {"success": True, "message": f"Setting '{request.key}' saved"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/settings/{key}")
async def delete_setting(key: str):
    """
    Delete an admin setting
    """
    try:
        await appwrite_service.delete_admin_setting(key)
        return {"success": True, "message": f"Setting '{key}' deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Analytics Endpoints ---

@router.get("/analytics")
async def get_analytics():
    """
    Get dashboard analytics
    """
    try:
        # Get order counts by status
        stats = await appwrite_service.get_order_stats()
        
        return {
            "success": True,
            "analytics": {
                "pendingVerification": stats.get("pending_verification", 0),
                "preparing": stats.get("preparing", 0),
                "ready": stats.get("ready", 0),
                "completed": stats.get("completed", 0),
                "rejected": stats.get("payment_rejected", 0),
                "totalOrders": stats.get("total", 0)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/sales")
async def get_sales_analytics(days: int = 7):
    """
    Get sales analytics for the past N days
    """
    try:
        sales = await appwrite_service.get_sales_by_day(days)
        return {"success": True, "sales": sales}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/popular-items")
async def get_popular_items(limit: int = 10):
    """
    Get most popular menu items
    """
    try:
        items = await appwrite_service.get_popular_items(limit)
        return {"success": True, "items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
