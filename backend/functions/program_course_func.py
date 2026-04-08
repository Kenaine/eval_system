from db.supabase_client import supabase

def getCourseByProgram(program_id: str):
    # Get the active curriculum for this program
    curriculum_result = supabase.table("curriculum")\
        .select("id")\
        .eq("program_id", program_id)\
        .eq("active", True)\
        .execute()
    
    if not curriculum_result.data:
        return []
    
    curriculum_id = curriculum_result.data[0]["id"]
    
    # Get all courses in this curriculum, ordered by course_year and course_sem
    courses_result = supabase.table("curriculum_course")\
        .select("*,courses(*)")\
        .eq("curriculum_id", curriculum_id)\
        .order("course_year")\
        .order("course_sem")\
        .execute()
    
    courses = []
    for item in courses_result.data:
        course_data = item.get("courses", {})
        courses.append({
            **course_data,
            "sequence": item["sequence"],
            "course_year": item.get("course_year"),
            "course_sem": item.get("course_sem")
        })
    
    return courses

def updateOrder(program_id: str, course_ids: list[str]):
    # Update sequence for each course in the order provided
    for index, course_id in enumerate(course_ids):
        supabase.table("program_course")\
            .update({"sequence": index})\
            .eq("program_id", program_id)\
            .eq("course_id", course_id)\
            .execute()

