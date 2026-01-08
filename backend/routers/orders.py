from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, auth, dependencies

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
)

@router.post("/", response_model=schemas.Order)
def create_order(
    order: schemas.OrderCreate, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_active_user)
):
    """Create a new order with server-side validation and total calculation"""
    try:
        # 1. Calculate Total Amount securely on server side
        total_amount = 0
        valid_items = []

        # Optimize: Fetch all menu items in one query if list is huge, but for simple loop ok
        for item_req in order.items:
            db_menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_req.menu_item_id).first()
            if not db_menu_item:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Menu item with ID {item_req.menu_item_id} not found"
                )
            if not db_menu_item.is_available:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Item '{db_menu_item.name}' is currently unavailable. Please remove it from cart."
                )
            
            # Calculate line total
            line_price = db_menu_item.price * item_req.quantity
            total_amount += line_price
            
            # Prepare OrderItem record
            valid_items.append({
                "menu_item_id": item_req.menu_item_id,
                "quantity": item_req.quantity,
                "price": db_menu_item.price, # Snapshot the price
                "item_name": db_menu_item.name  # For logging
            })

        # Day 8: Sanity check on total amount (prevent malicious large orders)
        if total_amount > 10000:
            raise HTTPException(
                status_code=400,
                detail=f"Order total (₹{total_amount}) exceeds maximum allowed amount (₹10,000)"
            )

        # 2. Create Order Record
        db_order = models.Order(
            total_amount=total_amount,
            status="Pending",
            user_id=current_user["id"]
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)

        # 3. Create OrderItems
        for val_item in valid_items:
            db_order_item = models.OrderItem(
                order_id=db_order.id,
                menu_item_id=val_item["menu_item_id"],
                quantity=val_item["quantity"],
                price=val_item["price"]
            )
            db.add(db_order_item)
        
        db.commit()
        db.refresh(db_order)
        return db_order
    
    except HTTPException:
        # Re-raise HTTP exceptions (validation errors)
        db.rollback()
        raise
    except Exception as e:
        # Rollback on any unexpected error
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create order: {str(e)}"
        )

@router.get("/", response_model=List[schemas.Order])
def get_my_orders(
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_active_user)
):
    """Get current user's order history"""
    # If admin, redirected to admin router usually, but if utilizing this endpoint:
    if current_user["role"] == "admin":
        return db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    
    # Filter by user_id
    # Note: Phase 1/2 verify scripts didn't link user_id to order strictly (nullable=True), 
    # but new auth puts user info in context.
    # We should ensure create_order links the user.
    return db.query(models.Order).filter(models.Order.user_id == current_user["id"]).order_by(models.Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=schemas.Order)
def get_order(
    order_id: int, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_active_user)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

