from fastapi import HTTPException, status
from db.supabase_client import supabase
from schema.curriculum_course_schema import CurriculumCourse

def getCurrCourse(program: str, curriculum: str):
    """Get all courses for a specific curriculum"""
    # First get the curriculum ID by name and program
    curr_result = supabase.table("curriculum") \
        .select("id") \
        .eq("program_id", program) \
        .eq("name", curriculum) \
        .execute()
    
    if not curr_result.data:
        return []
    
    curriculum_id = curr_result.data[0]["id"]
    
    # Get all curriculum_course entries with course details, sorted properly
    result = supabase.table("curriculum_course") \
        .select("*, courses(*)") \
        .eq("curriculum_id", curriculum_id) \
        .order("course_year") \
        .order("course_sem") \
        .order("sequence") \
        .execute()
    
    # Flatten the response
    courses = []
    for item in result.data:
        course_data = item.get("courses", {})
        courses.append({
            "course_id": course_data.get("course_id"),
            "course_name": course_data.get("course_name"),
            "course_hours": course_data.get("course_hours"),
            "course_preq": course_data.get("course_preq"),
            "hours_lec": course_data.get("hours_lec"),
            "hours_lab": course_data.get("hours_lab"),
            "units_lec": course_data.get("units_lec"),
            "units_lab": course_data.get("units_lab"),
            "course_year": item.get("course_year"),
            "course_sem": item.get("course_sem"),
            "sequence": item.get("sequence"),
            "curriculum": curriculum
        })
    
    return courses

def addCourse(course: CurriculumCourse):
    """Add a course to a curriculum"""
    # Get curriculum ID from name
    curr_result = supabase.table("curriculum") \
        .select("id") \
        .eq("name", course.curriculum) \
        .eq("program_id", course.program_id) \
        .execute()
    
    if not curr_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Curriculum '{course.curriculum}' not found"
        )
    
    curriculum_id = curr_result.data[0]["id"]
    
    # Check if course already exists in this curriculum
    existing = supabase.table("curriculum_course") \
        .select("*") \
        .eq("curriculum_id", curriculum_id) \
        .eq("course_id", course.course_id) \
        .execute()
    
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Course '{course.course_id}' already exists in curriculum '{course.curriculum}'"
        )
    
    # Insert the curriculum_course entry
    try:
        result = supabase.table("curriculum_course").insert({
            "curriculum_id": curriculum_id,
            "course_id": course.course_id,
            "course_year": course.course_year,
            "course_sem": course.course_sem,
            "sequence": course.sequence
        }).execute()
        
        return {"message": "Course added to curriculum successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add course: {str(e)}"
        )

def deleteCourse(course_id: str, program_id: str, curriculum: str):
    """Delete a course from a curriculum"""
    # Get curriculum ID from name
    curr_result = supabase.table("curriculum") \
        .select("id") \
        .eq("program_id", program_id) \
        .eq("name", curriculum) \
        .execute()
    
    if not curr_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Curriculum '{curriculum}' not found"
        )
    
    curriculum_id = curr_result.data[0]["id"]
    
    # Delete the curriculum_course entry
    result = supabase.table("curriculum_course") \
        .delete() \
        .eq("curriculum_id", curriculum_id) \
        .eq("course_id", course_id) \
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found in curriculum"
        )
    
    return {"message": "Course deleted from curriculum successfully"}
