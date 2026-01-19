from functions import auth_func
from functions import user_func
from schema.user_schema import RequestedPass, User
from fastapi import APIRouter, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/add-admin")
def addAdmin(user: User):
    return user_func.addUser(user.login_id, "12345", "admin")


@router.post("/login")
def logginIn(user: OAuth2PasswordRequestForm = Depends()):
    auth = auth_func.login(user.username, user.password)

    token = auth["access_token"]

    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie(
        key="access_token",
        value=token,  # ✅ Just the JWT string
        httponly=True,
        secure=True,
        samesite="none",  # set True in production if on HTTPS
        path="/"
    )

    return True

@router.post("/logout")
def logOut(response: Response):
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token", path="/")
    return response


@router.post("editPassword/{student_id}")
def editPassword(student_id: str, newPass: RequestedPass):
    return user_func.editPass(student_id, newPass.newPass)