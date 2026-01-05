from backend.database import SessionLocal, engine
from backend.models import MenuItem, Base

# Create tables if not exist (redundant but safe)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if item exists
existing = db.query(MenuItem).filter(MenuItem.name == "Test Burger").first()
if not existing:
    item = MenuItem(
        name="Test Burger",
        price=100, # ₹1.00 or 100 rupees? Assuming 100 INR based on logic
        category="Fast Food",
        description="Juicy test burger",
        is_available=True
    )
    db.add(item)
    db.commit()
    print(f"Created Item: {item.id}")
else:
    print(f"Item exists: {existing.id}")

db.close()
