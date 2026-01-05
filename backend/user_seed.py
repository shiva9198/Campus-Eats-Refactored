from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import auth
import logging

# Setup Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

def seed_users():
    db = SessionLocal()
    try:
        # Create Tables if not exist
        models.Base.metadata.create_all(bind=engine)
        
        # 1. Admin User
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            logger.info("Creating default Admin user...")
            hashed_pwd = auth.get_password_hash("admin123")
            admin_user = models.User(
                username="admin",
                email="admin@campuseats.com",
                hashed_password=hashed_pwd,
                full_name="System Admin",
                role="admin"
            )
            db.add(admin_user)
        else:
            logger.info("Admin user already exists.")

        # 2. Student User (Test)
        student = db.query(models.User).filter(models.User.username == "student").first()
        if not student:
            logger.info("Creating default Student user...")
            hashed_pwd = auth.get_password_hash("student123")
            student_user = models.User(
                username="student",
                email="student@campuseats.com",
                hashed_password=hashed_pwd,
                full_name="Test Student",
                role="student"
            )
            db.add(student_user)
        else:
            logger.info("Student user already exists.")
            
        db.commit()
        logger.info("✅ User seeding completed successfully.")
        
    except Exception as e:
        logger.error(f"❌ Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
