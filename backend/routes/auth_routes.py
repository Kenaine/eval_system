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
