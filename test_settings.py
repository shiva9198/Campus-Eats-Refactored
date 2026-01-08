
import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

# Helper to get JWT
def get_token(username, password):
    try:
        r = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
        if r.status_code == 200:
            return r.json()["access_token"]
    except Exception as e:
        print(f"Failed to connect to login: {e}")
    return None

def test_settings_toggle():
    print("Testing Shop Status Toggle API...")
    token = get_token("admin", "admin123")
    if not token:
        print("Failed to login as admin")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Set to CLOSED
    print("1. Setting shop to 'closed'...")
    payload_closed = {"key": "shop_status", "value": "closed", "category": "shop"}
    r = requests.post(f"{BASE_URL}/admin/settings", json=payload_closed, headers=headers)
    if r.status_code != 200:
        print(f"Failed to set closed: {r.text}")
        return
    
    # Verify
    r = requests.get(f"{BASE_URL}/admin/settings", headers=headers)
    settings = r.json()
    status = next((s for s in settings if s['key'] == 'shop_status'), None)
    print(f"Current Status: {status['value']}")
    if status['value'] != 'closed':
        print("FAIL: Expected closed")
        return

    # 2. Set to OPEN
    print("2. Setting shop to 'open'...")
    payload_open = {"key": "shop_status", "value": "open", "category": "shop"}
    r = requests.post(f"{BASE_URL}/admin/settings", json=payload_open, headers=headers)
    if r.status_code != 200:
        print(f"Failed to set open: {r.text}")
        return

    # Verify
    r = requests.get(f"{BASE_URL}/admin/settings", headers=headers)
    settings = r.json()
    status = next((s for s in settings if s['key'] == 'shop_status'), None)
    print(f"Current Status: {status['value']}")
    if status['value'] != 'open':
        print("FAIL: Expected open")
        return

    print("✅ Settings API works correctly.")

if __name__ == "__main__":
    test_settings_toggle()
