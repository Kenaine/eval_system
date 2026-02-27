from schema.course_schema import CourseSchema 
from functions.program_course_func import updateOrder
from fastapi import HTTPException, status

from db.supabase_client import supabase

#--------------------------Supabase Functions--------------------------
def addCourse(course: CourseSchema):
    course_dict = course.model_dump()
    
    result = supabase.table("courses").insert(course_dict).execute()
    return result

def editCourse(course: CourseSchema, course_id: str):
    # Check if old course exists
    old_course = supabase.table("courses").select("*").eq("course_id", course_id).execute()
    
    if not old_course.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course does not exist")
    
    course_dict = course.model_dump()
    new_id = course_dict["course_id"]
    
    # If the course_id changed, delete old and insert new
    if course_id != new_id:
        supabase.table("courses").delete().eq("course_id", course_id).execute()
        result = supabase.table("courses").insert(course_dict).execute()
    else:
        # If course_id is same, just update
        result = supabase.table("courses").update(course_dict).eq("course_id", course_id).execute()
    
    return result

def deleteCourse(course_id: str):
    # Check if course exists
    course = supabase.table("courses").select("*").eq("course_id", course_id).execute()
    
    if not course.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course does not exist")
    
    result = supabase.table("courses").delete().eq("course_id", course_id).execute()
    return result
            
        




