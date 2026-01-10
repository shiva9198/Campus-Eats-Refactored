import urllib.request
import urllib.parse
import urllib.error
import sys
import json
import time

BASE_URL = "http://localhost:8000"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def fail(msg):
    log(msg, "FAIL")
    sys.exit(1)

def request(method, url, data=None, headers=None):
    if headers is None:
        headers = {}
    
    if data:
        data_bytes = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    else:
        data_bytes = None

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.load(res)
    except urllib.error.HTTPError as e:
        error_content = e.read().decode()
        try:
            return e.code, json.loads(error_content)
        except:
            return e.code, error_content
    except Exception as e:
        fail(f"Request failed: {e}")

def request_form(url, form_data):
    data_bytes = urllib.parse.urlencode(form_data).encode('utf-8')
    req = urllib.request.Request(url, data=data_bytes, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.load(res)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def login(username, password):
    log(f"Logging in as {username}...")
    status, data = request_form(f"{BASE_URL}/token", {
        "username": username,
        "password": password
    })
    
    if status != 200:
        fail(f"Login failed: {data}")
        
    token = data.get("access_token")
    if not token:
        fail("No access token")
    log(f"Login OK ({username})", "PASS")
    return token

def main():
    log("=== STRICT PRODUCTION VERIFICATION ===")
    
    # 1. Login
    student_token = login("student", "student123")
    admin_token = login("admin", "admin123")
    
    student_headers = {"Authorization": f"Bearer {student_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 2. Get Menu Item
    status, menu = request("GET", f"{BASE_URL}/menu/")
    if status != 200 or not menu: fail("No menu items")
    item_id = menu[0]['id']
    
    # --- SCENARIO 1: HAPPY PATH (UTR ONLY) ---
    log("--- Scenario 1: Order -> UTR -> Verify ---")
    
    # A. Place Order
    log("Placing Order...")
    order_payload = {"items": [{"menu_item_id": item_id, "quantity": 1}]}
    status, order = request("POST", f"{BASE_URL}/orders/", data=order_payload, headers=student_headers)
    if status != 200: fail(f"Order failed: {order}")
    
    order_id = order['id']
    token_number = order['id'] # Token is ID
    log(f"Order Placed. Token: {token_number}. Status: {order['status']}", "PASS")
    
    if order['status'] != "Pending":
         fail(f"Initial status must be Pending, got {order['status']}")

    # B. Submit UTR (Strict)
    utr_code = f"UTR{int(time.time())}"
    log(f"Submitting UTR: {utr_code}...")
    
    # Try sending screenshot (Should Fail or be Ignored if schema enforces strictness? 
    # Schema checks 'utr' field only. Extra fields might be ignored by Pydantic by default or forbidden.
    # We strictly want UTR.)
    
    pay_payload = {"order_id": order_id, "utr": utr_code}
    status, res = request("POST", f"{BASE_URL}/payments/submit", data=pay_payload, headers=student_headers)
    
    if status != 200:
        fail(f"UTR Submission failed: {res}")
        
    log("UTR Submitted. Checking status...", "PASS")
    
    # C. Verify Status is Pending_Verification
    status, order_check = request("GET", f"{BASE_URL}/orders/{order_id}", headers=student_headers)
    if order_check['status'] != "Pending_Verification":
        fail(f"Status mismatch. Expected Pending_Verification, got {order_check['status']}")
    
    if order_check.get('verification_proof') != utr_code:
        fail(f"UTR not saved in verification_proof column. Got: {order_check.get('verification_proof')}")
        
    log("Order is PENDING_VERIFICATION. UTR matches.", "PASS")

    # D. Admin Verify
    log("Admin Verifying Payment...")
    verify_payload = {"order_id": order_id, "verified_by": "admin"}
    status, res = request("POST", f"{BASE_URL}/payments/verify", data=verify_payload, headers=admin_headers)
    
    if status != 200:
        fail(f"Verification failed: {res}")
        
    otp = res.get('otp')
    if not otp: fail("No OTP generated!")
    log(f"Payment Verified. OTP: {otp}. Order is PAID.", "PASS")

    # --- SCENARIO 2: DUPLICATE UTR FRAUD ---
    log("--- Scenario 2: Duplicate UTR Detection ---")
    
    # Place new order
    status, order2 = request("POST", f"{BASE_URL}/orders/", data=order_payload, headers=student_headers)
    order2_id = order2['id']
    
    # Try to reuse same UTR
    log(f"Attempting to reuse UTR: {utr_code}...")
    dupe_payload = {"order_id": order2_id, "utr": utr_code}
    status, res = request("POST", f"{BASE_URL}/payments/submit", data=dupe_payload, headers=student_headers)
    
    if status == 400 and "already been used" in str(res.get('detail', '')):
        log("Duplicate UTR correctly REJECTED.", "PASS")
    else:
        fail(f"Duplicate UTR should fail with 400. Got {status}: {res}")

    # --- SCENARIO 3: SHOP CLOSED ENFORCEMENT ---
    log("--- Scenario 3: Shop Closed Enforcement ---")
    
    # Close Shop
    log("Closing Shop...")
    settings_payload = {"key": "shop_status", "value": "closed", "category": "shop"}
    status, res = request("POST", f"{BASE_URL}/admin/settings", data=settings_payload, headers=admin_headers)
    if status != 200: fail("Failed to close shop")
    
    # Try to Place Order
    log("Attempting to place order while shop CLOSED...")
    status, res_fail = request("POST", f"{BASE_URL}/orders/", data=order_payload, headers=student_headers)
    
    if status == 400 and "shop is currently closed" in str(res_fail.get('detail', '')):
        log("Order rejected correctly (Shop Closed).", "PASS")
    else:
        fail(f"Shop Closed constraint failed. Got {status}: {res_fail}")
        
    # Re-open shop (Cleanup)
    request("POST", f"{BASE_URL}/admin/settings", data={"key": "shop_status", "value": "open"}, headers=admin_headers)
    
    log("ALL STRICT TESTS PASSED ✅", "SUCCESS")

if __name__ == "__main__":
    main()
