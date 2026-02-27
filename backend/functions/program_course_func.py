from db.supabase_client import supabase

def getCourseByProgram(program_id: str):
    # Join program_course with courses to get full course details
    result = supabase.table("program_course")\
        .select("*, courses(*)")\
        .eq("program_id", program_id)\
        .order("sequence")\
        .execute()
    
    # Flatten the response to include course details
    courses = []
    for item in result.data:
        course_data = item.get("courses", {})
        courses.append({
            **course_data,
            "sequence": item["sequence"]
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

