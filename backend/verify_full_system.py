import requests
import json
import logging
import time
import random

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)

def log(msg, level="INFO"):
    if level == "INFO": logging.info(msg)
    elif level == "WARN": logging.warning(msg)
    elif level == "ERROR": logging.error(msg)
    elif level == "SUCCESS": logging.info(f"✅ {msg}")

BASE_URL = "http://localhost:8000"

def run_tests():
    log("🚀 Starting Full System Verification (Admin + Student Flow)...")
    
    # ==========================================
    # 1. ADMIN AUTH & SETUP
    # ==========================================
    log("--- Step 1: Admin Authentication ---")
    admin_token = None
    try:
        resp = requests.post(f"{BASE_URL}/token", data={"username": "admin", "password": "admin123"})
        if resp.status_code == 200:
            admin_token = resp.json()["access_token"]
            log("Admin Login Successful.", "SUCCESS")
        else:
            log(f"Admin Login Failed: {resp.text}", "ERROR")
            return
    except Exception as e:
        log(f"Connection Error: {e}", "ERROR")
        return

    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # ==========================================
    # 2. ADMIN MENU MANAGEMENT
    # ==========================================
    log("--- Step 2: Admin Menu Management ---")
    item_id = None
    item_price = 0
    try:
        # Create Item
        new_item = {
            "name": f"Verification Burger {random.randint(100,999)}",
            "price": 150,
            "category": "Test",
            "description": "Auto-generated for verification",
            "is_available": True,
            "is_vegetarian": True,
            "image_url": "https://placehold.co/400"
        }
        resp = requests.post(f"{BASE_URL}/menu", json=new_item, headers=admin_headers)
        if resp.status_code == 200:
            item_data = resp.json()
            item_id = item_data["id"]
            item_price = item_data["price"]
            log(f"Menu Item Created: {item_data['name']} (ID: {item_id})", "SUCCESS")
        else:
            log(f"Create Menu Item Failed: {resp.text}", "ERROR")
            return
    except Exception as e:
        log(f"Menu management failed: {e}", "ERROR")
        return

    # ==========================================
    # 3. STUDENT REGISTRATION & LOGIN
    # ==========================================
    log("--- Step 3: Student Registration & Login ---")
    student_token = None
    s_user = f"student_final_{random.randint(1000,9999)}"
    s_pass = "student123"
    try:
        # Register
        reg_payload = {"username": s_user, "email": f"{s_user}@test.com", "password": s_pass, "role": "student"}
        resp = requests.post(f"{BASE_URL}/register", json=reg_payload)
        if resp.status_code == 200:
            log(f"Student Registered: {s_user}", "SUCCESS")
        else:
            log(f"Registration Failed: {resp.text}", "ERROR")
            return

        # Login
        resp = requests.post(f"{BASE_URL}/token", data={"username": s_user, "password": s_pass})
        if resp.status_code == 200:
            student_token = resp.json()["access_token"]
            log("Student Login Successful.", "SUCCESS")
        else:
            log(f"Student Login Failed: {resp.text}", "ERROR")
            return
    except Exception as e:
        log(f"Student auth failed: {e}", "ERROR")
        return

    student_headers = {"Authorization": f"Bearer {student_token}"}

    # ==========================================
    # 4. STUDENT ORDERING
    # ==========================================
    log("--- Step 4: Student Places Order ---")
    order_id = None
    try:
        order_payload = {
            "items": [{"menu_item_id": item_id, "quantity": 2}] # Total 300
        }
        resp = requests.post(f"{BASE_URL}/orders/", json=order_payload, headers=student_headers)
        if resp.status_code == 200:
            order_data = resp.json()
            order_id = order_data["id"]
            log(f"Order Created: #{order_id} (Status: {order_data['status']})", "SUCCESS")
        else:
            log(f"Order Creation Failed: {resp.text}", "ERROR")
            return
    except Exception as e:
        log(f"Order failed: {e}", "ERROR")
        return

    # ==========================================
    # 5. STUDENT PAYMENT SUBMISSION
    # ==========================================
    log("--- Step 5: Student Submits Payment Proof ---")
    try:
        pay_payload = {
            "order_id": order_id,
            "reference": "TEST-Payment-Ref-123",
            "screenshot_url": "https://placehold.co/proof.png" # Optional if schema allows
        }
        # Note: Check exact endpoint signature. Assuming /payments/submit based on PaymentScreen.tsx
        # PaymentScreen.tsx uses: /payments/submit with { order_id, reference }
        resp = requests.post(f"{BASE_URL}/payments/submit", json=pay_payload, headers=student_headers)
        if resp.status_code == 200:
            log("Payment Proof Submitted.", "SUCCESS")
        else:
            log(f"Payment Submission Failed: {resp.text}", "ERROR")
            # Proceeding, might be auto-verified or pending
    except Exception as e:
        log(f"Payment submission failed: {e}", "ERROR")

    # ==========================================
    # 6. ADMIN PAYMENT VERIFICATION
    # ==========================================
    log("--- Step 6: Admin Verifies Payment ---")
    try:
        # First check status - should be Pending_Verification
        resp = requests.get(f"{BASE_URL}/orders/{order_id}", headers=admin_headers)
        curr_status = resp.json()["status"]
        log(f"Order Status before Verify: {curr_status}")

        if curr_status == "Pending_Verification":
            # Verify
            verify_payload = {"order_id": order_id, "verified_by": "admin_bot"}
            resp = requests.post(f"{BASE_URL}/payments/verify", json=verify_payload, headers=admin_headers)
            if resp.status_code == 200:
                log("Payment Verified by Admin.", "SUCCESS")
                # Log the OTP for sanity check
                log(f"Generated OTP: {resp.json().get('otp')}", "INFO")
            else:
                log(f"Payment Verification Failed: {resp.text}", "ERROR")
        else:
            log(f"Skipping verification, status is {curr_status} (expected Pending_Verification)", "WARN")
            # If manual payment didn't trigger verify state, maybe it just stayed Pending?
            # Let's force update if needed or check logic.
    except Exception as e:
        log(f"Admin verification failed: {e}", "ERROR")

    # ==========================================
    # 7. ADMIN ORDER PROCESSING (Paid -> Preparing -> Ready)
    # ==========================================
    log("--- Step 7: Admin Processes User ---")
    try:
        # Move to Preparing
        resp = requests.patch(f"{BASE_URL}/admin/orders/{order_id}/status", json={"status": "Preparing"}, headers=admin_headers)
        if resp.status_code == 200:
            log("Status Updated: Paid -> Preparing", "SUCCESS")
        else:
            log(f"Update to Preparing Failed: {resp.text}", "ERROR")

        # Move to Ready
        resp = requests.patch(f"{BASE_URL}/admin/orders/{order_id}/status", json={"status": "Ready"}, headers=admin_headers)
        if resp.status_code == 200:
            log("Status Updated: Preparing -> Ready", "SUCCESS")
        else:
            log(f"Update to Ready Failed: {resp.text}", "ERROR")

    except Exception as e:
        log(f"Order processing failed: {e}", "ERROR")

    # ==========================================
    # 8. STUDENT STATUS CHECK
    # ==========================================
    log("--- Step 8: Student Checks Status ---")
    try:
        resp = requests.get(f"{BASE_URL}/orders/{order_id}", headers=student_headers)
        if resp.status_code == 200:
            s_status = resp.json()["status"]
            if s_status == "Ready":
                log("Student sees 'Ready' status.", "SUCCESS")
            else:
                log(f"Student sees '{s_status}' (Expected 'Ready')", "ERROR")
        else:
            log(f"Student check failed: {resp.text}", "ERROR")
    except Exception as e:
        log(f"Student status check failed: {e}", "ERROR")

    log("🎉 Full System Verification Complete.")

if __name__ == "__main__":
    run_tests()
