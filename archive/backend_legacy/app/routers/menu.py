from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services.appwrite_service import appwrite_service

router = APIRouter()

@router.get("/")
async def list_menu(limit: int = Query(100, le=100)):
    """
    List all menu items.
    Used by the mobile Home screen.
    """
    try:
        items = await appwrite_service.list_menu_items(limit=limit)
        return {"success": True, "items": items}
    except Exception as e:
        print(f"Error fetching menu: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{item_id}")
async def get_menu_item(item_id: str):
    """
    Get a specific menu item.
    """
    try:
        item = await appwrite_service.menu_repo.get_item(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"success": True, "item": item}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
