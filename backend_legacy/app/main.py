"""
Campus Eats - FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import auth, orders, admin, payments, upload, menu

from app.config import settings
from app.services.websocket_manager import manager
from fastapi import WebSocket, WebSocketDisconnect
import json


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 Campus Eats Backend starting...")
    print(f"📦 Appwrite Endpoint: {settings.APPWRITE_ENDPOINT}")
    yield
    # Shutdown
    print("👋 Shutting down...")

app = FastAPI(
    title="Campus Eats API",
    description="Backend API for Campus Eats mobile application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(menu.router, prefix="/menu", tags=["Menu"])
app.include_router(upload.router)  # Upload router


@app.get("/")
async def root():
    return {
        "message": "Campus Eats API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.websocket("/ws")
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str = None):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # We expect simple text messages or Pings
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                # Handle non-json messages if any
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"DEBUG: WebSocket Error: {e}")
        manager.disconnect(websocket, user_id)

