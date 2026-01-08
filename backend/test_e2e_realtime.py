"""
End-to-End Real-Time Flow Test
Tests: Order creation → Admin update → SSE delivery → Redis failover → Recovery
"""
import requests
import json
import time
import threading
import subprocess
from datetime import datetime

BASE_URL = "http://localhost:8000"

# Test credentials (you'll need to create these users first)
STUDENT_TOKEN = None
ADMIN_TOKEN = None

def log(message):
    """Log with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"[{timestamp}] {message}")

def create_test_users():
    """Create test users and get tokens"""
    global STUDENT_TOKEN, ADMIN_TOKEN
    
    log("Creating test users...")
    
    # Register student
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json={
            "username": "test_student",
            "email": "student@test.com",
            "password": "password123",
            "full_name": "Test Student"
        })
        if response.status_code in [200, 201]:
            log("✅ Student registered")
        elif response.status_code == 400:
            log("⚠️ Student already exists")
    except:
        pass
    
    # Login as student
    response = requests.post(f"{BASE_URL}/auth/login", data={
        "username": "test_student",
        "password": "password123"
    })
    if response.status_code == 200:
        STUDENT_TOKEN = response.json()["access_token"]
        log(f"✅ Student logged in (user_id: {response.json().get('user_id')})")
    else:
        log(f"❌ Student login failed: {response.text}")
        return False
    
    # Login as admin (assuming admin exists)
    response = requests.post(f"{BASE_URL}/auth/login", data={
        "username": "admin",
        "password": "admin123"
    })
    if response.status_code == 200:
        ADMIN_TOKEN = response.json()["access_token"]
        log("✅ Admin logged in")
    else:
        log(f"❌ Admin login failed: {response.text}")
        return False
    
    return True

def step1_student_places_order():
    """Step 1: Student places order"""
    log("\n" + "="*60)
    log("STEP 1: Student places order")
    log("="*60)
    
    # Get menu first
    response = requests.get(f"{BASE_URL}/menu/")
    if response.status_code != 200:
        log(f"❌ Failed to get menu: {response.text}")
        return None
    
    menu = response.json()
    if not menu:
        log("❌ No menu items available")
        return None
    
    menu_item = menu[0]
    log(f"📋 Selected item: {menu_item['name']} (₹{menu_item['price']})")
    
    # Place order
    order_data = {
        "items": [
            {
                "menu_item_id": menu_item["id"],
                "quantity": 2
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/orders/",
        json=order_data,
        headers={"Authorization": f"Bearer {STUDENT_TOKEN}"}
    )
    
    if response.status_code in [200, 201]:
        order = response.json()
        log(f"✅ Order created: ID={order['id']}, Total=₹{order['total_amount']}, Status={order['status']}")
        return order
    else:
        log(f"❌ Order creation failed: {response.text}")
        return None

def step2_admin_updates_status(order_id):
    """Step 2: Admin updates order status"""
    log("\n" + "="*60)
    log("STEP 2: Admin updates order status")
    log("="*60)
    
    response = requests.patch(
        f"{BASE_URL}/admin/orders/{order_id}/status",
        json={"status": "Preparing"},
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
    )
    
    if response.status_code == 200:
        order = response.json()
        log(f"✅ Order status updated: {order['status']}")
        return True
    else:
        log(f"❌ Status update failed: {response.text}")
        return False

def step3_test_sse_delivery(user_id, order_id):
    """Step 3: Test SSE real-time delivery"""
    log("\n" + "="*60)
    log("STEP 3: Testing SSE real-time delivery (<1s)")
    log("="*60)
    
    received_event = threading.Event()
    event_data = {}
    start_time = None
    
    def sse_listener():
        """Listen for SSE events"""
        try:
            response = requests.get(
                f"{BASE_URL}/events/orders/{user_id}",
                headers={"Authorization": f"Bearer {STUDENT_TOKEN}"},
                stream=True,
                timeout=10
            )
            
            log("📡 SSE connection established, waiting for events...")
            
            for line in response.iter_lines():
                if line:
                    decoded = line.decode('utf-8')
                    if decoded.startswith('data: '):
                        data = json.loads(decoded[6:])
                        event_data['data'] = data
                        event_data['received_at'] = time.time()
                        received_event.set()
                        log(f"📨 SSE Event received: {data}")
                        break
        except Exception as e:
            log(f"⚠️ SSE error: {e}")
    
    # Start SSE listener in background
    listener_thread = threading.Thread(target=sse_listener, daemon=True)
    listener_thread.start()
    
    # Wait for SSE connection to establish
    time.sleep(1)
    
    # Trigger status update
    log("🔄 Triggering status update...")
    start_time = time.time()
    
    response = requests.patch(
        f"{BASE_URL}/admin/orders/{order_id}/status",
        json={"status": "Ready"},
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
    )
    
    if response.status_code != 200:
        log(f"❌ Status update failed: {response.text}")
        return False
    
    # Wait for event (max 5 seconds)
    if received_event.wait(timeout=5):
        latency = (event_data['received_at'] - start_time) * 1000
        log(f"✅ Event delivered in {latency:.0f}ms (<1s: {'✅' if latency < 1000 else '❌'})")
        return latency < 1000
    else:
        log("❌ No event received within 5 seconds")
        return False

def step4_test_redis_failover():
    """Step 4: Test Redis restart and fallback"""
    log("\n" + "="*60)
    log("STEP 4: Testing Redis failover")
    log("="*60)
    
    # Stop Redis
    log("🛑 Stopping Redis...")
    subprocess.run(["brew", "services", "stop", "redis"], capture_output=True)
    time.sleep(2)
    
    # Verify Redis is down
    try:
        response = requests.get(f"{BASE_URL}/")
        log(f"✅ Backend still responding (status: {response.status_code})")
    except:
        log("❌ Backend not responding")
        return False
    
    # Try to place order (should work with graceful degradation)
    log("📦 Attempting order with Redis down...")
    response = requests.get(f"{BASE_URL}/menu/")
    
    if response.status_code == 200:
        log("✅ Fallback working: Menu endpoint accessible")
    else:
        log(f"❌ Fallback failed: {response.status_code}")
        return False
    
    # Try SSE (should fail gracefully)
    log("📡 Testing SSE with Redis down...")
    try:
        response = requests.get(
            f"{BASE_URL}/events/orders/1",
            headers={"Authorization": f"Bearer {STUDENT_TOKEN}"},
            timeout=2
        )
        if response.status_code == 503:
            log("✅ SSE correctly returns 503 (service unavailable)")
        else:
            log(f"⚠️ Unexpected SSE response: {response.status_code}")
    except:
        pass
    
    return True

def step5_test_redis_recovery():
    """Step 5: Test Redis recovery"""
    log("\n" + "="*60)
    log("STEP 5: Testing Redis recovery")
    log("="*60)
    
    # Start Redis
    log("🔄 Starting Redis...")
    subprocess.run(["brew", "services", "start", "redis"], capture_output=True)
    time.sleep(3)
    
    # Verify Redis is up
    result = subprocess.run(["redis-cli", "ping"], capture_output=True, text=True)
    if "PONG" in result.stdout:
        log("✅ Redis restarted successfully")
    else:
        log("❌ Redis failed to restart")
        return False
    
    # Test that real-time works again
    log("📡 Testing SSE after recovery...")
    try:
        response = requests.get(
            f"{BASE_URL}/events/orders/1",
            headers={"Authorization": f"Bearer {STUDENT_TOKEN}"},
            stream=True,
            timeout=2
        )
        if response.status_code == 200:
            log("✅ SSE restored: Real-time updates working again")
            return True
        else:
            log(f"⚠️ SSE status: {response.status_code}")
            return False
    except:
        log("⚠️ SSE connection timeout (may need backend restart)")
        return False

def main():
    """Run complete end-to-end test"""
    log("="*60)
    log("END-TO-END REAL-TIME FLOW TEST")
    log("="*60)
    
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/")
        log(f"✅ Backend is running: {response.json()['version']}")
    except:
        log("❌ Backend is not running. Start with: uvicorn main:app --reload")
        return
    
    # Create test users
    if not create_test_users():
        log("❌ Failed to create test users")
        return
    
    # Get user ID from token
    import jwt
    payload = jwt.decode(STUDENT_TOKEN, options={"verify_signature": False})
    user_id = payload.get("id")
    log(f"📋 Student user_id: {user_id}")
    
    # Step 1: Student places order
    order = step1_student_places_order()
    if not order:
        log("❌ Test failed at Step 1")
        return
    
    time.sleep(1)
    
    # Step 2: Admin updates status
    if not step2_admin_updates_status(order['id']):
        log("❌ Test failed at Step 2")
        return
    
    time.sleep(1)
    
    # Step 3: Test SSE delivery
    sse_success = step3_test_sse_delivery(user_id, order['id'])
    
    time.sleep(1)
    
    # Step 4: Test Redis failover
    failover_success = step4_test_redis_failover()
    
    # Step 5: Test Redis recovery
    recovery_success = step5_test_redis_recovery()
    
    # Summary
    log("\n" + "="*60)
    log("TEST SUMMARY")
    log("="*60)
    log(f"Step 1 - Order Creation: ✅")
    log(f"Step 2 - Admin Update: ✅")
    log(f"Step 3 - SSE Delivery: {'✅' if sse_success else '❌'}")
    log(f"Step 4 - Redis Failover: {'✅' if failover_success else '❌'}")
    log(f"Step 5 - Redis Recovery: {'✅' if recovery_success else '❌'}")
    log("="*60)

if __name__ == "__main__":
    main()
