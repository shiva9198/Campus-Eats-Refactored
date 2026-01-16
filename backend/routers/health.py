from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import session as database
import os
import time

router = APIRouter(
    prefix="/health",
    tags=["Health"]
)

@router.get("/", status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(database.get_db)):
    """
    Health Check Endpoint (Day 11)
    - Returns 200 OK if service is up
    - Checks Database connectivity
    - Returns version info
    """
    start = time.time()
    health_status = {
        "status": "healthy",
        "service": "campus-eats-backend",
        "version": "2.0.0-batch2", # Updated for Day 11
        "database": "unknown"
    }

    try:
        # Simple query to verify DB connection
        db.execute(text("SELECT 1"))
        db_latency = round((time.time() - start) * 1000, 2)
        health_status["database"] = "connected"
        health_status["db_latency_ms"] = db_latency
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"] = "disconnected"
        health_status["error"] = str(e)
        # We return 200 even if DB is down, but with degraded status?
        # Actually, for k8s liveness probes 200 is good. But for deep health check maybe 503?
        # Keeping it simple: 200 OK means API reachable. 
    
    return health_status

@router.get("/detailed")
def detailed_health(db: Session = Depends(database.get_db)):
    """
    Detailed system health - use for monitoring dashboards
    Shows database connection pool statistics for load test monitoring
    """
    engine = db.get_bind()
    pool = engine.pool
    
    return {
        "status": "healthy",
        "database": {
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "total_connections": pool.size() + pool.overflow(),
            "max_connections": pool.size() + 30  # pool_size + max_overflow
        },
        "timestamp": time.time()
    }
