from sqlalchemy import create_engine, text
import models
from database import SQLALCHEMY_DATABASE_URL as DATABASE_URL

def update_schema():
    print("Connecting to database...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Checking 'orders' table for missing columns...")
        
        # Add otp column
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN otp VARCHAR"))
            print("Added 'otp' column.")
        except Exception:
            print("'otp' column likely exists.")

        # Add verified_by column
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN verified_by VARCHAR"))
            print("Added 'verified_by' column.")
        except Exception:
            print("'verified_by' column likely exists.")

        # Add verification_proof column
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN verification_proof VARCHAR"))
            print("Added 'verification_proof' column.")
        except Exception:
            print("'verification_proof' column likely exists.")
            
        # Add rejection_reason column
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN rejection_reason VARCHAR"))
            print("Added 'rejection_reason' column.")
        except Exception:
            print("'rejection_reason' column likely exists.")
            
        conn.commit()
    
    print("✅ Schema update complete.")

if __name__ == "__main__":
    update_schema()
