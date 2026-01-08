import requests
import json
import logging
from datetime import datetime
import random

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)

# Constants
BASE_URL = "http://localhost:8000"

def log(msg, level="INFO"):
    if level == "INFO": logging.info(msg)
    elif level == "WARN": logging.warning(msg)
    elif level == "ERROR": logging.error(msg)

def test_stage3():
    log("Starting Stage 3 Verification (Student Experience Gaps)...")

    # 0. Admin Setup: Ensure Item is Available
    # ----------------------------------------
    log("Admin Setup: Ensuring item is available...")
    admin_token = ""
    try:
        resp = requests.post(f"{BASE_URL}/token", data={"username": "admin", "password": "admin123"})
        if resp.status_code == 200:
            admin_token = resp.json()["access_token"]
            log("Admin Login Successful.")
        else:
            log(f"Admin Login Failed: {resp.text}", "WARN")
    except Exception as e:
        log(f"Admin Login Exception: {e}", "WARN")

    # 1. Registration
    # ----------------
    rand_id = random.randint(1000, 9999)
    s_user = f"student_new_{rand_id}"
    s_email = f"student_{rand_id}@example.com"
    s_pass = "student123"

    log(f"Testing Registration for {s_user}...")
    try:
        resp = requests.post(f"{BASE_URL}/register", json={"username": s_user, "email": s_email, "password": s_pass, "role": "student"})
        if resp.status_code == 200:
            log("Registration Successful.")
            user_data = resp.json()
            if user_data["username"] != s_user:
                log("Registration mismatch!", "ERROR")
        else:
            log(f"Registration Failed: {resp.status_code} {resp.text}", "ERROR")
            return
    except Exception as e:
        log(f"Registration Exception: {e}", "ERROR")
        return

    # 2. Login
    # --------
    log("Testing Automatic Login after Registration config...")
    resp = requests.post(f"{BASE_URL}/token", data={"username": s_user, "password": s_pass})
    if resp.status_code == 200:
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        log("Login Successful.")
    else:
        log(f"Login Failed: {resp.text}", "ERROR")
        return

    # 3. Create Order to populate history
    # -----------------------------------
    log("Creating a test order...")
    # Get a menu item first
    menu_resp = requests.get(f"{BASE_URL}/menu")
    menu_items = menu_resp.json()
    if not menu_items:
        log("No menu items found. Cannot test orders.", "WARN")
    else:
        item = menu_items[0]
        
        # Ensure it is available (if we have admin token)
        if admin_token and not item["is_available"]:
            log(f"Item '{item['name']}' is unavailable. Making it available...")
            requests.patch(f"{BASE_URL}/menu/{item['id']}/availability", json={"is_available": True}, headers={"Authorization": f"Bearer {admin_token}"})
            # Re-fetch item to confirm (or just proceed)
        
        order_payload = {
            "items": [{"menu_item_id": item["id"], "quantity": 1}]
        }
        resp = requests.post(f"{BASE_URL}/orders/", json=order_payload, headers=headers)
        if resp.status_code == 200:
            order_id = resp.json()["id"]
            log(f"Order Created: #{order_id}")
            
            # 4. Get Order History
            # --------------------
            log("Testing GET /orders/ (My Orders)...")
            resp = requests.get(f"{BASE_URL}/orders/", headers=headers)
            if resp.status_code == 200:
                history = resp.json()
                log(f"History Fetched: {len(history)} orders.")
                
                # Verify the new order is in the list
                found = any(o["id"] == order_id for o in history)
                if found:
                    log("Verification Successful: New order found in history.")
                else:
                    log("Verification Failed: New order NOT found in history.", "ERROR")
            else:
                log(f"Failed to fetch history: {resp.status_code}", "ERROR")

        else:
            log(f"Failed to create order: {resp.text}", "ERROR")

    log("Stage 3 Verification Complete.")

if __name__ == "__main__":
    test_stage3()
