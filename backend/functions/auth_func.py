from fastapi import Depends, HTTPException, status, Request
from typing import Optional

from db.supabase_client import supabase

def get_user_from_token(request: Request) -> dict:
    """
    Extract and verify Supabase Auth token from request headers.
    Returns the user data if authenticated.
    """
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = auth_header.split(" ")[1]
    
    try:
        # Verify the JWT token with Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        return user_response.user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

def get_current_user(request: Request = None) -> dict:
    """
    Dependency to get the currently authenticated user.
    """
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No request context"
        )
    
    return get_user_from_token(request)

def get_user_profile(user_id: str) -> Optional[dict]:
    """
    Get user profile from profiles table.
    """
    result = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    if not result.data:
        return None
    
    return result.data[0]

def get_current_user_profile(request: Request) -> dict:
    """
    Get profile of currently authenticated user.
    """
    user = get_current_user(request)
    profile = get_user_profile(user.id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    return profile

def get_current_user_role(request: Request) -> str:
    """
    Get role of currently authenticated user.
    """
    profile = get_current_user_profile(request)
    return profile.get("role", "student")

def check_role(roles: list[str]):
    """
    Dependency to check if user has required role.
    """
    def checker(request: Request):
        role = get_current_user_role(request)
        if role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{role}' not authorized. Required roles: {roles}"
            )
        return role
    
    return Depends(checker)

def is_admin(request: Request) -> bool:
    """
    Check if current user is an admin.
    """
    try:
        role = get_current_user_role(request)
        return role == "admin"
    except:
        return False

    else:
        expr = datetime.datetime.now(datetime.timezone.utc) + timedelta(15)
    to_encode.update({"exp": expr})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)