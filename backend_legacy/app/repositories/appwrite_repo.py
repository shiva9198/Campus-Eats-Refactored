from typing import List, Optional, Dict, Any
from appwrite.services.databases import Databases
from appwrite.query import Query
from app.repositories.base import IUserRepository, IOrderRepository, ISettingsRepository, IMenuRepository

from app.config import settings

class AppwriteUserRepository(IUserRepository):
    def __init__(self, databases: Databases, db_id: str):
        self.databases = databases
        self.db_id = db_id
        self.collection_id = settings.COLLECTION_USERS

    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            return self.databases.get_document(
                database_id=self.db_id,
                collection_id=self.collection_id,
                document_id=user_id
            )
        except Exception:
            return None

    async def create_user_document(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self.databases.create_document(
            database_id=self.db_id,
            collection_id=self.collection_id,
            document_id=user_id,
            data=data
        )

    async def update_user(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self.databases.update_document(
            database_id=self.db_id,
            collection_id=self.collection_id,
            document_id=user_id,
            data=data
        )

class AppwriteOrderRepository(IOrderRepository):
    def __init__(self, databases: Databases, db_id: str, cloudinary_service: Optional[Any] = None):
        self.databases = databases
        self.db_id = db_id
        self.collection_id = settings.COLLECTION_ORDERS
        self.cloudinary_service = cloudinary_service


    async def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        try:
            return self.databases.get_document(
                database_id=self.db_id,
                collection_id=self.collection_id,
                document_id=order_id
            )
        except Exception:
            return None

    async def list_orders(self, queries: List[Any], limit: int = 25) -> List[Dict[str, Any]]:
        # Ensure limit is in queries if not already
        if not any(isinstance(q, str) and "limit" in q.lower() for q in queries):
            queries.append(Query.limit(limit))
            
        result = self.databases.list_documents(
            database_id=self.db_id,
            collection_id=self.collection_id,
            queries=queries
        )
        return result["documents"]

    async def create_order(self, data: Dict[str, Any]) -> Dict[str, Any]:
        from appwrite.id import ID
        return self.databases.create_document(
            database_id=self.db_id,
            collection_id=self.collection_id,
            document_id=ID.unique(),
            data=data
        )

    async def update_order(self, order_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self.databases.update_document(
            database_id=self.db_id,
            collection_id=self.collection_id,
            document_id=order_id,
            data=data
        )

    async def submit_payment_proof(self, order_id: str, transaction_id: str, file_bytes: bytes) -> Dict[str, Any]:
        """
        Coordinates Cloudinary upload and Appwrite document update.
        """
        from datetime import datetime
        
        print(f"🗄️  REPO DEBUG: submit_payment_proof called with:")
        print(f"   order_id: {order_id}")
        print(f"   transaction_id: {transaction_id}")
        print(f"   file_bytes: {len(file_bytes) if file_bytes else 0} bytes")
        print(f"   cloudinary_service: {self.cloudinary_service is not None}")
        
        # 1. Upload to Cloudinary (Isolated storage)
        cloudinary_url = None
        if self.cloudinary_service and file_bytes:
            print("🗄️  REPO DEBUG: Attempting Cloudinary upload...")
            try:
                cloudinary_url = await self.cloudinary_service.upload_proof(file_bytes, order_id)
                print(f"🗄️  REPO DEBUG: Cloudinary upload SUCCESS: {cloudinary_url}")
            except Exception as upload_err:
                print(f"🗄️  REPO ERROR: Cloudinary upload failed: {upload_err}")
                raise upload_err
        else:
            if not self.cloudinary_service:
                print("🗄️  REPO WARNING: No cloudinary_service available")
            if not file_bytes:
                print("🗄️  REPO WARNING: No file_bytes provided")
        
        # 2. Update Appwrite with the Cloudinary URL
        data = {
            "status": "pending_verification",
            "transaction_id": transaction_id,
            "payment_screenshot_url": cloudinary_url,
            "submitted_at": datetime.utcnow().isoformat()
        }
        
        print(f"🗄️  REPO DEBUG: Updating order with data: {data}")
        result = await self.update_order(order_id, data)
        print(f"🗄️  REPO DEBUG: Order update result: {result}")
        return result

    async def get_stats(self) -> Dict[str, int]:
        statuses = ["pending_verification", "paid", "preparing", "ready", "completed", "payment_rejected"]
        stats = {"total": 0}
        
        for status in statuses:
            result = self.databases.list_documents(
                database_id=self.db_id,
                collection_id=self.collection_id,
                queries=[Query.equal("status", status), Query.limit(1)]
            )
            stats[status] = result["total"]
            stats["total"] += result["total"]
        
        return stats

    async def get_sales_by_day(self, days: int = 7) -> List[Dict[str, Any]]:
        result = self.databases.list_documents(
            database_id=self.db_id,
            collection_id=self.collection_id,
            queries=[
                Query.equal("status", ["paid", "preparing", "ready", "completed"]),
                Query.limit(500)
            ]
        )
        
        from collections import defaultdict
        from datetime import datetime
        
        daily = defaultdict(float)
        for order in result["documents"]:
            ts = order.get("createdAt", 0)
            date = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
            daily[date] += order.get("amount", 0)
        
        return [{"date": k, "total": v} for k, v in sorted(daily.items())[-days:]]

    async def get_popular_items(self, limit: int = 10) -> List[Dict[str, Any]]:
        import json
        result = self.databases.list_documents(
            database_id=self.db_id,
            collection_id=self.collection_id,
            queries=[Query.limit(200)]
        )
        
        from collections import Counter
        item_counts = Counter()
        
        for order in result["documents"]:
            items_str = order.get("items", "[]")
            try:
                items = json.loads(items_str) if isinstance(items_str, str) else items_str
                for item in items:
                    name = item.get("name", "Unknown")
                    qty = item.get("qty", 1)
                    item_counts[name] += qty
            except:
                pass
        
        return [{"name": name, "count": count} for name, count in item_counts.most_common(limit)]



class AppwriteSettingsRepository(ISettingsRepository):
    def __init__(self, databases: Databases, db_id: str):
        self.databases = databases
        self.db_id = db_id
        self.collection_id = settings.COLLECTION_ADMIN_SETTINGS

    async def get_setting(self, key: str) -> Optional[Dict[str, Any]]:
        result = self.databases.list_documents(
            database_id=self.db_id,
            collection_id=self.collection_id,
            queries=[Query.equal("key", key)]
        )
        if result["total"] > 0:
            return result["documents"][0]
        return None

    async def save_setting(self, key: str, value: str, category: str) -> Dict[str, Any]:
        from appwrite.id import ID
        import time
        
        existing = await self.get_setting(key)
        now = int(time.time())
        data = {"value": value, "category": category, "updatedAt": now}
        
        if existing:
            return self.databases.update_document(
                database_id=self.db_id,
                collection_id=self.collection_id,
                document_id=existing["$id"],
                data=data
            )
        else:
            return self.databases.create_document(
                database_id=self.db_id,
                collection_id=self.collection_id,
                document_id=ID.unique(),
                data={"key": key, **data}
            )

    async def list_settings(self) -> List[Dict[str, Any]]:
        result = self.databases.list_documents(
            database_id=self.db_id,
            collection_id=self.collection_id
        )
        return result["documents"]

    async def delete_setting(self, key: str) -> None:
        existing = await self.get_setting(key)
        if existing:
            self.databases.delete_document(
                database_id=self.db_id,
                collection_id=self.collection_id,
                document_id=existing["$id"]
            )


class AppwriteMenuRepository(IMenuRepository):
    def __init__(self, databases: Databases, db_id: str):
        self.databases = databases
        self.db_id = db_id
        self.collection_id = settings.COLLECTION_MENU_ITEMS

    async def list_items(self, queries: List[Any], limit: int = 100) -> List[Dict[str, Any]]:
        # Add limit to queries if not present
        if not any(isinstance(q, str) and "limit" in q.lower() for q in queries):
            queries.append(Query.limit(limit))

        result = self.databases.list_documents(
            database_id=self.db_id,
            collection_id=self.collection_id,
            queries=queries
        )
        return result["documents"]

    async def get_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        try:
            return self.databases.get_document(
                database_id=self.db_id,
                collection_id=self.collection_id,
                document_id=item_id
            )
        except Exception:
            return None

