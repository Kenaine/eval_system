from functions import auth_func, user_func
from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from db.supabase_client import supabase
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import os

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

class LoginRequest(BaseModel):
    username: str  # student_id for students, username for admin
    password: str

@router.post("/login")
def login(credentials: LoginRequest):
    """
    Simple database-based authentication.
    Students: username = student_id (e.g., "2021-00001")
    Admins: username = admin username (e.g., "admin")
    Returns JWT token for session management.
    """
    try:
        print(f"=== LOGIN ATTEMPT ===")
        print(f"Username: {credentials.username}")
        
        username = credentials.username.strip()
        password = credentials.password
        
        print(f"Query user_credentials for: {username}")
        # Query user_credentials table
        result = supabase.table("user_credentials").select("*").eq("username", username).execute()
        
        print(f"Query result: {len(result.data) if result.data else 0} rows")
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        user = result.data[0]
        stored_password = user["hashed_password"]
        
        print(f"Stored password starts with TEMP_: {stored_password.startswith('TEMP_')}")
        print(f"Password length: {len(password)} chars, {len(password.encode('utf-8'))} bytes")
        
        # Check if password is temporary (not hashed yet)
        if stored_password.startswith("TEMP_"):
            # First login - hash the temp password and update
            temp_password = stored_password.replace("TEMP_", "")
            print(f"Temp password: {temp_password}")
            print(f"Comparing passwords...")
            if password == temp_password:
                print(f"Passwords match! Hashing...")
                # Ensure password is within bcrypt's 72-byte limit before hashing
                safe_password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
                print(f"Safe password length: {len(safe_password)} chars")
                try:
                    print("Calling pwd_context.hash...")
                    hashed = pwd_context.hash(safe_password)
                    print(f"Hash successful: {hashed[:20]}...")
                    supabase.table("user_credentials").update({
                        "hashed_password": hashed
                    }).eq("username", username).execute()
                    print("Database updated")
                except Exception as hash_error:
                    print(f"HASH ERROR: {hash_error}")
                    import traceback
                    traceback.print_exc()
                    raise
            else:
                print("Passwords don't match")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid username or password"
                )
        else:
            print("Verifying hashed password...")
            # Verify hashed password
            safe_password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
            if not pwd_context.verify(safe_password, stored_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid username or password"
               )
        
        # Generate JWT token
        token_data = {
            "sub": username,
            "username": username,
            "role": user["role"],
            "student_id": user.get("student_id"),
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        
        # Return token and user profile
        profile = {
            "username": user["username"],
            "role": user["role"],
            "full_name": user.get("full_name"),
            "student_id": user.get("student_id"),
            "email": user.get("email")
        }
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "profile": profile
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()  # Print full error to console
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


class PasswordChangeRequest(BaseModel):
    new_password: str


DEFAULT_STUDENT_PASSWORD = "#Uphsl123"
MIN_PASSWORD_LENGTH = 8


@router.post("/edit-password/{username}")
def edit_password(username: str, request: PasswordChangeRequest):
    """
    Change password for a user in user_credentials table.
    Ported from course_checklist editPass, adapted for user_credentials table.
    """
    result = supabase.table("user_credentials").select("*").eq("username", username).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if len(request.new_password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"New password must be at least {MIN_PASSWORD_LENGTH} characters long"
        )

    # Respect bcrypt 72-byte limit (same guard as login)
    safe_password = request.new_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    hashed = pwd_context.hash(safe_password)

    supabase.table("user_credentials").update({
        "hashed_password": hashed
    }).eq("username", username).execute()

    return {"message": "Password updated successfully"}


@router.post("/reset-student-password/{student_id}")
def reset_student_password(student_id: str):
    """
    Reset a student's password to the default value.
    Looks up by student_id first, then falls back to username.
    """
    result = supabase.table("user_credentials").select("username, student_id").eq("student_id", student_id).execute()

    if not result.data:
        result = supabase.table("user_credentials").select("username, student_id").eq("username", student_id).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student account not found"
        )

    username = result.data[0]["username"]
    safe_password = DEFAULT_STUDENT_PASSWORD.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    hashed = pwd_context.hash(safe_password)

    supabase.table("user_credentials").update({
        "hashed_password": hashed
    }).eq("username", username).execute()

    return {
        "message": "Student password reset successfully",
        "default_password": DEFAULT_STUDENT_PASSWORD,
        "username": username,
        "student_id": student_id
    }


@router.delete("/delete-user/{username}")
def delete_user(username: str):
    """
    Delete a user from user_credentials table.
    Ported from course_checklist deleteUser, adapted for user_credentials table.
    """
    result = supabase.table("user_credentials").select("*").eq("username", username).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    supabase.table("user_credentials").delete().eq("username", username).execute()

    return {"message": "User deleted successfully"}


@router.get("/admins/search")
def search_admins(query: str):
    """
    Search for admins by name.
    Returns all admins whose full_name matches the query.
    """
    try:
        if not query or query.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query parameter is required"
            )
        
        # Query user_credentials table for admins with matching name
        # Using ilike for case-insensitive search
        result = supabase.table("user_credentials").select("*").eq("role", "admin").execute()
        
        if not result.data:
            return {"admins": []}
        
        # Filter by name - case insensitive
        query_lower = query.lower().strip()
        matching_admins = []
        
        for admin in result.data:
            full_name = admin.get("full_name", "").lower()
            username = admin.get("username", "").lower()
            
            if query_lower in full_name or query_lower in username:
                # Return only necessary fields
                matching_admins.append({
                    "username": admin["username"],
                    "full_name": admin.get("full_name"),
                    "email": admin.get("email"),
                    "role": admin["role"]
                })
        
        return {"admins": matching_admins}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/admin/{name}")
def get_admin_by_name(name: str):
    """
    Get a specific admin by name.
    Searches user_credentials table for an admin with matching full_name or username.
    Returns the admin's information.
    """
    try:
        if not name or name.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name parameter is required"
            )
        
        # Query user_credentials table for admins
        result = supabase.table("user_credentials").select("*").eq("role", "admin").execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No admins found"
            )
        
        # Search for exact match or partial match - case insensitive
        name_lower = name.lower().strip()
        
        for admin in result.data:
            full_name = admin.get("full_name", "").lower()
            username = admin.get("username", "").lower()
            
            if name_lower == full_name or name_lower == username or name_lower in full_name or name_lower in username:
                return {
                    "username": admin["username"],
                    "full_name": admin.get("full_name"),
                    "email": admin.get("email"),
                    "role": admin["role"],
                    "student_id": admin.get("student_id")
                }
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Admin with name '{name}' not found"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Get admin failed: {str(e)}"
        )
