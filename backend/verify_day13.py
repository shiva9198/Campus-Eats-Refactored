import requests
import sys

BASE_URL = "http://localhost:8000"

def get_token(username, password):
    try:
        r = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
        if r.status_code == 200:
            return r.json()["access_token"]
        return None
    except:
        return None

def test_admin_protection(student_token, admin_token):
    print("\n[1/4] Testing Admin Route Protection...")
    
    # 1. Student accessing Admin Route -> Expect 403
    headers = {"Authorization": f"Bearer {student_token}"}
    r = requests.get(f"{BASE_URL}/admin/orders", headers=headers)
    if r.status_code == 403:
        print("✅ Student blocked from Admin route (403 Forbidden)")
    else:
        print(f"❌ Student NOT blocked (Status: {r.status_code})")
        return False
        
    # 2. Admin accessing Admin Route -> Expect 200
    headers_adm = {"Authorization": f"Bearer {admin_token}"}
    r_adm = requests.get(f"{BASE_URL}/admin/orders", headers=headers_adm)
    if r_adm.status_code == 200:
        print("✅ Admin allowed in Admin route")
    else:
        print(f"❌ Admin blocked from Admin route (Status: {r_adm.status_code})")
        return False
        
    return True

def test_menu_protection(student_token, admin_token):
    print("\n[2/4] Testing Menu Modification Protection...")
    
    # 1. Student creating menu item -> Expect 403
    headers = {"Authorization": f"Bearer {student_token}"}
    payload = {
        "name": "Hacker Burger",
        "price": 100, # Valid price > 0
        "description": "Hacked",
        "category": "Main",
        "is_available": True
    }
    r = requests.post(f"{BASE_URL}/menu/", json=payload, headers=headers)
    if r.status_code == 403:
        print("✅ Student blocked from Create Menu (403 Forbidden)")
    else:
        print(f"❌ Student allowed to Create Menu (Status: {r.status_code})")
        return False
        
    return True

def test_order_protection(student_token):
    print("\n[3/4] Testing Order Route Protection...")
    
    # 1. Unauthenticated -> Expect 401
    valid_order = {
        "items": [
             {"menu_item_id": 1, "quantity": 1}
        ]
    }
    r = requests.post(f"{BASE_URL}/orders/", json=valid_order)
    if r.status_code == 401:
        print("✅ Unauthenticated request blocked (401 Unauthorized)")
    else:
        print(f"❌ Unauthenticated request allowed (Status: {r.status_code})")
        return False
        
    # 2. Authenticated Student -> Expect 200 (or 500 if item 1 missing, but passed auth)
    # We just want to pass the 401/403 gate.
    headers = {"Authorization": f"Bearer {student_token}"}
    r_auth = requests.post(f"{BASE_URL}/orders/", json=valid_order, headers=headers)
    
    if r_auth.status_code != 401 and r_auth.status_code != 403:
         print(f"✅ Authenticated student allowed past auth gate (Status: {r_auth.status_code})")
    else:
         print(f"❌ Authenticated student blocked (Status: {r_auth.status_code})")
         return False
         
    return True

if __name__ == "__main__":
    print("Getting tokens...")
    admin_token = get_token("admin", "admin123")
    student_token = get_token("student", "student123")
    
    if not admin_token or not student_token:
        print("❌ Failed to get tokens. Ensure DB is seeded.")
        sys.exit(1)
        
    p1 = test_admin_protection(student_token, admin_token)
    p2 = test_menu_protection(student_token, admin_token)
    p3 = test_order_protection(student_token)
    
    if p1 and p2 and p3:
        print("\n🎉 Day 13 Verification Passed!")
        sys.exit(0)
    else:
        print("\n❌ Verification Failed")
        sys.exit(1)
