#!/usr/bin/env python3
"""
Seed Load Test Users for Campus Eats
Creates 100 test users (loadtest1 to loadtest100) for load testing
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
import database
import models
from auth import get_password_hash

def seed_load_test_users():
    """Create 100 test users for load testing"""
    db: Session = database.SessionLocal()
    
    try:
        print("🔄 Seeding load test users...")
        
        # Check if users already exist
        existing_user = db.query(models.User).filter(
            models.User.username == "loadtest1"
        ).first()
        
        if existing_user:
            print("⚠️  Load test users already exist. Skipping...")
            return
        
        # Create 100 test users
        hashed_password = get_password_hash("test123456")
        users_created = 0
        
        for i in range(1, 101):
            username = f"loadtest{i}"
            email = f"loadtest{i}@campus.edu"
            
            user = models.User(
                username=username,
                email=email,
                hashed_password=hashed_password,
                role="student",
                is_active=True
            )
            db.add(user)
            users_created += 1
            
            # Commit in batches of 20
            if users_created % 20 == 0:
                db.commit()
                print(f"  ✓ Created {users_created} users...")
        
        # Final commit
        db.commit()
        print(f"✅ Successfully created {users_created} load test users!")
        print(f"   Username: loadtest1 to loadtest100")
        print(f"   Password: test123456")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding users: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_load_test_users()
