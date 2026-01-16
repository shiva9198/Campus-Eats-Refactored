from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

# --- User Schemas ---

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    role: str = "student"

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

# --- Menu Item Schemas ---
class MenuItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price: int = Field(..., ge=1, le=1000, description="Price in INR (₹1 to ₹1,000)")
    category: str = Field(..., min_length=1, max_length=50)
    image_url: Optional[str] = Field(None, max_length=500)
    is_vegetarian: bool = True
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
    user_id: Optional[int] = None
    status: str
    total_amount: int
    created_at: datetime
    items: List[OrderItem]
    
    # Day 11 Fields
    otp: Optional[str] = None
    verification_proof: Optional[str] = None
    rejection_reason: Optional[str] = None
    verified_by: Optional[str] = None

    # Include User Details
    user: Optional[UserBase] = None

    class Config:
        from_attributes = True

class OrderAdminView(BaseModel):
    """Admin view of order - HIDES OTP"""
    id: int
    user_id: Optional[int] = None
    status: str
    total_amount: int
    created_at: datetime
    items: List[OrderItem]
    
    # Exclude OTP? No, Admin needs to see it for manual verification if needed
    otp: Optional[str] = None
    verification_proof: Optional[str] = None
    rejection_reason: Optional[str] = None
    verified_by: Optional[str] = None
    
    user: Optional[UserBase] = None

    class Config:
        from_attributes = True




# --- Setting Schemas (Day 11) ---

class SettingBase(BaseModel):
    key: str
    value: str
    category: Optional[str] = "general"
    description: Optional[str] = None

class SettingCreate(SettingBase):
    pass

class Setting(SettingBase):
    updated_at: datetime

    class Config:
        from_attributes = True



