"""
Appwrite Service
Handles all Appwrite database operations
"""
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.users import Users
from appwrite.query import Query
from appwrite.id import ID
import json
import time

from app.config import settings
from app.repositories.appwrite_repo import (
    AppwriteUserRepository, 
    AppwriteOrderRepository, 
    AppwriteSettingsRepository, 
    AppwriteMenuRepository
)

from app.services.cloudinary_service import CloudinaryService



class AppwriteService:
    def __init__(self):
        self.client = Client()
        self.client.set_endpoint(settings.APPWRITE_ENDPOINT)
        self.client.set_project(settings.APPWRITE_PROJECT_ID)
        self.client.set_key(settings.APPWRITE_API_KEY)
        
        self.databases = Databases(self.client)
        self.users = Users(self.client)
        self.db_id = settings.APPWRITE_DATABASE_ID

        # Initialize Repositories
        self.cloudinary_service = CloudinaryService()
        self.user_repo = AppwriteUserRepository(self.databases, self.db_id)
        self.order_repo = AppwriteOrderRepository(self.databases, self.db_id, self.cloudinary_service)
        self.settings_repo = AppwriteSettingsRepository(self.databases, self.db_id)
        self.menu_repo = AppwriteMenuRepository(self.databases, self.db_id)



    # --- User Operations ---

    async def create_user(self, email: str, password: str, name: str) -> dict:
        """Create a new user in Appwrite Auth"""
        return self.users.create(
            user_id=ID.unique(),
            email=email,
            password=password,
            name=name
        )

    async def create_session(self, email: str, password: str) -> dict:
        """Create a session (login) - Note: This requires client-side SDK"""
        # Server-side SDK can't create sessions, return user info instead
        users_list = self.users.list(queries=[Query.equal("email", email)])
        if users_list["total"] == 0:
            raise Exception("User not found")
        return users_list["users"][0]

    async def create_user_document(
        self,
        user_id: str,
        name: str,
        email: str,
        password: str,
        mobile_number: str,
        department: str = "General"
    ) -> dict:
        """Create user document using User Repository"""
        return await self.user_repo.create_user_document(
            user_id=user_id,
            data={
                "name": name,
                "email": email,
                "password": password,
                "mobileNumber": mobile_number,
                "role": "student",
                "department": department,
                "uniqueId": user_id,
                "isVerified": False
            }
        )

    async def update_user_verified(self, user_id: str) -> dict:
        """Mark user as verified using User Repository"""
        return await self.user_repo.update_user(user_id, {"isVerified": True})


    # --- Order Operations ---

    async def list_orders(
        self,
        user_id: str = None,
        status: str = None,
        limit: int = 25
    ) -> list:
        """List orders using Order Repository"""
        queries = [Query.order_desc("createdAt")]
        
        if user_id:
            queries.append(Query.equal("userId", user_id))
        if status:
            queries.append(Query.equal("status", status))

        return await self.order_repo.list_orders(queries=queries, limit=limit)

    async def get_order(self, order_id: str) -> dict:
        """Get a single order using Order Repository"""
        return await self.order_repo.get_order(order_id)


    async def create_order(
        self,
        user_id: str,
        items: list,
        amount: float
    ) -> dict:
        """Create a new order using Order Repository"""
        now = int(time.time())
        from appwrite.id import ID
        return await self.order_repo.create_order(
            data={
                "orderId": ID.unique(),
                "userId": user_id,
                "items": json.dumps(items),
                "amount": amount,
                "status": "pending_verification",
                "createdAt": now,
                "updatedAt": now
            }
        )


    async def update_order_status(
        self,
        order_id: str,
        status: str,
        updated_by: str = None
    ) -> dict:
        """Update order status using Order Repository"""
        data = {
            "status": status,
            "updatedAt": int(time.time())
        }
        if updated_by:
            data["collectedBy"] = updated_by
        
        return await self.order_repo.update_order(order_id, data)


    async def submit_payment_proof(
        self,
        order_id: str,
        screenshot_url: str = None, # Deprecated in favor of direct file in repo
        transaction_id: str = None,
        file_bytes: bytes = None
    ) -> dict:
        """Submit payment proof using the Order Repository"""
        print(f"🔧 SERVICE DEBUG: submit_payment_proof called with:")
        print(f"   order_id: {order_id}")
        print(f"   transaction_id: {transaction_id}")
        print(f"   file_bytes: {len(file_bytes) if file_bytes else 0} bytes")
        print(f"   screenshot_url: {screenshot_url}")
        
        if file_bytes:
            print("🔧 SERVICE DEBUG: Taking NEW 2.0 flow (file_bytes present)")
            # New 2.0 Flow: Repository handles coordination
            result = await self.order_repo.submit_payment_proof(order_id, transaction_id, file_bytes)
            print(f"🔧 SERVICE DEBUG: Repository returned: {result}")
            return result
        else:
            print("🔧 SERVICE DEBUG: Taking FALLBACK flow (no file_bytes)")
        
        # Fallback for old callers (though we should migrate them all)
        now = int(time.time())
        data = {
            "status": "pending_verification",
            "submittedAt": now,
            "updatedAt": now
        }
        if screenshot_url:
            data["screenshotUrl"] = screenshot_url
        if transaction_id:
            data["paymentUrl"] = transaction_id

        return await self.order_repo.update_order(order_id, data)


    async def verify_payment(
        self,
        order_id: str,
        verified_by: str,
        transaction_id: str = None,
        otp: str = None,
        screenshot_url: str = None
    ) -> dict:
        """Verify payment using Order Repository"""
        now = int(time.time())
        data = {
            "status": "paid",
            "verifiedBy": verified_by,
            "verifiedAt": now,
            "updatedAt": now,
            "qrUsed": False,
            "readyToCollect": False
        }
        if transaction_id:
            data["paymentUrl"] = transaction_id 
        if otp:
            data["otp"] = otp
        if screenshot_url:
            data["screenshotUrl"] = screenshot_url

        return await self.order_repo.update_order(order_id, data)

    async def reject_payment(
        self,
        order_id: str,
        rejected_by: str,
        reason: str
    ) -> dict:
        """Reject a payment using Order Repository"""
        now = int(time.time())
        return await self.order_repo.update_order(
            order_id=order_id,
            data={
                "status": "payment_rejected",
                "rejectedBy": rejected_by,
                "rejectionReason": reason,
                "rejectedAt": now,
                "updatedAt": now
            }
        )


    # --- Admin Settings ---

    async def list_admin_settings(self) -> list:
        """List all admin settings using Settings Repository"""
        return await self.settings_repo.list_settings()

    async def get_admin_setting(self, key: str) -> dict:
        """Get a specific setting using Settings Repository"""
        return await self.settings_repo.get_setting(key)


    async def save_admin_setting(
        self,
        key: str,
        value: str,
        category: str
    ) -> dict:
        """Save or update an admin setting using Settings Repository"""
        return await self.settings_repo.save_setting(key, value, category)

    async def delete_admin_setting(self, key: str):
        """Delete an admin setting using the Settings Repository"""
        await self.settings_repo.delete_setting(key)



    async def get_payment_mode(self) -> dict:
        """
        Check if payment gateway is configured.
        Returns mode: 'gateway' or 'manual'
        """
        gateway_setting = await self.get_admin_setting("payment_gateway")
        
        if gateway_setting and gateway_setting.get("value") not in ["none", "", None]:
            return {
                "mode": "gateway",
                "gateway": gateway_setting.get("value")
            }
        
        # Check for UPI ID
        upi_setting = await self.get_admin_setting("upi_id")
        
        return {
            "mode": "manual",
            "upi_id": upi_setting.get("value") if upi_setting else None
        }

    # --- Analytics ---

    async def get_order_stats(self) -> dict:
        """Get order counts by status using Order Repository"""
        return await self.order_repo.get_stats()

    async def get_sales_by_day(self, days: int = 7) -> list:
        """Get sales totals for the last N days using Order Repository"""
        return await self.order_repo.get_sales_by_day(days)

    async def get_popular_items(self, limit: int = 10) -> list:
        """Get most ordered items using Order Repository"""
        return await self.order_repo.get_popular_items(limit)


    # --- Menu Operations ---

    async def list_menu_items(self, limit: int = 100) -> list:
        """List all menu items using the Menu Repository"""
        return await self.menu_repo.list_items([], limit=limit)



# Singleton instance
appwrite_service = AppwriteService()
