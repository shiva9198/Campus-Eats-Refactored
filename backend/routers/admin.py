from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from db import models, schemas, session as database
from core import dependencies
from services.pubsub import publish_order_update
from services.cache import get_cached, invalidate_cache

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

class OrderStatusUpdate(BaseModel):
    status: str

@router.get("/orders", response_model=List[schemas.OrderAdminView])
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
        "Pending": ["Preparing", "Pending_Verification"],
        "Pending_Verification": ["Paid", "Payment_Rejected"],
        "Payment_Rejected": ["Pending_Verification"], # Retry
        "Paid": ["Preparing"],
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
    
    # Publish real-time update and invalidate cache
    publish_order_update(order.id, order.user_id, order.status)
    invalidate_cache(f"cache:order:{order.id}")
    invalidate_cache("cache:admin:stats")
    
    return order


# --- Day 11: Settings API ---

@router.get("/settings", response_model=List[schemas.Setting])
def get_settings(db: Session = Depends(database.get_db), current_user: dict = Depends(dependencies.require_admin)):
    """Get all global settings"""
    return db.query(models.Setting).all()

@router.post("/settings", response_model=schemas.Setting)
def save_setting(
    setting: schemas.SettingCreate, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.require_admin)
):
    """Save or update a global setting"""
    db_setting = db.query(models.Setting).filter(models.Setting.key == setting.key).first()
    
    if db_setting:
        db_setting.value = setting.value
        db_setting.category = setting.category
        db_setting.description = setting.description
        # updated_at auto-updates
    else:
        db_setting = models.Setting(**setting.model_dump())
        db.add(db_setting)
    
    db.commit()
    db.refresh(db_setting)

    # Publish shop status update if changed
    if setting.key == "shop_status":
        from services.pubsub import publish_shop_status
        is_open = (setting.value != "closed")
        publish_shop_status(is_open)
        
    return db_setting

# --- Day 11: Stats API ---

@router.get("/stats")
def get_admin_stats(db: Session = Depends(database.get_db), current_user: dict = Depends(dependencies.require_admin)):
    """Get aggregated dashboard statistics with Redis caching (120s TTL)"""
    
    def fetch_stats():
        # 1. Orders by Status
        # This is a basic aggregation. In a large system, use select(func.count).
        orders_all = db.query(models.Order).all()
        
        stats = {
            "Pending": 0,
            "Preparing": 0,
            "Ready": 0,
            "Completed": 0,
            "Paid": 0,
            "Pending_Verification": 0,
            "Revenue": 0,
            "Total_Orders": len(orders_all)
        }
        
        from datetime import datetime, date
        today_revenue = 0
        today = date.today()

        for o in orders_all:
            # Count statuses
            if o.status in stats:
                stats[o.status] += 1
            
            # Count Revenue (Paid or Completed)
            # Note: "Paid" state means money is in. "Completed" usually implies paid too.
            if o.status in ["Paid", "Completed", "Preparing", "Ready"]:
                stats["Revenue"] += o.total_amount
                
                # Today's Revenue
                if o.created_at.date() == today:
                    today_revenue += o.total_amount

        return {
            "counts": stats,
            "revenue": {
                "total": stats["Revenue"],
                "today": today_revenue
            }
        }
    
    return get_cached("cache:admin:stats", 120, fetch_stats)



class OTPVerify(BaseModel):
    otp: str

@router.post("/verify-otp", response_model=schemas.Order)
def verify_collection_otp(
    verification: OTPVerify,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.require_admin)
):
    """
    Step 1 of Collection: Verify OTP and fetch order details.
    Admin enters OTP -> System finds matching UNCOLLECTED order.
    """
    # Find order with this OTP that is NOT Completed
    order = db.query(models.Order).filter(
        models.Order.otp == verification.otp,
        models.Order.status != "Completed" # Only fetch valid, uncollected orders
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=404, 
            detail="Invalid OTP or Order already collected."
        )
        
    return order
