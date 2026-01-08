import time
import logging
from typing import Optional
from redis_client import redis_client

logger = logging.getLogger("rate_limiter")

# Rate limits: (max_requests, window_seconds)
RATE_LIMITS = {
    "order_create": (5, 60),
    "order_read": (30, 60),
    "menu_write": (10, 60),
    "menu_read": (60, 60),
    "payment_submit": (3, 60),
    "admin_write": (20, 60),
    "admin_read": (50, 60),
    "auth": (5, 300),
}

def check_rate_limit(
    user_id: Optional[int],
    client_ip: str,
    endpoint_group: str
) -> bool:
    """
    Fixed-window rate limiting with time-bucketed keys.
    
    Returns:
        True if request allowed, False if rate limited.
        Gracefully degrades to ALLOW if Redis unavailable.
    """
    if not redis_client.is_available():
        logger.warning("Rate limiting disabled (Redis unavailable)")
        return True  # FAIL SAFE
    
    limit, window = RATE_LIMITS.get(endpoint_group, (100, 60))
    
    # Calculate time bucket
    time_bucket = int(time.time() // window)
    
    # Build key
    if user_id:
        key = f"rate_limit:user:{user_id}:{endpoint_group}:{time_bucket}"
    else:
        key = f"rate_limit:ip:{client_ip}:{endpoint_group}:{time_bucket}"
    
    # Fixed-window counter
    count = redis_client.safe_incr(key)
    if count is None:
        return True  # FAIL SAFE
    
    # Set expiry on first request (with buffer for clock skew)
    if count == 1:
        redis_client.safe_expire(key, window + 10)
    
    if count > limit:
        logger.warning(f"Rate limit exceeded: {key} ({count}/{limit})")
        return False
    
    return True

def check_global_rate_limit() -> bool:
    """
    Optional global safety valve (1000 req/min across all users).
    
    Returns:
        True if allowed, False if system overloaded.
    """
    if not redis_client.is_available():
        return True  # FAIL SAFE
    
    time_bucket = int(time.time() // 60)
    key = f"global:requests:{time_bucket}"
    
    count = redis_client.safe_incr(key)
    if count is None:
        return True
    
    if count == 1:
        redis_client.safe_expire(key, 70)
    
    if count > 1000:
        logger.error(f"Global rate limit exceeded: {count}/1000")
        return False
    
    return True
