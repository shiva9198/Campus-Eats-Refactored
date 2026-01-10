import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

class CloudinaryService:
    def __init__(self):
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET")
        )

    async def upload_proof(self, file_bytes: bytes, order_id: str):
        """
        Uploads payment proof to Cloudinary and returns the secure URL.
        Isolated from Appwrite storage.
        """
        print(f"☁️  CLOUDINARY DEBUG: upload_proof called with:")
        print(f"   order_id: {order_id}")
        print(f"   file_bytes length: {len(file_bytes) if file_bytes else 0}")
        
        try:
            print("☁️  CLOUDINARY DEBUG: Starting upload...")
            result = cloudinary.uploader.upload(
                file_bytes,
                public_id=f"proof_{order_id}",
                folder="campus_eats/payments",
                overwrite=True,
                resource_type="image"
            )
            
            secure_url = result.get("secure_url")
            print(f"☁️  CLOUDINARY DEBUG: Upload successful!")
            print(f"   secure_url: {secure_url}")
            print(f"   public_id: {result.get('public_id')}")
            print(f"   version: {result.get('version')}")
            
            return secure_url
        except Exception as e:
            print(f"☁️  CLOUDINARY ERROR: Upload failed: {e}")
            print(f"   Error type: {type(e)}")
            raise e
