import json
import logging
from typing import Dict, Any
from services.redis import redis_client

logger = logging.getLogger("pubsub")

def publish_order_update(order_id: int, user_id: int, status: str):
    """Publish order status update to Redis Pub/Sub"""
    from datetime import datetime
    
    event = {
        "order_id": order_id,
        "status": status,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Publish to order-specific channel
    redis_client.safe_publish(
        f"order_updates:{order_id}",
        json.dumps(event)
    )
    
    # Publish to user-specific channel
    redis_client.safe_publish(
        f"order_updates:user:{user_id}",
        json.dumps(event)
    )
    
    logger.info(f"Published order update: order_id={order_id}, status={status}")

def publish_menu_update(action: str, item_id: int):
    """Publish menu update event"""
    event = {
        "action": action,  # "created", "updated", "deleted"
        "item_id": item_id
    }
    
    redis_client.safe_publish("menu_updates", json.dumps(event))
    logger.info(f"Published menu update: action={action}, item_id={item_id}")

def publish_shop_status(is_open: bool):
    """Publish shop open/close status"""
    event = {
        "status": "open" if is_open else "closed"
    }
    
    redis_client.safe_publish("shop_status", json.dumps(event))
    logger.info(f"Published shop status: {event['status']}")
