from functions import auth_func, user_func
from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter()

class RoleUpdate(BaseModel):
    user_id: str
    role: str

class StudentLink(BaseModel):
    user_id: str
    student_id: str

@router.get("/me")
def get_current_user(request: Request):
    """
    Get currently authenticated user's profile.
    Requires Authorization: Bearer <token> header.
    """
    profile = auth_func.get_current_user_profile(request)
    return profile

@router.get("/profile/{user_id}")
def get_user_profile(user_id: str, request: Request):
    """
    Get user profile by ID. Only admins or the user themselves can access.
    """
    current_user = auth_func.get_current_user(request)
    
    # Check if user is admin or requesting own profile
    if current_user.id != user_id and not auth_func.is_admin(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this profile"
        )
    
    profile = user_func.get_user_profile(user_id)
    return profile

@router.put("/update-role")
def update_role(role_update: RoleUpdate, request: Request):
    """
    Update user role. Admin only.
    """
    # Check if requester is admin
    if not auth_func.is_admin(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update user roles"
        )
    
    result = user_func.update_user_role(role_update.user_id, role_update.role)
    return {"message": "Role updated successfully", "data": result}

@router.post("/link-student")
def link_student(student_link: StudentLink, request: Request):
    """
    Link a student_id to a user profile. Admin only.
    """
    # Check if requester is admin
    if not auth_func.is_admin(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can link student accounts"
        )
    
    result = user_func.link_student_to_profile(student_link.user_id, student_link.student_id)
    return {"message": "Student linked successfully", "data": result}

@router.delete("/profile/{user_id}")
def delete_profile(user_id: str, request: Request):
    """
    Delete user profile. Admin only.
    Note: This only deletes the profile. The auth.users entry must be deleted via Supabase Dashboard.
    """
    # Check if requester is admin
    if not auth_func.is_admin(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete profiles"
        )
    
    result = user_func.delete_profile(user_id)
    return {"message": "Profile deleted successfully"}
