"""
Quick backend startup test with Redis
"""
import sys

print("Testing backend imports with Redis integration...")
print("-" * 60)

try:
    print("1. Importing FastAPI...")
    from fastapi import FastAPI
    print("   ✅ FastAPI imported")
    
    print("2. Importing Redis client...")
    from redis_client import redis_client
    print(f"   ✅ Redis client imported (available: {redis_client.is_available()})")
    
    print("3. Importing rate limiter...")
    from rate_limiter import check_rate_limit
    print("   ✅ Rate limiter imported")
    
    print("4. Importing middleware...")
    from middleware.rate_limit import RateLimitMiddleware
    print("   ✅ Middleware imported")
    
    print("5. Importing main app...")
    import main
    print("   ✅ Main app imported")
    
    print("6. Checking app routers...")
    print(f"   Routes registered: {len(main.app.routes)}")
    
    # List some key routes
    key_routes = [r for r in main.app.routes if hasattr(r, 'path')]
    print("   Key endpoints:")
    for route in key_routes[:10]:
        if hasattr(route, 'methods'):
            methods = ', '.join(route.methods)
            print(f"     {methods:10} {route.path}")
    
    print("\n" + "=" * 60)
    print("✅ Backend startup test PASSED")
    print("=" * 60)
    print("\nBackend is ready to run with:")
    print("  uvicorn main:app --host 0.0.0.0 --port 8000")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
