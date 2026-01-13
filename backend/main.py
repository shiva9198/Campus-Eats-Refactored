import os
import time
from collections import defaultdict, deque
from datetime import datetime
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging
import database
import models
import auth
from routers import menu, orders, admin, health, payments, auth, upload, events, branding
from fastapi.staticfiles import StaticFiles
from middleware.rate_limit import RateLimitMiddleware
from dotenv import load_dotenv

load_dotenv()  # Load .env file


# Day 11: Configure Logging (Safe & Minimal)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("main")

# Create tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Campus Eats Backend",
    version="2.0.0-redis",
    description="Backend for Campus Eats (Redis Integration: Per-User Rate Limiting + Pub/Sub)"
)

# CORS Configuration - SECURITY FIX: Locked down origins
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:8081,http://localhost:19006,http://localhost:8000"  # Dev defaults
).split(",")

logger.info(f"CORS allowed origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Redis-based Rate Limiting Middleware
app.add_middleware(RateLimitMiddleware)

# Day 11: Request Logging Middleware (Safe)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Exclude /health from noise logs
    # Note: prefix is /health, requests usually come as /health/ or /health
    if request.url.path.startswith("/health"): 
        return await call_next(request)
        
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000 # ms
    
    # Log: Method Path Status Duration IP
    # NO HEADERS, NO BODY (Sensitive data safety)
    try:
        status_emoji = "✅" if response.status_code < 400 else "⚠️" if response.status_code < 500 else "❌"
        logger.info(
            f"{status_emoji} {request.method} {request.url.path} "
            f"- {response.status_code} "
            f"- {process_time:.2f}ms - IP: {request.client.host}"
        )
    except Exception:
        pass # Logging should never break request flow

    return response

# Global Exception Handlers (Day 8 - Production Hardening)

@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc: Exception):
    """Handle 500 errors gracefully - log details but return safe message to client"""
    logger.error(f"Internal Server Error: {request.method} {request.url.path} - {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please try again later or contact support."}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle 422 validation errors - return user-friendly messages"""
    errors = exc.errors()
    # Extract field names and error messages
    friendly_errors = []
    for error in errors:
        field = " -> ".join(str(loc) for loc in error["loc"])
        msg = error["msg"]
        friendly_errors.append(f"{field}: {msg}")
    
    logger.warning(f"Validation Error: {request.method} {request.url.path} - {friendly_errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation failed",
            "errors": friendly_errors
        }
    )

# Startup/Shutdown Events (Day 8 - Operational Visibility)

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("Campus Eats Backend Starting (Redis Integration)")
    logger.info(f"Startup Time: {datetime.now().isoformat()}")
    logger.info(f"Database: PostgreSQL (via pg8000)")
    logger.info(f"Version: 2.0.0-redis")
    
    # Check Redis connection
    from redis_client import redis_client
    if redis_client.is_available():
        logger.info("✅ Redis: Connected (Rate limiting + Caching + Pub/Sub enabled)")
    else:
        logger.warning("⚠️ Redis: Unavailable (Graceful degradation active)")
    
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Campus Eats Backend Shutting Down")

# Routers
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(admin.router)
app.include_router(health.router)
app.include_router(upload.router) # Day 11: Image Uploads
app.include_router(auth.router) # Day 12: JWT Auth
app.include_router(events.router) # Redis: SSE Real-time Events
app.include_router(branding.router) # Branding: Campus Logo & Name

# Day 11: Mount Static Files (Safe Local Storage)
import os
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def read_root():
    return {
        "message": "Campus Eats Production Backend Running 🚀",
        "version": "2.0.0-redis",
        "features": "Redis Integration: Per-User Rate Limiting + Pub/Sub + Caching"
    }
