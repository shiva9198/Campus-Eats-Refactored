"""
Configuration management using environment variables
"""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Appwrite
    APPWRITE_ENDPOINT: str = "https://sgp.cloud.appwrite.io/v1"
    APPWRITE_PROJECT_ID: str = "6953efa40036d5e409af"
    APPWRITE_API_KEY: str = "standard_8aba2839afee1d926a7d7cc7624d92a9b8fb7c037c08bab302b8937fe33779d68b3de4c4150899c395822fd197ff34a0a59233922fe2b1dc5e80c29444e40a1a4d7d7e260401f28fc893e602bf4a80a63820d300cc6bea71b6707562a58b2f02467b298db66efe5c42a8f6d474785ed3744d8571cb934cca4a384b105aac7c67"
    APPWRITE_DATABASE_ID: str = "6953f00a002cfb92d6fc"
    APPWRITE_BUCKET_ID: str = "6953f00c000dfb92d6fc"

    # Collections
    COLLECTION_USERS: str = "users"
    COLLECTION_ORDERS: str = "orders"
    COLLECTION_MENU_ITEMS: str = "menuItems"

    COLLECTION_NOTIFICATIONS: str = "notifications"
    COLLECTION_ADMIN_SETTINGS: str = "admin_settings"

    # Email (Optional)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    EMAIL_FROM: str = "Campus Eats <noreply@campuseats.com>"

    # Security
    ENCRYPTION_KEY: str = ""  # Fernet key for encrypting secrets
    OTP_EXPIRY_MINUTES: int = 10

    # Payment Webhooks (Optional - disabled by default)
    WEBHOOK_ENABLED: bool = False
    WEBHOOK_SECRET: str = ""

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
