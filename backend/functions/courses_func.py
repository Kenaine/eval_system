from schema.course_schema import CourseSchema 
from functions.program_course_func import updateOrder
from fastapi import HTTPException, status

from db.supabase_client import supabase

#--------------------------Supabase Functions--------------------------
def getAllCourses():
    """Get all courses from the courses table"""
    result = supabase.table("courses").select("*").execute()
    # Sort by course_id
    return sorted(result.data, key=lambda x: x.get("course_id", ""))

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


def updateCourses(program_id: str, courses: list[CourseSchema]):
    """
    Sync course changes across courses and program_course tables.
    Ported from course_checklist updateCourses / checkCourses / checkCollection,
    adapted for SQL — uses upsert instead of Firestore batch operations.
    """
    errors = []

    for course in courses:
        course_dict = course.model_dump()
        course_id = course_dict["course_id"]
        sequence = course_dict.pop("sequence", 0) if "sequence" in course_dict else 0

        try:
            # Upsert into courses table (insert or update)
            existing = supabase.table("courses").select("course_id").eq("course_id", course_id).execute()
            if existing.data:
                supabase.table("courses").update(course_dict).eq("course_id", course_id).execute()
            else:
                supabase.table("courses").insert(course_dict).execute()

            # Upsert into program_course table
            pc_existing = supabase.table("program_course") \
                .select("course_id") \
                .eq("program_id", program_id) \
                .eq("course_id", course_id) \
                .execute()

            if pc_existing.data:
                supabase.table("program_course") \
                    .update({"sequence": sequence}) \
                    .eq("program_id", program_id) \
                    .eq("course_id", course_id) \
                    .execute()
            else:
                supabase.table("program_course").insert({
                    "program_id": program_id,
                    "course_id":  course_id,
                    "sequence":   sequence
                }).execute()

        except Exception as e:
            errors.append({"course_id": course_id, "error": str(e)})

    if errors:
        raise HTTPException(
            status.HTTP_207_MULTI_STATUS,
            detail={"message": "Some courses failed to sync", "errors": errors}
        )

    return {"message": f"{len(courses)} course(s) synced for program {program_id}"}

