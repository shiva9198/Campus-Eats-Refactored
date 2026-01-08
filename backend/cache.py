import json
import logging
from typing import Optional, Any, Callable
from redis_client import redis_client

logger = logging.getLogger("cache")

def get_cached(key: str, ttl: int, fetch_fn: Callable[[], Any]) -> Any:
    """
    Cache-aside pattern helper.
    
    Args:
        key: Redis cache key
        ttl: Time to live in seconds
        fetch_fn: Function to fetch data on cache miss
    
    Returns:
        Cached or freshly fetched data
    """
    # Try cache first
    cached = redis_client.safe_get(key)
    if cached:
        try:
            return json.loads(cached)
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON in cache key: {key}")
    
    # Cache miss → fetch from source
    data = fetch_fn()
    
    # Store in cache
    try:
        redis_client.safe_setex(key, ttl, json.dumps(data))
    except Exception as e:
        logger.warning(f"Failed to cache data: {e}")
    
    return data

def invalidate_cache(key: str):
    """Invalidate cache key"""
    redis_client.safe_delete(key)
