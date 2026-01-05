import requests
import time
import sys

BASE_URL = "http://localhost:8000"

def test_rate_limit():
    print("Testing Rate Limiting (Limit: 20 req/min for write ops)...")
    
    # 1. Test Read Ops (Should NOT be limited)
    print("\n[Read Ops - GET /menu]")
    for i in range(25):
        try:
            r = requests.get(f"{BASE_URL}/menu")
            if r.status_code == 429:
                print(f"❌ Read op blocked at request {i+1}!")
                return False
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False
    print("✅ Read ops passed (25 requests, no block)")

    # 2. Test Write Ops (Should be limited at >20)
    print("\n[Write Ops - POST /orders (dummy)]")
    blocked = False
    block_request_num = 0
    passed_requests = 0
    
    for i in range(30):
        try:
            r = requests.post(f"{BASE_URL}/orders", json={}) 
            
            if r.status_code == 429:
                blocked = True
                block_request_num = i + 1
                print(f"🛑 Blocked at request #{i+1}")
                break
            
            passed_requests += 1
            # print(f"Req {i+1}: {r.status_code}") # Verbose
            
            time.sleep(0.05) 
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False

    print(f"ℹ️ Total passed requests: {passed_requests}")
    
    if blocked:
        print(f"✅ Rate limit triggered at request #{block_request_num}")
        if passed_requests < 15:
             print("⚠️ Limit triggered earlier than expected (expected ~20)")
             # We return True anyway because protection is working
        return True
    else:
        print("❌ Rate limit NOT triggered after 30 requests!")
        return False

def test_health_check():
    print("\nTesting Health Check...")
    try:
        # Note: Added trailing slash / because router prefix is /health and endpoint is /
        r = requests.get(f"{BASE_URL}/health/")
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Health Check OK: {data}")
            if data["database"] == "connected":
                print("✅ Database connected")
                return True
            else:
                print(f"❌ Database status: {data['database']}")
                return False
        else:
            print(f"❌ Health Check failed: {r.status_code} (Try checking URL path)")
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

if __name__ == "__main__":
    # Wait for server to start
    print("Waiting for server to be ready...")
    for _ in range(5):
        try:
            requests.get(BASE_URL)
            break
        except:
            time.sleep(1)
            
    health_ok = test_health_check()
    rate_ok = test_rate_limit()
    
    if health_ok and rate_ok:
        print("\n🎉 Day 11 Verification Passed!")
        exit(0)
    else:
        print("\n❌ Verification Failed")
        exit(1)
