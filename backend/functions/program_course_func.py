from db.supabase_client import supabase

def getCourseByProgram(program_id: str):
    # Join program_course with courses to get full course details
    result = supabase.table("program_course")\
        .select("*, courses(*)")\
        .eq("program_id", program_id)\
        .order("sequence")\
        .execute()
    
    # Flatten the response to include course details
    # Note: program_course doesn't have year/sem, so we distribute across 4 years
    courses = []
    total_courses = len(result.data)
    courses_per_sem = max(1, total_courses // 8)  # Distribute across 4 years × 2 sems
    
    for idx, item in enumerate(result.data):
        course_data = item.get("courses", {})
        
        # Calculate year and semester based on sequence/index
        sem_index = idx // courses_per_sem
        year = min((sem_index // 2) + 1, 4)  # Years 1-4
        sem = (sem_index % 2) + 1  # Semester 1 or 2
        
        courses.append({
            **course_data,
            "sequence": item["sequence"],
            "course_year": year,
            "course_sem": sem
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

