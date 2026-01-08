from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, auth, dependencies
from cache import get_cached, invalidate_cache
from pubsub import publish_menu_update

router = APIRouter(
    prefix="/menu",
    tags=["menu"],
)

@router.get("/", response_model=List[schemas.MenuItem])
def get_menu(db: Session = Depends(database.get_db)):
    """Get menu with Redis caching (60s TTL)"""
    def fetch_menu():
        # Return ALL items (Day 5 requirement: Show Out of Stock items)
        items = db.query(models.MenuItem).all()
        return [schemas.MenuItem.model_validate(item) for item in items]
    
    return get_cached("cache:menu:all", 60, fetch_menu)

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
        
        # Invalidate cache and publish update
        invalidate_cache("cache:menu:all")
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
    
    # Invalidate cache and publish update
    invalidate_cache("cache:menu:all")
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
    
    # Invalidate cache and publish update
    invalidate_cache("cache:menu:all")
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
        
        # Invalidate cache and publish update
        invalidate_cache("cache:menu:all")
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
