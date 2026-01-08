"""
Day 7/15 - Full System Verification
Tests all backend endpoints to ensure functionality is intact.
Updated Day 15: Uses JWT Authentication.
"""

import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

# Day 15: Helper to get JWT
def get_token(username, password):
    try:
        r = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
        if r.status_code == 200:
            return r.json()["access_token"]
    except Exception as e:
        print(f"Failed to connect to login: {e}")
    return None

# Global Tokens
ADMIN_TOKEN = None
STUDENT_TOKEN = None

def get_headers(role="admin"):
    token = ADMIN_TOKEN if role == "admin" else STUDENT_TOKEN
    return {"Authorization": f"Bearer {token}"}

def test_menu_api():
    """Day 2: Menu CRUD"""
    print("\n[1/5] Testing Menu API...")
    
    # Get all menu items
    r = requests.get(f"{BASE_URL}/menu")
    if r.status_code != 200:
        print(f"  ❌ GET /menu failed: {r.status_code}")
        return False
    
    items = r.json()
    if not items:
        print("  ⚠️  Menu is empty (seed database first)")
        return True
    
    print(f"  ✅ Menu API working ({len(items)} items)")
    return True

def test_order_flow():
    """Day 3: Order creation"""
    print("\n[2/5] Testing Order Flow...")
    
    # Get first available item
    r = requests.get(f"{BASE_URL}/menu")
    items = r.json()
    available = [i for i in items if i.get('is_available', True)]
    
    if not available:
        print("  ⚠️  No available items to order")
        return True
    
    # Place order
    order_payload = {
        "items": [{"menu_item_id": available[0]['id'], "quantity": 1}]
    }
    # Day 13/15: Use Student Token
    r = requests.post(f"{BASE_URL}/orders/", json=order_payload, headers=get_headers("student"))
    
    if r.status_code == 200:
        print(f"  ✅ Order created (ID: {r.json()['id']})")
        return True
    else:
        print(f"  ❌ Order creation failed: {r.status_code} - {r.text}")
        return False

def test_inventory_management():
    """Day 5: Stock toggling"""
    print("\n[3/5] Testing Inventory Management...")
    
    # Get first menu item
    r = requests.get(f"{BASE_URL}/menu")
    items = r.json()
    
    if not items:
        print("  ⚠️  No items to test inventory")
        return True
    
    item_id = items[0]['id']
    original_status = items[0]['is_available']
    
    # Toggle availability
    # Day 15: Use Admin Token
    r = requests.patch(
        f"{BASE_URL}/menu/{item_id}/availability",
        json={"is_available": not original_status},
        headers=get_headers("admin")
    )
    
    if r.status_code != 200:
        print(f"  ❌ Stock toggle failed: {r.status_code}")
        return False
    
    # Restore original status
    requests.patch(
        f"{BASE_URL}/menu/{item_id}/availability",
        json={"is_available": original_status},
        headers=get_headers("admin")
    )
    
    print("  ✅ Inventory toggle working")
    return True

def test_admin_auth():
    """Day 5: Admin authentication"""
    print("\n[4/5] Testing Admin Auth...")
    
    r = requests.get(f"{BASE_URL}/menu")
    items = r.json()
    
    if not items:
        print("  ⚠️  No items to test auth")
        return True
    
    # Try without auth (should fail)
    r = requests.patch(
        f"{BASE_URL}/menu/{items[0]['id']}/availability",
        json={"is_available": False}
    )
    
    if r.status_code == 401:
        print("  ✅ Auth protection working")
        return True
    else:
        print(f"  ❌ Unprotected endpoint: {r.status_code}")
        return False

def test_backend_health():
    """General: Backend health"""
    print("\n[5/5] Testing Backend Health...")
    
    try:
        r = requests.get(f"{BASE_URL}/docs", timeout=3)
        if r.status_code == 200:
            print("  ✅ Backend responding")
            return True
        else:
            print(f"  ❌ Backend unhealthy: {r.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Backend unreachable: {e}")
        return False

def test_payment_verification_flow():
    """Phase 4: Payment Verification & OTP Generation"""
    print("\n[Testing] Payment Verification Flow...")
    
    # 1. Create a fresh order as Student
    r = requests.get(f"{BASE_URL}/menu")
    items = r.json()
    available = [i for i in items if i.get('is_available', True)]
    
    if not available:
        print("  ⚠️  Skipping: No items available")
        return True

    order_payload = {
        "items": [{"menu_item_id": available[0]['id'], "quantity": 1}]
    }
    r = requests.post(f"{BASE_URL}/orders/", json=order_payload, headers=get_headers("student"))
    if r.status_code != 200:
        print("  ❌ Failed to create setup order")
        return False
    
    order_id = r.json()['id']
    print(f"  ✅ Setup: Order #{order_id} created")

    # 2. Student Submits Payment Proof
    submit_payload = {
        "order_id": order_id,
        "reference": "TEST_REF_123",
        "screenshot_url": "http://test.com/proof.jpg"
    }
    r = requests.post(f"{BASE_URL}/payments/submit", json=submit_payload, headers=get_headers("student"))
    
    if r.status_code != 200:
        print(f"  ❌ Payment submission failed: {r.status_code} - {r.text}")
        return False
        
    print(f"  ✅ Student submitted payment proof (Status: {r.json()['status']})")

    # 3. Admin Verifies Payment
    # Assuming endpoint is /payments/verify based on adminService.ts
    verify_payload = {
        "order_id": order_id,
        "verified_by": "admin_test_bot"
    }
    r = requests.post(f"{BASE_URL}/payments/verify", json=verify_payload, headers=get_headers("admin"))
    
    if r.status_code != 200:
        print(f"  ❌ Verification failed: {r.status_code} - {r.text}")
        return False
    
    data = r.json()
    if not data.get('otp'):
        print("  ❌ OTP not generated in response")
        return False
        
    print(f"  ✅ Payment Verified. OTP Generated: {data['otp']}")
    
    # 3. Verify Order Status became 'Paid' or 'Preparing' (depending on logic)
    r = requests.get(f"{BASE_URL}/orders/{order_id}", headers=get_headers("student"))
    status = r.json()['status']
    if status in ['Paid', 'Preparing']: # Admin verify might auto-move to Paid
        print(f"  ✅ Order Status updated to: {status}")
        return True
    else:
        print(f"  ❌ Order Status incorrect: {status}")
        return False

    return True

def main():
    print("=" * 50)
    print("Campus Eats - Full System Verification (Day 15 JWT)")
    print("=" * 50)
    
    # 1. Login
    print("🔑 Authenticating...")
    global ADMIN_TOKEN, STUDENT_TOKEN
    ADMIN_TOKEN = get_token("admin", "admin123")
    STUDENT_TOKEN = get_token("student", "student123")
    
    if not ADMIN_TOKEN or not STUDENT_TOKEN:
        print("❌ Login failed. Ensure DB is seeded and server running.")
        sys.exit(1)
    
    print("✅ Authenticated as Admin & Student")

    tests = [
        test_backend_health,
        test_menu_api,
        test_order_flow,
        test_payment_verification_flow,
        test_inventory_management,
        test_admin_auth,
    ]
    
    results = [test() for test in tests]
    
    print("\n" + "=" * 50)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    print("=" * 50)
    
    if all(results):
        print("\n🎉 All systems verified! Ready for production.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Check backend logs.")
        sys.exit(1)

if __name__ == "__main__":
    main()
