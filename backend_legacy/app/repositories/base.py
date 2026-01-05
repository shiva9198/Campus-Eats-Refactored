from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

class IUserRepository(ABC):
    @abstractmethod
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create_user_document(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def update_user(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

class IOrderRepository(ABC):
    @abstractmethod
    async def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def list_orders(self, queries: List[Any], limit: int = 25) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create_order(self, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def update_order(self, order_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def submit_payment_proof(self, order_id: str, transaction_id: str, file_bytes: bytes) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_stats(self) -> Dict[str, int]:
        pass

    @abstractmethod
    async def get_sales_by_day(self, days: int = 7) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_popular_items(self, limit: int = 10) -> List[Dict[str, Any]]:
        pass


class ISettingsRepository(ABC):
    @abstractmethod
    async def get_setting(self, key: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def save_setting(self, key: str, value: str, category: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def list_settings(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def delete_setting(self, key: str) -> None:
        pass


class IMenuRepository(ABC):
    @abstractmethod
    async def list_items(self, queries: List[Any], limit: int = 100) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        pass

