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
    log("=== AUTOMATED SCENARIO VERIFICATION ===")
    
    # 1. Setup
    student_token = login("student", "student123")
    admin_token = login("admin", "admin123")
    
    student_headers = {"Authorization": f"Bearer {student_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get Valid Menu Item
    status, menu = request("GET", f"{BASE_URL}/menu/")
    if status != 200 or not menu: fail("No menu items")
    item_id = menu[0]['id']
    item_price = menu[0]['price']
    
    # ==================================================================================
    # SCENARIO 1: HAPPY PATH (Ideal Flow)
    # Student Order -> UTR -> Admin Verify -> OTP
    # ==================================================================================
    log("\n--- [S1] Happy Path: Order -> UTR -> Verify ---")
    
    # 1. Place Order
    order_payload = {"items": [{"menu_item_id": item_id, "quantity": 1}]}
    status, order = request("POST", f"{BASE_URL}/orders/", data=order_payload, headers=student_headers)
    if status != 200: fail(f"Order failed: {order}")
    log(f"Order Placed. Token: {order['id']}. Status: {order['status']}", "PASS")
    
    # 2. Submit UTR
    import random
    utr_code = f"UTR{int(time.time())}_{random.randint(100,999)}"
    pay_payload = {"order_id": order['id'], "utr": utr_code}
    status, res = request("POST", f"{BASE_URL}/payments/submit", data=pay_payload, headers=student_headers)
    if status != 200: fail(f"Payment submit failed: {res}")
    log("UTR Submitted.", "PASS")
    
    # 3. Verify Status
    status, check = request("GET", f"{BASE_URL}/orders/{order['id']}", headers=student_headers)
    if check['status'] != "Pending_Verification": fail(f"Expected Pending_Verification, got {check['status']}")
    log("Status is PENDING_VERIFICATION.", "PASS")
    
    # 4. Admin Verify
    verify_payload = {"order_id": order['id'], "verified_by": "admin"}
    status, res = request("POST", f"{BASE_URL}/payments/verify", data=verify_payload, headers=admin_headers)
    if status != 200: fail("Admin verification failed")
    if not res.get('otp'): fail("OTP missing")
    log(f"Verified. OTP Generated: {res.get('otp')}", "PASS")
    
    time.sleep(2) # Avoid Rate Limit

    # ==================================================================================
    # SCENARIO 6: DUPLICATE UTR FRAUD
    # ==================================================================================
    log("\n--- [S6] Fraud: Duplicate UTR Rejection ---")
    
    # 1. New Order
    status, order2 = request("POST", f"{BASE_URL}/orders/", data=order_payload, headers=student_headers)
    
    # 2. Submit SAME UTR
    log(f"Attempting to reuse UTR: {utr_code}...")
    dupe_payload = {"order_id": order2['id'], "utr": utr_code}
    status, res = request("POST", f"{BASE_URL}/payments/submit", data=dupe_payload, headers=student_headers)
    
    if status == 400:
        log("Duplicate UTR correctly REJECTED.", "PASS")
    else:
        fail(f"Duplicate should fail! Got status {status}")

    time.sleep(2) # Avoid Rate Limit

    # ==================================================================================
    # SCENARIO 3: SHOP CLOSED ENFORCEMENT
    # ==================================================================================
    log("\n--- [S3] Ops: Shop Closed Enforcement ---")
    
    # 1. Close Shop
    request("POST", f"{BASE_URL}/admin/settings", 
            data={"key": "shop_status", "value": "closed", "category": "shop"}, 
            headers=admin_headers)
    log("Shop Closed.", "INFO")
    
    # 2. Try Order
    status, res = request("POST", f"{BASE_URL}/orders/", data=order_payload, headers=student_headers)
    if status == 400 and "shop is currently closed" in str(res):
        log("Order rejected (Shop Closed).", "PASS")
    else:
        fail(f"Shop Closed constraint failed. Status: {status}")

    # 3. Re-open
    request("POST", f"{BASE_URL}/admin/settings", 
            data={"key": "shop_status", "value": "open"}, 
            headers=admin_headers)
    log("Shop Re-opened.", "INFO")
    
    time.sleep(2) # Avoid Rate Limit

    # ==================================================================================
    # SCENARIO 5: WRONG UTR / ADMIN REJECTION
    # ==================================================================================
    log("\n--- [S5] Ops: Admin Rejection (Wrong UTR) ---")
    
    # 1. New Order
    status, order3 = request("POST", f"{BASE_URL}/orders/", data=order_payload, headers=student_headers)
    
    # 2. Submit Bad UTR
    bad_utr = f"BAD{int(time.time())}"
    request("POST", f"{BASE_URL}/payments/submit", 
            data={"order_id": order3['id'], "utr": bad_utr}, 
            headers=student_headers)
    
    # 3. Admin Rejects
    reject_payload = {"order_id": order3['id'], "reason": "Invalid UTR", "rejected_by": "admin"}
    status, res = request("POST", f"{BASE_URL}/payments/reject", data=reject_payload, headers=admin_headers)
    
    if status != 200: fail("Rejection failed")
    
    # 4. Check Status
    status, check = request("GET", f"{BASE_URL}/orders/{order3['id']}", headers=student_headers)
    if check['status'] == "Payment_Rejected":
        log("Order correctly marked as Payment_Rejected.", "PASS")
    else:
        fail(f"Expected Payment_Rejected, got {check['status']}")

    time.sleep(2) # Avoid Rate Limit

    # ==================================================================================
    # SCENARIO 19: PRICE TAMPERING (SECURITY)
    # ==================================================================================
    log("\n--- [S19] Security: Price Tampering ---")
    
    # 1. Payload with FAKE price (0 or 1)
    tamper_payload = {
        "items": [{
            "menu_item_id": item_id, 
            "quantity": 1, 
            "price": 1 # TRYING TO HACK PRICE
        }],
        "total_amount": 5 # TRYING TO HACK TOTAL
    }
    
    if item_price <= 5:
        # If item is cheap, this test isn't valid. But usually menu items > 5.
        pass
        
    status, order4 = request("POST", f"{BASE_URL}/orders/", data=tamper_payload, headers=student_headers)
    
    real_total = order4['total_amount']
    # Check if server ignored our fake price
    if real_total >= item_price and real_total != 5:
         log(f"Price Tampering Prevented. Server total: {real_total} (Correct).", "PASS")
    else:
         fail(f"Security Flaw! Server accepted tampered price: {real_total}")

    # ==================================================================================
    # VERIFICATION COMPLETE
    # ==================================================================================
    log("\n=== ALL SCENARIOS PASSED ✅ ===", "SUCCESS")

if __name__ == "__main__":
    main()
