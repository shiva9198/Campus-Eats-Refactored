import requests
import sys

BASE_URL = "http://localhost:8000"

def test_token_generation():
    print("\n[1/4] Testing Token Generation (POST /token)...")
    try:
        payload = {
            "username": "admin",
            "password": "admin123"
        }
        r = requests.post(f"{BASE_URL}/token", data=payload)
        
        if r.status_code == 200:
            token_data = r.json()
            if "access_token" in token_data and token_data["token_type"] == "bearer":
                print("✅ Token generated successfully")
                return token_data["access_token"]
            else:
                print(f"❌ Invalid token response: {token_data}")
                return None
        else:
            print(f"❌ Failed to get token: {r.status_code} - {r.text}")
            return None
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return None

def test_jwt_access(token):
    print("\n[2/4] Testing JWT Access (GET /menu/)...")
    # Using /menu as it requires auth in some contexts or at least we can check if it works
    # Actually, let's use a route that uses get_current_user indirectly or ideally explicitly.
    # Currently Admin routes use get_current_user. Let's try to CREATE a menu item (dry run) or better yet,
    # just hit an endpoint and see if the token is accepted.
    # Since we don't have a dedicated "/me" endpoint, let's assume if it doesn't crash 401 it differs from invalid token.
    # A good test is to call the `admin` router which relies on `get_current_user`.
    
    headers = {"Authorization": f"Bearer {token}"}
    try:
        # We'll try to get orders (admin only usually, or at least authenticated)
        # Assuming GET /orders requires auth or verification script usually does it.
        # Let's check `backend/routers/admin.py`... passing for now, let's try `GET /menu`
        # Wait, `GET /menu` is public.
        # Let's try `PATCH /menu/{id}/availability`. It requires Admin.
        # We won't actually change anything (use invalid ID).
        
        r = requests.patch(f"{BASE_URL}/menu/99999/availability", headers=headers)
        
        # We expect 404 (Not Found) or 200, but NOT 401 (Unauthorized)
        if r.status_code != 401:
            print(f"✅ JWT accepted (Status: {r.status_code} - expected non-401)")
            return True
        else:
            print(f"❌ JWT rejected (401 Unauthorized)")
            return False
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def test_legacy_access():
    print("\n[3/4] Testing Legacy Access (Bearer admin)...")
    headers = {"Authorization": "Bearer admin"}
    try:
        # Same test: try admin action
        r = requests.patch(f"{BASE_URL}/menu/99999/availability", headers=headers)
        
        if r.status_code != 401:
            print(f"✅ Legacy Auth accepted (Status: {r.status_code} - expected non-401)")
            return True
        else:
            print(f"❌ Legacy Auth rejected (401 Unauthorized) - BROKEN COMPATIBILITY!")
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def test_invalid_login():
    print("\n[4/4] Testing Invalid Login...")
    try:
        payload = {
            "username": "admin",
            "password": "wrongpassword"
        }
        r = requests.post(f"{BASE_URL}/token", data=payload)
        
        if r.status_code == 401:
            print("✅ Invalid credentials rejected (401)")
            return True
        else:
            print(f"❌ Failed to reject invalid credentials: {r.status_code}")
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

if __name__ == "__main__":
    jwt_token = test_token_generation()
    if not jwt_token:
        sys.exit(1)
        
    jwt_ok = test_jwt_access(jwt_token)
    legacy_ok = test_legacy_access()
    invalid_ok = test_invalid_login()
    
    if jwt_ok and legacy_ok and invalid_ok:
        print("\n🎉 Day 12 Verification Passed!")
        sys.exit(0)
    else:
        print("\n❌ Verification Failed")
        sys.exit(1)
