import json
import logging
from typing import Optional, Callable, Any
from datetime import datetime, timedelta
from services.redis import redis_client

logger = logging.getLogger("cache")

def get_cached(key: str, ttl: int, fetch_func: Callable[[], Any]) -> Any:
    """
    Generic caching wrapper with Redis fallback.
    
    Args:
        key: Cache key
        ttl: Time to live in seconds
        fetch_func: Function to call if cache miss
    
    Returns:
        Cached data or fresh data from fetch_func
    """
    if not redis_client.is_available():
        return fetch_func()
    
    cached = redis_client.safe_get(key)
    if cached:
        try:
            return json.loads(cached)
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON in cache key: {key}")
    
    # Cache miss - fetch fresh data
    data = fetch_func()
    # Handle datetime serialization for JSON
    redis_client.safe_setex(key, ttl, json.dumps(data, default=str))  # Fixed: use safe_setex and default=str for dates
    return data

def invalidate_cache(key: str) -> None:
    """Delete a cache key"""
    if redis_client.is_available():
        redis_client.safe_delete(key)


# In-memory menu cache for high-performance reads
# This provides instant memory access when Redis is unavailable
class MenuCache:
    """
    Simple in-memory cache for menu data with TTL.
    Reduces database load during heavy browsing (most common operation).
    Falls back gracefully if Redis unavailable.
    """
    def __init__(self, ttl_minutes: int = 10):
        self.cache = None
        self.cached_at = None
        self.ttl = timedelta(minutes=ttl_minutes)
    
    def get(self) -> Optional[Any]:
        """Get cached menu data if still valid"""
        if self.cache and self.cached_at:
            if datetime.now() - self.cached_at < self.ttl:
                logger.debug("Menu cache HIT (in-memory)")
                return self.cache
        logger.debug("Menu cache MISS (in-memory)")
        return None
    
    def set(self, data: Any) -> None:
        """Cache menu data with current timestamp"""
        self.cache = data
        self.cached_at = datetime.now()
        logger.info(f"Menu cached (in-memory) - {len(data) if isinstance(data, list) else 'N/A'} items")
    
    def invalidate(self) -> None:
        """Clear the cache (called when menu is updated)"""
        self.cache = None
        self.cached_at = None
        logger.info("Menu cache invalidated (in-memory)")

# Global menu cache instance
menu_cache = MenuCache(ttl_minutes=10)
