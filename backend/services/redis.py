import redis
import logging
from typing import Optional
import os

logger = logging.getLogger("redis")

class RedisClient:
    """
    Redis client with graceful degradation.
    If Redis is unavailable, operations fail safely without breaking the system.
    """
    
    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self._connect()
    
    def _connect(self):
        """Attempt to connect to Redis"""
        try:
            self.client = redis.Redis(
                host=os.getenv("REDIS_HOST", "localhost"),
                port=int(os.getenv("REDIS_PORT", 6379)),
                db=0,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
                retry_on_timeout=False
            )
            self.client.ping()
            logger.info("✅ Redis connected")
        except Exception as e:
            logger.warning(f"⚠️ Redis unavailable: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """Check if Redis client is initialized (no per-request PING)"""
        return self.client is not None
    
    def safe_incr(self, key: str) -> Optional[int]:
        """Increment with graceful degradation"""
        if not self.is_available():
            return None
        try:
            return self.client.incr(key)
        except Exception as e:
            logger.error(f"Redis INCR failed: {e}")
            self.client = None  # Mark as unavailable
            return None
    
    def safe_expire(self, key: str, ttl: int) -> bool:
        """Set expiry with graceful degradation"""
        if not self.is_available():
            return False
        try:
            return self.client.expire(key, ttl)
        except Exception as e:
            logger.error(f"Redis EXPIRE failed: {e}")
            self.client = None
            return False
    
    def safe_get(self, key: str) -> Optional[str]:
        """Get with graceful degradation"""
        if not self.is_available():
            return None
        try:
            return self.client.get(key)
        except Exception as e:
            logger.error(f"Redis GET failed: {e}")
            self.client = None
            return None
    
    def safe_setex(self, key: str, ttl: int, value: str) -> bool:
        """Set with TTL and graceful degradation"""
        if not self.is_available():
            return False
        try:
            return self.client.setex(key, ttl, value)
        except Exception as e:
            logger.error(f"Redis SETEX failed: {e}")
            self.client = None
            return False
    
    def safe_delete(self, key: str) -> bool:
        """Delete with graceful degradation"""
        if not self.is_available():
            return False
        try:
            return self.client.delete(key)
        except Exception as e:
            logger.error(f"Redis DELETE failed: {e}")
            self.client = None
            return False
    
    def safe_publish(self, channel: str, message: str) -> bool:
        """Publish with graceful degradation"""
        if not self.is_available():
            return False
        try:
            self.client.publish(channel, message)
            return True
        except Exception as e:
            logger.error(f"Redis PUBLISH failed: {e}")
            self.client = None
            return False
    
    def safe_sadd(self, key: str, *values) -> Optional[int]:
        """Add to set with graceful degradation"""
        if not self.is_available():
            return None
        try:
            return self.client.sadd(key, *values)
        except Exception as e:
            logger.error(f"Redis SADD failed: {e}")
            self.client = None
            return None
    
    def safe_scard(self, key: str) -> Optional[int]:
        """Get set cardinality with graceful degradation"""
        if not self.is_available():
            return None
        try:
            return self.client.scard(key)
        except Exception as e:
            logger.error(f"Redis SCARD failed: {e}")
            self.client = None
            return None

# Global instance
redis_client = RedisClient()
