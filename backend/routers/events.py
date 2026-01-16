from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from services.redis import redis_client
from core import dependencies
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

from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    if not redis_client.is_available():
        await websocket.close(code=1011, reason="Redis unavailable")
        return

    pubsub = redis_client.client.pubsub()
    try:
        # Subscribe to relevant global channels
        pubsub.subscribe("shop_status", "menu_updates")
        logger.info("WebSocket connected and subscribed to global updates")
        
        while True:
            # Non-blocking check for messages
            message = pubsub.get_message(ignore_subscribe_messages=True)
            
            if message:
                try:
                    # Check if websocket is still connected before sending
                    if websocket.client_state.name != "CONNECTED":
                        logger.info("WebSocket client disconnected, breaking loop")
                        break
                        
                    # Redis returns bytes or string, ensure we send JSON string
                    data = message['data']
                    if isinstance(data, bytes):
                        data = data.decode('utf-8')
                        
                    # Construct valid JSON payload
                    # Check if data is already JSON, otherwise wrap it
                    try:
                        json_data = json.loads(data)
                        # Ensure it has a type field for the client to distinguish
                        if message['channel'] == "shop_status":
                            payload = {"type": "SHOP_STATUS", "payload": json_data}
                        elif message['channel'] == "menu_updates":
                            payload = {"type": "MENU_UPDATE", "payload": json_data}
                        else:
                            payload = {"type": "UNKNOWN", "payload": json_data}
                    except json.JSONDecodeError:
                        payload = {"type": "RAW", "channel": message['channel'], "data": data}

                    await websocket.send_json(payload)
                except Exception as e:
                    logger.warning(f"Error sending WebSocket message: {e}")
                    break  # Exit loop on send error
            
            # Prevent busy loop
            await asyncio.sleep(0.1)
            
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        pubsub.close()
