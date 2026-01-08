"""
Test script for Redis integration
Tests rate limiting, caching, and pub/sub functionality
"""
import time
from redis_client import redis_client
from rate_limiter import check_rate_limit, check_global_rate_limit
from cache import get_cached, invalidate_cache
from pubsub import publish_order_update

print("=" * 60)
print("Redis Integration Test Suite")
print("=" * 60)

# Test 1: Redis Connection
print("\n[Test 1] Redis Connection")
if redis_client.is_available():
    print("✅ Redis connected successfully")
else:
    print("❌ Redis not available")
    exit(1)

# Test 2: Rate Limiting - Per User
print("\n[Test 2] Per-User Rate Limiting")
user_id = 42
endpoint = "order_create"
limit = 5

success_count = 0
for i in range(7):
    allowed = check_rate_limit(user_id, "192.168.1.1", endpoint)
    if allowed:
        success_count += 1
        print(f"  Request {i+1}: ✅ Allowed")
    else:
        print(f"  Request {i+1}: ❌ Rate limited (expected)")

if success_count == 5:
    print("✅ Rate limiting working correctly (5 allowed, 2 blocked)")
else:
    print(f"❌ Rate limiting failed (expected 5, got {success_count})")

# Test 3: Time Bucket Reset
print("\n[Test 3] Time Bucket Behavior")
print("  Waiting for next time bucket (61 seconds)...")
time.sleep(61)
allowed = check_rate_limit(user_id, "192.168.1.1", endpoint)
if allowed:
    print("✅ Rate limit reset after time bucket change")
else:
    print("❌ Rate limit did not reset")

# Test 4: Caching
print("\n[Test 4] Cache-Aside Pattern")
call_count = 0

def expensive_fetch():
    global call_count
    call_count += 1
    return {"data": "test", "timestamp": time.time()}

# First call (cache miss)
result1 = get_cached("test:key", 5, expensive_fetch)
print(f"  First call: {result1}")
print(f"  Fetch function called: {call_count} time(s)")

# Second call (cache hit)
result2 = get_cached("test:key", 5, expensive_fetch)
print(f"  Second call: {result2}")
print(f"  Fetch function called: {call_count} time(s)")

if call_count == 1:
    print("✅ Caching working correctly (fetch called once)")
else:
    print(f"❌ Caching failed (fetch called {call_count} times)")

# Test 5: Cache Invalidation
print("\n[Test 5] Cache Invalidation")
invalidate_cache("test:key")
result3 = get_cached("test:key", 5, expensive_fetch)
print(f"  After invalidation: {result3}")
print(f"  Fetch function called: {call_count} time(s)")

if call_count == 2:
    print("✅ Cache invalidation working correctly")
else:
    print(f"❌ Cache invalidation failed")

# Test 6: Pub/Sub
print("\n[Test 6] Pub/Sub Event Publishing")
try:
    publish_order_update(123, 42, "Ready")
    print("✅ Pub/Sub event published successfully")
except Exception as e:
    print(f"❌ Pub/Sub failed: {e}")

# Test 7: Global Rate Limit
print("\n[Test 7] Global Safety Valve")
allowed = check_global_rate_limit()
if allowed:
    print("✅ Global rate limit check passed")
else:
    print("❌ Global rate limit exceeded (unexpected)")

# Test 8: Different Users Don't Share Limits
print("\n[Test 8] User Isolation")
user1_allowed = check_rate_limit(100, "192.168.1.1", "menu_read")
user2_allowed = check_rate_limit(200, "192.168.1.1", "menu_read")

if user1_allowed and user2_allowed:
    print("✅ Different users have independent rate limits")
else:
    print("❌ User isolation failed")

# Test 9: Redis Key Inspection
print("\n[Test 9] Redis Key Inspection")
keys = redis_client.client.keys("rate_limit:*")
print(f"  Active rate limit keys: {len(keys)}")
if len(keys) > 0:
    print(f"  Sample key: {keys[0]}")
    print("✅ Rate limit keys created correctly")
else:
    print("⚠️ No rate limit keys found")

print("\n" + "=" * 60)
print("Test Suite Complete")
print("=" * 60)
