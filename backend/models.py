from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default="student") # student, admin, kitchen
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Integer)  # Storing in INR integer
    category = Column(String) # e.g., "Breakfast", "Lunch", "Snacks"
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Day 9: CHECK constraints for business rules
    __table_args__ = (
        CheckConstraint('price >= 1', name='menu_item_price_positive'),
    )

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for guest checkout initially
    status = Column(String, default="Pending") # Pending, Preparing, Ready, Completed
    payment_submitted = Column(Boolean, default=False)
    total_amount = Column(Integer) # Stored in integer (INR)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    # Day 9: CHECK constraints for business rules
    __table_args__ = (
        CheckConstraint('total_amount >= 0', name='order_total_non_negative'),
    )

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    # Day 9: CASCADE delete - if order deleted, delete order_items
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"))
    # Day 9: RESTRICT delete - prevent deletion of menu_item if used in orders
    menu_item_id = Column(Integer, ForeignKey("menu_items.id", ondelete="RESTRICT"))
    quantity = Column(Integer)
    price = Column(Integer) # Snapshot of price at time of order

    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem")
    
    # Day 9: CHECK constraints for business rules
    __table_args__ = (
        CheckConstraint('quantity >= 1', name='order_item_quantity_positive'),
        CheckConstraint('price >= 0', name='order_item_price_non_negative'),
    )
