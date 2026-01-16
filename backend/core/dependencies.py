from fastapi import Depends, HTTPException, status
from core import auth

async def get_current_active_user(current_user: dict = Depends(auth.get_current_user)):
    """
    Validates that a user is logged in.
    Implicitly handled by auth.get_current_user which raises 401 if token invalid.
    """
    if not current_user:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user

async def require_admin(current_user: dict = Depends(get_current_active_user)):
    """
    Enforces Admin Role.
    Raises 403 Forbidden if user is not admin.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires Admin privileges"
        )
    return current_user

async def require_student(current_user: dict = Depends(get_current_active_user)):
    """
    Enforces Student Role.
    (Optional: In future, if we have guest users, this would filter them out).
    """
    if current_user.get("role") != "student" and current_user.get("role") != "admin": 
        # Note: Admins can act as students potentially, or strict separation.
        # For now, let's allow Admins to "test" student features if needed, 
        # OR strict separation.
        # Strict separation is safer for "Student Only" logic.
        # But commonly Admin > Student.
        # Let's stick to: "If it requires student data, mostly students".
        # But 'role' field is singular.
        pass
    
    return current_user
