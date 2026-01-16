import logging
import os
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
from typing import Optional
from services.rate_limiter import check_rate_limit, check_global_rate_limit
from core import auth

logger = logging.getLogger("middleware")

# Skip rate limiting in test environment
TESTING = os.getenv("TESTING", "false").lower() == "true"

ENDPOINT_GROUPS = {
    ("POST", "/orders/"): "order_create",
    ("GET", "/orders/"): "order_read",
    ("POST", "/menu/"): "menu_write",
    ("GET", "/menu/"): "menu_read",
    ("POST", "/payments/"): "payment_submit",
    # Auth endpoints
    ("POST", "/token"): "auth",      # OAuth2PasswordRequestForm login
    ("POST", "/register"): "auth",   # User registration
}

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Per-user rate limiting middleware using Redis.
    Falls back gracefully if Redis is unavailable.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting in test environment
        if TESTING:
            return await call_next(request)
            
        # Skip health checks
        if request.url.path.startswith("/health"):
            return await call_next(request)
        
        # Check global safety valve first
        if not check_global_rate_limit():
            return JSONResponse(
                status_code=503,
                content={"detail": "Service temporarily unavailable. Please try again later."}
            )
        
        # Determine endpoint group
        endpoint_group = self._get_endpoint_group(request)
        if not endpoint_group:
            return await call_next(request)
        
        # Extract user_id from JWT (if authenticated)
        user_id = None
        try:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header.replace("Bearer ", "")
                payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
                user_id = payload.get("id")
        except JWTError:
            pass  # Unauthenticated request
        
        # Check per-user rate limit
        client_ip = request.client.host
        allowed = check_rate_limit(user_id, client_ip, endpoint_group)
        
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."}
            )
        
        return await call_next(request)
    
    def _get_endpoint_group(self, request: Request) -> Optional[str]:
        """Determine which rate limit group applies to this request"""
        # Match exact routes or patterns
        for (method, path), group in ENDPOINT_GROUPS.items():
            if request.method == method and request.url.path.startswith(path):
                return group
        
        # Admin routes
        if request.url.path.startswith("/admin/"):
            return "admin_write" if request.method in ["POST", "PATCH", "DELETE"] else "admin_read"
        
        return None
