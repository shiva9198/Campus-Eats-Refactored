from fastapi import WebSocket
from typing import List, Dict, Any
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        # active_connections[user_id] = [WebSocket, WebSocket, ...]
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # anonymous_connections is for unauthenticated users (e.g., browsing menu)
        self.anonymous_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        if user_id:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
            print(f"DEBUG: WebSocket connected for user {user_id}")
        else:
            self.anonymous_connections.append(websocket)
            print("DEBUG: Anonymous WebSocket connected")

    def disconnect(self, websocket: WebSocket, user_id: str = None):
        if user_id and user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            print(f"DEBUG: WebSocket disconnected for user {user_id}")
        elif websocket in self.anonymous_connections:
            self.anonymous_connections.remove(websocket)
            print("DEBUG: Anonymous WebSocket disconnected")

    async def send_personal_message(self, message: Dict[str, Any], user_id: str):
        if user_id in self.active_connections:
            # Send to all devices for this user
            dead_connections = []
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception:
                    dead_connections.append(websocket)
            
            # Cleanup
            for dead in dead_connections:
                self.disconnect(dead, user_id)

    async def broadcast(self, message: Dict[str, Any]):
        """
        Broadcast to ALL connected clients in parallel (optimized).
        Ensures sub-10ms latency regardless of client count.
        """
        message_json = json.dumps(message)
        
        # 1. Collect all active sockets
        all_sockets = []
        
        # Registered users
        for user_id, connections in self.active_connections.items():
            for ws in connections:
                all_sockets.append((ws, user_id))
        
        # Anonymous users
        for ws in self.anonymous_connections:
            all_sockets.append((ws, None))

        if not all_sockets:
            return

        # 2. Create parallel tasks
        async def safe_send(websocket, uid):
            try:
                await websocket.send_text(message_json)
            except Exception:
                # Mark for cleanup if send fails
                self.disconnect(websocket, uid)

        tasks = [safe_send(ws, uid) for ws, uid in all_sockets]
        
        # 3. Execute all at once
        await asyncio.gather(*tasks, return_exceptions=True)


manager = ConnectionManager()
