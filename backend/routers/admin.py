from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import models, schemas, database, dependencies

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

class OrderStatusUpdate(BaseModel):
    status: str

@router.get("/orders", response_model=List[schemas.Order])
def get_orders(
    status: Optional[str] = None, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.require_admin)
):
    query = db.query(models.Order)
    if status:
        query = query.filter(models.Order.status == status)
    # Most recent first
    return query.order_by(models.Order.created_at.desc()).all()

@router.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: int, 
    update: OrderStatusUpdate, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.require_admin)
):
    """Update order status with strict state machine enforcement (Day 8 hardening)"""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Day 8: Strict State Machine Logic (Linear Transitions Only)
    # Pending → Preparing → Ready → Completed
    # NO REJECTED status in Batch-2 (keep scope stable)
    valid_transitions = {
        "Pending": ["Preparing"],
        "Preparing": ["Ready"],
        "Ready": ["Completed"],
        "Completed": [],  # Terminal state
    }
    
    current_status = order.status
    new_status = update.status
    
    # Validate transition
    allowed_next_states = valid_transitions.get(current_status, [])
    if new_status not in allowed_next_states:
        if new_status == current_status:
            # Idempotent: same state is OK
            return order
        
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid status transition: '{current_status}' → '{new_status}'. "
                f"Allowed transitions from '{current_status}': {allowed_next_states if allowed_next_states else 'None (terminal state)'}"
            )
        )

    order.status = update.status
    db.commit()
    db.refresh(order)
    return order

