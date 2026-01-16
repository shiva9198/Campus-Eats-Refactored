from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db import models, schemas, session as database
from core import auth, dependencies
from services.cache import get_cached, invalidate_cache, menu_cache
from services.pubsub import publish_menu_update

router = APIRouter(
    prefix="/menu",
    tags=["menu"],
)

@router.get("/", response_model=List[schemas.MenuItem])
def get_menu(db: Session = Depends(database.get_db)):
    """
    Get menu with multi-layer caching for performance:
    1. In-memory cache (instant, 10 min TTL)
    2. Redis cache (fast, 60s TTL)
    3. Database query (fallback)
    """
    # Try in-memory cache first (fastest)
    cached_menu = menu_cache.get()
    if cached_menu:
        return cached_menu
    
    # Fetch from db.session (Redis caching happens inside get_cached)
    items = db.query(models.MenuItem).all()
    menu_data = [schemas.MenuItem.model_validate(item).model_dump() for item in items]
    
    # Store in in-memory cache for next request
    menu_cache.set(menu_data)
    
    return menu_data

@router.get("/status")
def get_shop_status(db: Session = Depends(database.get_db)):
    """Public endpoint to check if shop is open"""
    shop_setting = db.query(models.Setting).filter(models.Setting.key == "shop_status").first()
    # Default to open if not set
    is_open = True
    if shop_setting and shop_setting.value == "closed":
        is_open = False
    
    return {"status": "open" if is_open else "closed", "is_open": is_open}


@router.post("/", response_model=schemas.MenuItem)
def create_menu_item(
    item: schemas.MenuItemCreate, 
    db: Session = Depends(database.get_db), 
    current_user: dict = Depends(dependencies.require_admin)
):
    """Create a new menu item (admin only)"""
    # Role check handled by dependency
    
    try:
        db_item = models.MenuItem(**item.model_dump())
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        
        # Invalidate both caches and publish update
        invalidate_cache("cache:menu:all")
        menu_cache.invalidate()
        publish_menu_update("created", db_item.id)
        
        return db_item
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create menu item: {str(e)}"
        )
@router.put("/{menu_item_id}", response_model=schemas.MenuItem)
def update_menu_item(
    menu_item_id: int,
    item_update: schemas.MenuItemCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.require_admin)
):
    """Update a menu item (admin only)"""
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == menu_item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    for key, value in item_update.model_dump().items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)
    
    # Invalidate both caches and publish update
    invalidate_cache("cache:menu:all")
    menu_cache.invalidate()
    publish_menu_update("updated", menu_item_id)
    
    return db_item


@router.patch("/{menu_item_id}/availability", response_model=schemas.MenuItem)
def update_menu_item_availability(
    menu_item_id: int, 
    availability: schemas.MenuItemAvailabilityUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.require_admin)
):
    """Update menu item availability (admin only)"""

    item = db.query(models.MenuItem).filter(models.MenuItem.id == menu_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.is_available = availability.is_available
    db.commit()
    db.refresh(item)
    
    # Invalidate both caches and publish update
    invalidate_cache("cache:menu:all")
    menu_cache.invalidate()
    publish_menu_update("updated", menu_item_id)
    
    return item

@router.delete("/{menu_item_id}")
def delete_menu_item(
    menu_item_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.require_admin)
):
    """Delete a menu item (admin only, Day 9 - with safety check)
    
    Will fail if item is used in any orders (RESTRICT foreign key constraint).
    Returns 409 Conflict if deletion blocked by database constraint.
    """
    
    item = db.query(models.MenuItem).filter(models.MenuItem.id == menu_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    try:
        db.delete(item)
        db.commit()
        
        # Invalidate both caches and publish update
        invalidate_cache("cache:menu:all")
        menu_cache.invalidate()
        publish_menu_update("deleted", menu_item_id)
        
        return {"message": f"Menu item '{item.name}' deleted successfully"}
    except Exception as e:
        db.rollback()
        # Database RESTRICT constraint will prevent deletion if item used in orders
        if "RESTRICT" in str(e) or "foreign key" in str(e).lower():
            raise HTTPException(
                status_code=409,
                detail=f"Cannot delete menu item '{item.name}'. It is used in existing orders. Mark as unavailable instead."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete menu item: {str(e)}"
            )
