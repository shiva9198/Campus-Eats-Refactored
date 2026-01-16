from fastapi import APIRouter
import subprocess
import json

router = APIRouter(
    prefix="/config",
    tags=["config"],
)

@router.get("/api-url")
def get_api_url():
    """
    Return the current ngrok public URL.
    Mobile app calls this on startup to get the correct backend URL.
    """
    try:
        # Fetch ngrok URL from local API
        result = subprocess.run(
            ["curl", "-s", "http://localhost:4040/api/tunnels"],
            capture_output=True,
            text=True,
            timeout=2
        )
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            tunnels = data.get("tunnels", [])
            
            for tunnel in tunnels:
                if tunnel.get("proto") == "https":
                    public_url = tunnel.get("public_url")
                    return {
                        "api_url": public_url,
                        "status": "ngrok_active"
                    }
        
        # Fallback: return localhost (for when deployed on institute server)
        return {
            "api_url": "http://localhost:8000",
            "status": "local_server"
        }
        
    except Exception as e:
        # Fallback for production deployment
        return {
            "api_url": "http://localhost:8000",
            "status": "fallback",
            "error": str(e)
        }
