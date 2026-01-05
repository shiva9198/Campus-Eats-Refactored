from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, auth, dependencies

router = APIRouter(
    prefix="/menu",
    tags=["menu"],
)

@router.get("/", response_model=List[schemas.MenuItem])
def get_menu(db: Session = Depends(database.get_db)):
    # Return ALL items (Day 5 requirement: Show Out of Stock items)
    items = db.query(models.MenuItem).all()
    return items

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
        return db_item
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create menu item: {str(e)}"
        )


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
