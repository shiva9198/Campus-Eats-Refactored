from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

# --- Menu Item Schemas ---
class MenuItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price: int = Field(..., ge=1, le=1000, description="Price in INR (₹1 to ₹1,000)")
    category: str = Field(..., min_length=1, max_length=50)
    image_url: Optional[str] = Field(None, max_length=500)
    is_available: bool = True
    
    @field_validator('image_url')
    @classmethod
    def validate_image_url(cls, v):
        """Basic Cloudinary URL validation"""
        if v and not (v.startswith('http://') or v.startswith('https://')):
            raise ValueError('Image URL must be a valid HTTP/HTTPS URL')
        return v

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemAvailabilityUpdate(BaseModel):
    is_available: bool

class MenuItem(MenuItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Order Schemas ---

class OrderItemBase(BaseModel):
    menu_item_id: int
    quantity: int = Field(..., ge=1, le=50, description="Quantity (1-50 items)")

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    price: int # Snapshot price

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1, max_length=30, description="Cart items (max 30)")
    
    @field_validator('items')
    @classmethod
    def validate_total_quantity(cls, v):
        """Validate total cart quantity doesn't exceed reasonable limit"""
        total_qty = sum(item.quantity for item in v)
        if total_qty > 100:
            raise ValueError(f'Total cart quantity ({total_qty}) exceeds maximum (100 items)')
        return v

class Order(BaseModel):
    id: int
    status: str
    total_amount: int
    created_at: datetime
    items: List[OrderItem]

    class Config:
        from_attributes = True
