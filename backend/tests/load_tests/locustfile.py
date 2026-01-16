from locust import HttpUser, task, between, events
import json
import random
from datetime import datetime

class FoodOrderingUser(HttpUser):
    """
    Simulates a student using the food ordering system.
    Includes realistic behavior patterns and timing.
    """
    
    # Wait time between tasks (simulates user thinking/reading)
    # Increased to respect rate limiting
    wait_time = between(3, 10)
    
    def on_start(self):
        """
        Called when a simulated user starts. 
        Performs login and gets JWT token.
        """
        self.token = None
        self.order_id = None
        self.menu_items = []
        self.login()
    
    def login(self):
        """Authenticate using OAuth2 username/password and get JWT token"""
        # Use load test users (loadtest1 to loadtest100)
        user_num = random.randint(1, 100)
        username = f"loadtest{user_num}"
        
        # OAuth2 requires form data, not JSON
        response = self.client.post(
            "/token",
            data={
                "username": username,
                "password": "test123456"
            },
            name="/token (login)"
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")
            print(f"✓ User logged in: {username}")
        else:
            print(f"✗ Login failed for {username}: {response.status_code}")
    
    def get_headers(self):
        """Returns headers with JWT token"""
        if self.token:
            return {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
        return {"Content-Type": "application/json"}
    
    @task(5)
    def browse_menu(self):
        """Browse available menu items - most common action"""
        with self.client.get(
            "/menu/",
            headers=self.get_headers(),
            name="/menu/",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self.menu_items = response.json()
                response.success()
            elif response.status_code == 429:
                response.failure(f"Rate limited (429): Menu browsing too frequent")
            else:
                response.failure(f"Menu fetch failed: {response.status_code}")
    
    @task(1)
    def check_shop_status(self):
        """Check if shop is open"""
        self.client.get(
            "/menu/status",
            headers=self.get_headers(),
            name="/menu/status"
        )
    
    @task(1)  # Reduced from 4 to respect rate limiting
    def place_order(self):
        """Place an order - high weight as this is critical"""
        # Use valid menu item IDs (1, 3, 4, 5, 6, 7, 8)
        valid_ids = [1, 3, 4, 5, 6, 7, 8]
        
        # Create order with 1-4 items
        order_data = {
            "items": [
                {
                    "menu_item_id": random.choice(valid_ids),
                    "quantity": random.randint(1, 3)
                }
                for _ in range(random.randint(1, 4))
            ]
        }
        
        with self.client.post(
            "/orders/",
            json=order_data,
            headers=self.get_headers(),
            name="/orders/ (create)",
            catch_response=True
        ) as response:
            if response.status_code in [200, 201]:
                data = response.json()
                self.order_id = data.get("id")
                print(f"✓ Order placed: {self.order_id}")
                response.success()
            elif response.status_code == 400:
                try:
                    error_detail = response.json().get("detail", "Unknown validation error")
                except:
                    error_detail = response.text[:100]  # First 100 chars if not JSON
                print(f"❌ Validation error (400): {error_detail}")
                response.failure(f"Validation error: {error_detail}")
            elif response.status_code == 429:
                print(f"⚠️ Rate limited (429): Too many order requests")
                response.failure("Rate limited - order creation throttled")
            elif response.status_code == 503:
                print(f"🔥 Server overload (503): Database or connection pool exhausted")
                response.failure("Server overload - 503 error")
            else:
                print(f"❌ Order failed ({response.status_code}): {response.text[:100]}")
                response.failure(f"Order failed: {response.status_code}")
    
    @task(3)
    def check_my_orders(self):
        """Check my order history - students frequently check this"""
        self.client.get(
            "/orders/",
            headers=self.get_headers(),
            name="/orders/ (list)"
        )
    
    @task(2)
    def check_specific_order(self):
        """Check specific order details"""
        if self.order_id:
            self.client.get(
                f"/orders/{self.order_id}",
                headers=self.get_headers(),
                name="/orders/[id]"
            )


class PeakHourUser(HttpUser):
    """
    Simulates behavior during lunch rush - faster actions, 
    less browsing, more ordering.
    """
    # Increased wait time to respect rate limiting
    wait_time = between(2, 5)
    
    def on_start(self):
        self.token = None
        self.login()
    
    def login(self):
        """OAuth2 authentication for peak hour users"""
        user_num = random.randint(1, 100)
        username = f"loadtest{user_num}"
        
        response = self.client.post(
            "/token",
            data={
                "username": username,
                "password": "test123456"
            }
        )
        if response.status_code == 200:
            self.token = response.json().get("access_token")
    
    def get_headers(self):
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    @task(2)  # Reduced from 5 to respect rate limiting
    def quick_order(self):
        """Quick order - students who know what they want"""
        # Use valid menu item IDs (popular items: 1, 3, 4, 5)
        valid_ids = [1, 3, 4, 5]
        
        order_data = {
            "items": [
                {
                    "menu_item_id": random.choice(valid_ids),
                    "quantity": random.randint(1, 2)
                }
            ]
        }
        self.client.post("/orders/", json=order_data, headers=self.get_headers())
    
    @task(3)
    def check_status_frequently(self):
        """Check order status during rush hour"""
        self.client.get("/orders/", headers=self.get_headers())


# Event listeners for custom reporting
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("\n" + "="*50)
    print("🍔 FOOD ORDERING SYSTEM LOAD TEST STARTED")
    print(f"📅 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*50 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    print("\n" + "="*50)
    print("🏁 LOAD TEST COMPLETED")
    print(f"📅 Test ended at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*50 + "\n")
