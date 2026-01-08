import requests
import sys

BASE_URL = "http://localhost:8000"

def run_verification():
    print("1. Authenticating as Admin...")
    try:
        resp = requests.post(f"{BASE_URL}/token", data={"username": "admin", "password": "admin123"})
        if resp.status_code != 200:
            print(f"❌ Auth Failed: {resp.text}")
            sys.exit(1)
        
        token = resp.json().get("access_token")
        print(f"✅ Auth Success")
        headers = {"Authorization": f"Bearer {token}"}
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        sys.exit(1)

    print("\n2. Testing Image Upload...")
    try:
        files = {'file': ('test.png', b'fake_image_content', 'image/png')}
        resp = requests.post(f"{BASE_URL}/upload/image", files=files)
        if resp.status_code == 200 and "url" in resp.json():
            print(f"✅ Upload Success: {resp.json()['url']}")
        else:
            print(f"❌ Upload Failed: {resp.text}")
    except Exception as e:
        print(f"❌ Upload Error: {e}")

    print("\n3. Testing Settings (Shop Status)...")
    try:
        # Set
        payload = {"key": "shop_status", "value": "closed", "category": "shop"}
        resp = requests.post(f"{BASE_URL}/admin/settings", json=payload, headers=headers)
        if resp.status_code == 200:
            print("✅ Set Setting Success")
        else:
            print(f"❌ Set Setting Failed: {resp.text}")

        # Get
        resp = requests.get(f"{BASE_URL}/admin/settings", headers=headers)
        data = resp.json()
        found = any(s['key'] == 'shop_status' and s['value'] == 'closed' for s in data)
        if found:
            print("✅ Get Settings Success (Persisted)")
        else:
            print(f"❌ Settings Not Persisted: {data}")
    except Exception as e:
        print(f"❌ Settings Error: {e}")

    print("\n4. Testing Stats...")
    try:
        resp = requests.get(f"{BASE_URL}/admin/stats", headers=headers)
        if resp.status_code == 200 and "counts" in resp.json():
            print(f"✅ Stats Success: {resp.json()['counts']}")
        else:
            print(f"❌ Stats Failed: {resp.text}")
    except Exception as e:
        print(f"❌ Stats Error: {e}")

if __name__ == "__main__":
    run_verification()
