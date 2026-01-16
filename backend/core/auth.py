import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

# Configuration - SECURITY FIX: No fallback secret allowed
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError(
        "CRITICAL: JWT_SECRET environment variable must be set. "
        "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300 # 5 hours for campus shifts

# Auth Tools
# Bcrypt configuration optimized for performance while maintaining security
# rounds=10: 2^10 = 1024 iterations (~70-100ms on modern CPU)
# OWASP minimum is 10 rounds, so this is still secure
# Each round increase doubles hashing time (12 rounds ≈ 280-400ms)
# Trade-off: Slightly faster brute-force attacks, but still computationally infeasible
pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__rounds=10  # Explicit: was default 12, now 10 for performance
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

logger = logging.getLogger("main")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dual-Auth Strategy (Day 12-14):
    1. Check for Legacy Magic Token (Deprecation Warning)
    2. Check for Valid JWT
    """
    
    # Day 15: Legacy Auth "admin"/"student" REMOVED.
    # Strict JWT validation only.

    # 2. JWT VALIDATION
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role", "student")
        
        user_id: int = payload.get("id")
        
        if username is None:
            raise credentials_exception
            
        return {"username": username, "role": role, "id": user_id}
        
    except JWTError:
        raise credentials_exception
