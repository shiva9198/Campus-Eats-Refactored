from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
import database
import os

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
    health_status = {
        "status": "healthy",
        "service": "campus-eats-backend",
        "version": "2.0.0-batch2", # Updated for Day 11
        "database": "unknown"
    }

    try:
        # Simple query to verify DB connection
        db.execute(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"] = "disconnected"
        health_status["error"] = str(e)
        # We return 200 even if DB is down, but with degraded status?
        # Actually, for k8s liveness probes 200 is good. But for deep health check maybe 503?
        # Keeping it simple: 200 OK means API reachable. 
    
    return health_status
