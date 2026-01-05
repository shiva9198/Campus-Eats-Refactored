"""
Orders Router
Handles order CRUD operations
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import json

from app.services.appwrite_service import appwrite_service

router = APIRouter()


class OrderItem(BaseModel):
    name: str
    qty: int
    price: float


class CreateOrderRequest(BaseModel):
    userId: str
    items: List[OrderItem]
    amount: float


class UpdateStatusRequest(BaseModel):
    status: str
    updatedBy: Optional[str] = None


@router.get("/")
async def list_orders(
    user_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(25, le=100)
):
    """
    List orders with optional filters
    """
    try:
        orders = await appwrite_service.list_orders(
            user_id=user_id,
            status=status,
            limit=limit
        )
        return {"success": True, "orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{order_id}")
async def get_order(order_id: str):
    """
    Get a specific order by ID
    """
    try:
        order = await appwrite_service.get_order(order_id)
        return {"success": True, "order": order}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/")
async def create_order(request: CreateOrderRequest):
    """
    Create a new order
    """
    try:
        order = await appwrite_service.create_order(
            user_id=request.userId,
            items=[item.model_dump() for item in request.items],
            amount=request.amount
        )
        return {"success": True, "order": order}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, request: UpdateStatusRequest):
    """
    Update order status
    """
    try:
        order = await appwrite_service.update_order_status(
            order_id=order_id,
            status=request.status,
            updated_by=request.updatedBy
        )
        return {"success": True, "order": order}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/user/{user_id}")
async def get_user_orders(user_id: str):
    """
    Get all orders for a specific user
    """
    try:
        orders = await appwrite_service.list_orders(user_id=user_id, limit=50)
        return {"success": True, "orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-orders/{user_id}")
async def get_my_orders(user_id: str):
    """
    Get current user's orders (Aliased for My Orders screen)
    """
    try:
        orders = await appwrite_service.list_orders(user_id=user_id, limit=30)
        return {"success": True, "orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

