from fastapi import HTTPException, status

from db.supabase_client import supabase

def update_user_role(user_id: str, role: str):
    """
    Update user role in profiles table.
    Only admin, student, or faculty roles allowed.
    """
    if role not in ["admin", "student", "faculty"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'admin', 'student', or 'faculty'"
        )
    
    # Check if profile exists
    profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    if not profile.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Update role
    result = supabase.table("profiles").update({
        "role": role
    }).eq("id", user_id).execute()
    
    return result

def link_student_to_profile(user_id: str, student_id: str):
    """
    Link a student_id to a user profile.
    Used when creating a student account.
    """
    # Check if profile exists
    profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    if not profile.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Check if student exists
    student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    
    if not student.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Update profile with student_id
    result = supabase.table("profiles").update({
        "student_id": student_id,
        "role": "student"
    }).eq("id", user_id).execute()
    
    return result

def get_user_profile(user_id: str):
    """
    Get user profile by user_id (UUID from auth.users).
    """
    result = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    return result.data[0]

def delete_profile(user_id: str):
    """
    Delete user profile. The auth.users entry must be deleted separately via Supabase Auth Admin API.
    """
    # Check if profile exists
    profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    if not profile.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    result = supabase.table("profiles").delete().eq("id", user_id).execute()
    
    return result
