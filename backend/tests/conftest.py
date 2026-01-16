# CRITICAL: Set TESTING environment variable BEFORE any other imports
# This must be done first so the rate limit middleware (which checks this at import time)
# knows to skip rate limiting during tests
import os
os.environ["TESTING"] = "true"

"""
Campus Eats Backend Test Configuration
Uses in-memory SQLite for isolated, fast tests with fixtures for users, menu items, and auth headers.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os

# Add backend to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import Base, get_db
from main import app
from db import models
from core.auth import get_password_hash

# Use in-memory SQLite for testing (faster, isolated)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database override"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_student(db):
    """Create a test student user"""
    student = models.User(
        username="teststudent",
        email="student@test.com",
        hashed_password=get_password_hash("password123"),
        role="student",
        is_active=True
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@pytest.fixture
def test_admin(db):
    """Create a test admin user"""
    admin = models.User(
        username="testadmin",
        email="admin@test.com",
        hashed_password=get_password_hash("adminpass123"),
        role="admin",
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@pytest.fixture
def auth_headers_student(client, test_student):
    """Get auth headers for student"""
    response = client.post(
        "/token",
        data={"username": "teststudent", "password": "password123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_admin(client, test_admin):
    """Get auth headers for admin"""
    response = client.post(
        "/token",
        data={"username": "testadmin", "password": "adminpass123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_menu_item(db):
    """Create a sample menu item"""
    item = models.MenuItem(
        name="Test Samosa",
        description="Delicious test samosa",
        price=20,  # Integer INR
        category="Snacks",
        is_vegetarian=True,
        is_available=True,
        image_url="https://test.com/samosa.jpg"
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@pytest.fixture
def multiple_menu_items(db):
    """Create multiple menu items"""
    items = []
    for i, (name, price, category) in enumerate([
        ("Samosa", 15, "Snacks"),
        ("Chai", 10, "Beverages"),
        ("Biryani", 120, "Main Course"),
        ("Gulab Jamun", 25, "Desserts"),
    ]):
        item = models.MenuItem(
            name=name,
            description=f"Delicious {name}",
            price=price,
            category=category,
            is_vegetarian=True,
            is_available=True
        )
        db.add(item)
        items.append(item)
    db.commit()
    for item in items:
        db.refresh(item)
    return items


@pytest.fixture
def shop_open(db):
    """Ensure shop is open for testing"""
    setting = models.Setting(
        key="shop_status",
        value="open",
        category="shop"
    )
    db.add(setting)
    db.commit()
    return setting
