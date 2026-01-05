from fastapi import FastAPI
from appwrite.client import Client
from appwrite.services.databases import Databases
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Configuration
APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
PROJECT_ID = '6953efa40036d5e409af'
DATABASE_ID = '6953f00a002cfb92d6fc'

API_KEY = os.getenv('APPWRITE_API_KEY')

client = Client()
client.set_endpoint(APPWRITE_ENDPOINT)
client.set_project(PROJECT_ID)
if API_KEY:
    client.set_key(API_KEY)

databases = Databases(client)

@app.get("/")
def read_root():
    return {"message": "Campus Eats Python Backend is Running 🚀"}

@app.get("/menu")
def get_menu():
    try:
        result = databases.list_documents(
            DATABASE_ID,
            'menuItems'
        )
        return {"items": result['documents']}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
