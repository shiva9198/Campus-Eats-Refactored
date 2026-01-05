from app.services.websocket_manager import manager
from typing import Any, Dict

from app.services.websocket_manager import manager
from typing import Any, Dict
from datetime import datetime

class BroadcastService:
    @staticmethod
    async def notify_section_status(section_id: str, is_open: bool):
        """Notify all clients about a section status change"""
        message = {
            "event": "SECTION_STATUS_CHANGE",
            "sectionId": section_id,
            "value": "open" if is_open else "closed",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        await manager.broadcast(message)

    @staticmethod
    async def notify_shop_status(is_open: bool):
        """Notify all clients about global shop status change"""
        message = {
            "event": "SHOP_STATUS_CHANGE",
            "value": "open" if is_open else "closed",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        await manager.broadcast(message)

    @staticmethod
    async def notify_payment_lockout(order_id: str, reason: str):
        """Forcefully lockout a specific student from a payment session"""
        message = {
            "event": "PAYMENT_LOCKOUT",
            "orderId": order_id,
            "value": "locked",
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        await manager.broadcast(message) 


broadcast_service = BroadcastService()
