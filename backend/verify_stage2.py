import requests
import sys

BASE_URL = "http://localhost:8000"

def log(msg, type="INFO"):
    print(f"[{type}] {msg}")

def test_stage2():
    log("Starting Stage 2 Verification...")

    # 1. Authentication (Admin & Student)
    # -----------------------------------
    # Login Admin
    log("Logging in as Admin...")
    resp = requests.post(f"{BASE_URL}/token", data={"username": "admin", "password": "admin123"})
    if resp.status_code != 200:

        log("Failed to login as admin", "ERROR")
        sys.exit(1)
    admin_token = resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    log("Admin logged in successfully.")

    # Login Random Student
    import random
    rand_id = random.randint(1000, 9999)
    s_user = f"student_{rand_id}"
    s_pass = "student123"
    s_email = f"student_{rand_id}@test.com"

    log(f"Registering/Logging in as {s_user}...")
    try:
        # Register
        resp = requests.post(f"{BASE_URL}/register", json={"username": s_user, "email": s_email, "password": s_pass, "role": "student"})
        if resp.status_code not in [200, 201]: # 200 OK or 201 Created
             log(f"Registration status: {resp.status_code} {resp.text}", "WARN")

        # Login
        resp = requests.post(f"{BASE_URL}/token", data={"username": s_user, "password": s_pass})
        if resp.status_code != 200:
             raise Exception(f"Login failed: {resp.text}")
        
        student_token = resp.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        log("Student logged in successfully.")

    except Exception as e:
        log(f"Student login failed: {e}", "ERROR")
        sys.exit(1)


    # 2. Admin Dashboard (Stats & Settings)
    # -------------------------------------
    log("Testing Admin Dashboard Stats...")
    resp = requests.get(f"{BASE_URL}/admin/stats", headers=admin_headers)
    if resp.status_code == 200:
        stats = resp.json()
        log(f"Stats retrieved: {stats['counts']['Pending']} Pending Orders")
    else:
        log(f"Failed to get stats: {resp.text}", "ERROR")

    log("Testing Shop Status Toggle...")
    resp = requests.post(f"{BASE_URL}/admin/settings", json={"key": "shop_status", "value": "closed", "category": "shop"}, headers=admin_headers)
    if resp.status_code == 200 and resp.json()["value"] == "closed":
        log("Shop closed successfully.")
        # Re-open
        requests.post(f"{BASE_URL}/admin/settings", json={"key": "shop_status", "value": "open", "category": "shop"}, headers=admin_headers)
        log("Shop re-opened successfully.")
    else:
        log(f"Failed to toggle shop status: {resp.text}", "ERROR")


    # 3. Menu Management
    # ------------------
    log("Testing Menu Management...")
    # Add Item
    demo_item = {
        "name": "Test Burger",
        "price": 150.0,
        "category": "Test",
        "description": "A test burger",
        "is_vegetarian": True,
        "is_available": True
    }
    # Note: Using JSON as per backend schema
    resp = requests.post(f"{BASE_URL}/menu/", json=demo_item, headers=admin_headers) 
    
    if resp.status_code == 200:
        item_id = resp.json()["id"]
        log(f"Menu Item Added: ID {item_id}")
        
        # Edit Item
        resp = requests.put(f"{BASE_URL}/menu/{item_id}", json={"name": "Updated Burger", "price": 160.0, "category": "Test", "description": "Updated", "is_vegetarian": False, "is_available": True}, headers=admin_headers)
        # Note: ensuring available=True for order test
        if resp.status_code == 200:
            log("Menu Item Updated.")
            item_to_order = resp.json()
        else:
            log(f"Failed to update item: {resp.text}", "ERROR")
            # Fallback to the ID we added
            item_to_order = {"id": item_id} 

    else:
        log(f"Failed to add menu item: {resp.text}", "ERROR")
        item_to_order = None # skip order test if add failed

    # Delete Item (Later, after ordering)
    
    # 4. Order Flow (Place -> Pay -> Verify)
    # --------------------------------------
    log("Testing Order Flow...")
    if item_to_order:
        # Place Order (Student)
        order_payload = {
            "items": [{"menu_item_id": item_to_order["id"], "quantity": 1}]
        }
        resp = requests.post(f"{BASE_URL}/orders/", json=order_payload, headers=student_headers)
        if resp.status_code == 200:
            order_data = resp.json()
            order_id = order_data["id"]
            log(f"Order Placed: #{order_id}")

            # Submit Payment Proof (Student)
            # /payments/submit expects order_id and payment_ref (optional screenshot)
            # The Admin UI expects 'verification_proof' to be set.
            # In `payments.py`, `submit_payment` updates status to 'Pending_Verification'.
            # Note: The *current* `submit_payment` endpoint in backend might expect `payment_ref`.
            # Let's check `payments.py` from context...
            # It takes `payment_ref` and `screenshot_url`.
            
            resp = requests.post(f"{BASE_URL}/payments/submit", json={"order_id": order_id, "payment_ref": "UPI123456", "screenshot_url": "/static/uploads/test.jpg"}, headers=student_headers)
            if resp.status_code == 200:
                log("Payment Proof Submitted.")
                
                # Verify Payment (Admin)
                resp = requests.post(f"{BASE_URL}/payments/verify", json={"order_id": order_id, "verified_by": "admin_script"}, headers=admin_headers)
                if resp.status_code == 200:
                    otp = resp.json()["otp"]
                    log(f"Payment Verified. OTP Generated: {otp}")
                    
                    # Check Order Status is Paid
                    resp = requests.get(f"{BASE_URL}/admin/orders?status=Paid", headers=admin_headers)
                    paid_orders = resp.json()
                    if any(o['id'] == order_id for o in paid_orders):
                        log("Order successfully found in Paid list.")
                    else:
                        log("Order NOT found in Paid list!", "ERROR")
                        
                    # Update Status (Process Order)
                    resp = requests.patch(f"{BASE_URL}/admin/orders/{order_id}/status", json={"status": "Preparing"}, headers=admin_headers)
                    if resp.status_code == 200:
                        log("Order moved to Preparing.")
                    else:
                        log("Failed to update status.", "ERROR")
                        
                else:
                     log(f"Failed to verify payment: {resp.text}", "ERROR")

            else:
                log(f"Failed to submit payment: {resp.text}", "ERROR")
        else:
             log(f"Failed to place order: {resp.text}", "ERROR")

    log("Stage 2 Verification Complete.")

if __name__ == "__main__":
    test_stage2()
