from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status, Request
from schema.user_schema import User
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import timedelta
import datetime

from db.firestore import fs

pwd_contx = CryptContext(schemes=['bcrypt'])

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def login(user_id: str, passwd: str):
    
    user_collection = fs.collection("users")

    user = user_collection.document(user_id).get()

    if not user.exists:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    
    user = user.to_dict()

    if not pwd_contx.verify(passwd, user["hashed_pass"]):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "ID/Password is wrong")
    
    token = createToken({"sub": user_id}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    return {
        "access_token": token,
        "token_type":   "bearer",
        "student_id":   user_id,
        "role":         user["role"]
    }

def getCurrentUser(request: Request):
    user_collection = fs.collection("users")

    token = request.cookies.get("access_token")

    if token is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="No token found in cookies")

    try:
        jwt_decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        login_id = jwt_decoded.get("sub")

        if not login_id:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        
        user = user_collection.document(login_id).get()
        
        if not user.exists:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
        user_dict = user.to_dict()
        user_dict["login_id"] = login_id
        
        return user_dict

    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Failed to decode token")
    
def getCurrentUserRole(user: User = Depends(getCurrentUser)):
    return user["role"]

def checkRole(roles: list[str]):
    def checker(role: str = Depends(getCurrentUserRole)):
        if role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "User is not authorized to do current action")
        
        return role
        
    return Depends(checker)

def createToken(user: dict, expire: timedelta | None = None):
    to_encode = user.copy()

    if expire:
        expr = datetime.datetime.now(datetime.timezone.utc) + expire
    else:
        expr = datetime.datetime.now(datetime.timezone.utc) + timedelta(15)
    to_encode.update({"exp": expr})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)