"""
Encryption Service
Handles encryption/decryption of sensitive data
"""
from cryptography.fernet import Fernet
from app.config import settings


def get_fernet() -> Fernet:
    """Get Fernet instance with encryption key"""
    if not settings.ENCRYPTION_KEY:
        # Generate a temporary key (not recommended for production)
        return None
    return Fernet(settings.ENCRYPTION_KEY.encode())


def encrypt_value(value: str) -> str:
    """Encrypt a string value"""
    f = get_fernet()
    if not f:
        return value  # No encryption if key not set
    return f.encrypt(value.encode()).decode()


def decrypt_value(encrypted: str) -> str:
    """Decrypt an encrypted string"""
    f = get_fernet()
    if not f:
        return encrypted
    try:
        return f.decrypt(encrypted.encode()).decode()
    except Exception:
        return encrypted  # Return as-is if decryption fails


def generate_encryption_key() -> str:
    """Generate a new Fernet encryption key"""
    return Fernet.generate_key().decode()


if __name__ == "__main__":
    # Utility to generate a new key
    print("New Encryption Key:")
    print(generate_encryption_key())
