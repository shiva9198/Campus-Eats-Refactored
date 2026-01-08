from database import engine
from sqlalchemy import text

def update_schema():
    print("Updating schema for Menu Items...")
    
    # Add image_url
    try:
        with engine.connect() as conn:
            with conn.begin():
                conn.execute(text("ALTER TABLE menu_items ADD COLUMN image_url VARCHAR"))
        print("Added image_url column.")
    except Exception as e:
        print(f"Index/Column error (image_url): {e}")

    # Add is_vegetarian
    try:
        with engine.connect() as conn:
            with conn.begin():
                conn.execute(text("ALTER TABLE menu_items ADD COLUMN is_vegetarian BOOLEAN DEFAULT TRUE"))
        print("Added is_vegetarian column.")
    except Exception as e:
        print(f"Index/Column error (is_vegetarian): {e}")

    print("Schema update complete.")

if __name__ == "__main__":
    update_schema()
