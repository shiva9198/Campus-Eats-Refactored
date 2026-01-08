from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from redis_client import redis_client
import dependencies
import logging

router = APIRouter(
    prefix="/events",
    tags=["events"],
)

logger = logging.getLogger("events")

@router.get("/orders/{user_id}")
async def stream_order_updates(
    user_id: int,
    current_user: dict = Depends(dependencies.get_current_active_user)
):
    """
    SSE endpoint for real-time order updates.
    Clients subscribe to receive order status changes in real-time.
    """
    
    # Authorization: user can only subscribe to their own updates
    if current_user["id"] != user_id and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if not redis_client.is_available():
        raise HTTPException(
            status_code=503,
            detail="Real-time updates unavailable. Please use polling."
        )
    
    async def event_generator():
        pubsub = redis_client.client.pubsub()
        try:
            pubsub.subscribe(f"order_updates:user:{user_id}")
            logger.info(f"User {user_id} subscribed to order updates")
            
            for message in pubsub.listen():
                if message['type'] == 'message':
                    yield f"data: {message['data']}\n\n"
        except GeneratorExit:
            logger.info(f"User {user_id} disconnected from order updates")
        finally:
            pubsub.close()  # CRITICAL: Prevent resource leak
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

@router.get("/menu")
async def stream_menu_updates():
    """
    SSE endpoint for real-time menu updates.
    All clients can subscribe to menu availability changes.
    """
    
    if not redis_client.is_available():
        raise HTTPException(
            status_code=503,
            detail="Real-time updates unavailable."
        )
    
    async def event_generator():
        pubsub = redis_client.client.pubsub()
        try:
            pubsub.subscribe("menu_updates")
            logger.info("Client subscribed to menu updates")
            
            for message in pubsub.listen():
                if message['type'] == 'message':
                    yield f"data: {message['data']}\n\n"
        except GeneratorExit:
            logger.info("Client disconnected from menu updates")
        finally:
            pubsub.close()
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
