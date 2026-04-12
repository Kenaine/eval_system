from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from functions.student_course_func import getStudentCourses, getGWA, deleteCourses as DS
from schema.student_schema import Student
from schema.user_schema import User
from db.supabase_client import supabase

students_list = []

def loadStudents():
    """Load all students into memory for filtering"""
    global students_list
    result = supabase.table("students").select("*").execute()
    students_list = result.data

# Load students on module import
loadStudents()

active_filter = {
    "status": {"value": "", "active": False}, 
    "is_transferee": {"value": "", "active": False},
    "program_id": ["BSCS", "BSIT", "BSEMC", "BITCF"],
    "year": [1, 2, 3, 4]}

search_filter = {
    "year": [1, 2, 3, 4],
    "status": ["Regular", "Irregular"], 
    "is_transferee": [True, False],
    "program_id": ["BSCS", "BSIT", "BSEMC", "BITCF"],
    "archived": [True, False]}

def addStudent(student: Student):
    student_info = student.model_dump(exclude={"curriculum"}, exclude_none=True)
    
    # Check if student_id already exists
    existing_student = supabase.table("students").select("*").eq("student_id", student.student_id).execute()
    if existing_student.data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Student with ID '{student.student_id}' already exists")
    
    # Check if email already exists (if provided)
    if student.email:
        existing_email = supabase.table("students").select("*").eq("email", student.email).execute()
        if existing_email.data:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Student with email '{student.email}' already exists")
    
    result = supabase.table("students").insert(student_info).execute()
    
    # Reload students list
    loadStudents()
    
    return result

def editStudent(student: Student):
    student_info = student.model_dump(exclude={"curriculum"}, exclude_none=True)
    student_id = student_info["student_id"]
    
    # Check if student exists
    existing_student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    if not existing_student.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Student with ID '{student_id}' not found")
    
    # Check if email already exists in another student record (if provided)
    if student.email:
        existing_email = supabase.table("students").select("*").eq("email", student.email).execute()
        if existing_email.data and existing_email.data[0]["student_id"] != student_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Student with email '{student.email}' already exists")
    
    result = supabase.table("students").update(student_info).eq("student_id", student_id).execute()
    
    # Reload students list
    loadStudents()
    
    return result

def deleteStudent(student_id: str):
    # Check if student exists
    student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    
    if not student.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    result = supabase.table("students").delete().eq("student_id", student_id).execute()
    
    # Reload students list
    loadStudents()
    
    return result

def getStudent(student_id: str = None):
    if not student_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Admin must specify a student ID.")
    
    try:
        result = supabase.table("students").select("*").eq("student_id", student_id).execute()
        
        if not result.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
        
        student_data = result.data[0]

        # Check if student has any courses in student_courses
        check_courses = supabase.table("student_courses")\
            .select("course_id")\
            .eq("student_id", student_id)\
            .limit(1)\
            .execute()
        
        # Only auto-populate courses for regular students (not irregular, not transferee)
        is_regular = student_data.get("status", "").upper() == "REGULAR"
        is_transferee = student_data.get("is_transferee", False)
        
        if not check_courses.data and is_regular and not is_transferee:
            from functions.student_course_func import addEntry
            addEntry(student_id, student_data["program_id"])
        
        courses = getStudentCourses(student_id, student_data["program_id"], student_data.get("curriculum_id"))

        total_units = sum(course["course_units"] for course in courses)
        units_taken = sum(course["course_units"] for course in courses if course["remark"] == "Passed")
        gwa = getGWA(courses)

        student_data["gwa"] = gwa
        student_data["units_taken"] = units_taken
        student_data["total_units_required"] = total_units
        student_data["role"] = "student"
        
        # Convert evaluated timestamp to string if it exists
        if "evaluated" in student_data and student_data["evaluated"] is not None:
            if hasattr(student_data["evaluated"], "isoformat"):
                student_data["evaluated"] = student_data["evaluated"].isoformat()
            else:
                student_data["evaluated"] = str(student_data["evaluated"])

        return JSONResponse(content={"student": student_data, "courses": courses})
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in getStudent for {student_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error fetching student: {str(e)}")

def search_students(query: str):
    """
    Search students by name or student_id in the students table only, applying active filters.
    When query is empty, returns all students that match the active filters.
    """
    query_lower = query.lower().strip() if query else ""
    results = []

    # Start building the query with base selection
    query_builder = supabase.table("students") \
        .select("student_id, f_name, l_name, m_name, evaluated, status, is_transferee, program_id, year")
    
    # Apply search filters
    if search_filter.get("status"):
        # Filter by status values in search_filter
        query_builder = query_builder.in_("status", search_filter["status"])
    
    if search_filter.get("is_transferee") is not None:
        # Filter by is_transferee values in search_filter
        query_builder = query_builder.in_("is_transferee", search_filter["is_transferee"])
    
    if search_filter.get("program_id"):
        # Filter by program_id values in search_filter
        query_builder = query_builder.in_("program_id", search_filter["program_id"])
    
    if search_filter.get("year"):
        # Filter by year values in search_filter
        query_builder = query_builder.in_("year", search_filter["year"])

    if search_filter.get("archived"):
        query_builder = query_builder.in_("archived", search_filter["archived"])
    
    db_result = query_builder.limit(500).execute()

    for s in db_result.data:
        full_name = " ".join(
            filter(None, [s.get("l_name"), s.get("f_name"), s.get("m_name")])
        ).lower()
        # If query is empty, include all students; otherwise filter by query
        if not query_lower or query_lower in full_name or query_lower in s["student_id"].lower():
            results.append({
                "student_id": s["student_id"],
                "name": f"{s['l_name']}, {s['f_name']} {s.get('m_name', '') or ''}".strip(),
                "evaluated": str(s.get("evaluated", ""))
            })
            if len(results) >= 30:
                break

    return results

def get_students():
    return students_list

def edit_filter(key: str, value: str):
    if key == "is_transferee" or key == "archived":
        value = str_to_bool(value)
    elif key == "year":
        value = int(value)

    if value in search_filter[key]:
        search_filter[key].remove(value)
    else:
        search_filter[key].append(value)


def str_to_bool(value: str):
    if value == "true":
        return True
    elif value == "false":
        return False
    
    return value

def apply_filter():
    pool = students_list

    for key, value in search_filter.items():
        print(key)

        pool = [students for students in pool
                if students[key] in search_filter[key]]
        
    return pool

def reset_searchFilter():
    global search_filter 
    search_filter = {
    "year": [1, 2, 3, 4],
    "status": ["Regular", "Irregular"], 
    "is_transferee": [True, False],
    "program_id": ["BSCS", "BSIT", "BSEMC", "BITCF"]}

def archiveStudent(student_id: str):
    # Check if student exists
    student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    
    if not student.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    result = supabase.table("students").update({"archived": True}).eq("student_id", student_id).execute()
    
    # Reload students list
    loadStudents()
    
    return JSONResponse(content={"message": "Student archived successfully"})

def unarchiveStudent(student_id: str):
    # Check if student exists
    student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    
    if not student.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    result = supabase.table("students").update({"archived": False}).eq("student_id", student_id).execute()
    
    # Reload students list
    loadStudents()
    
    return JSONResponse(content={"message": "Student unarchived successfully"})
    

#------------------------------------------------FOR DASHBOARD--------------------------------------------------------

def filter_students(key: str, value: str):
    if key == "program_id":
        if value in active_filter[key]:
            active_filter[key].remove(value)
        else:
            active_filter[key].append(value)

        return execute_filter()

    if key == "year":
        num = int(value)

        if num in active_filter[key]:
            active_filter[key].remove(num)
        else:
            active_filter[key].append(num)

        return execute_filter()
            
    if key == "is_transferee":
        value = str_to_bool(value)

    if active_filter[key]["value"] == value:
        active_filter[key]["value"] = ""
        active_filter[key]["active"] = False
    else:
        active_filter[key]["value"] = value
        active_filter[key]["active"] = True

    return execute_filter()

def execute_filter():
    pool = students_list

    for key, value in active_filter.items():
        if key == "program_id" or key == "year":
            pool = [students for students in pool
                    if students[key] in active_filter[key]]
            continue

        if value["active"] != True:
            continue

        pool = [students for students in pool
                if students[key] == value["value"]]
        
    return pool

def reset_filter():
    global active_filter 
    active_filter = {
    "status": {"value": "", "active": False}, 
    "is_transferee": {"value": "", "active": False},
    "program_id": ["BSCS", "BSIT", "BSEMC", "BITCF"],
    "year": [1, 2, 3, 4]}

#------------------------------------------------FOR EVALUATION--------------------------------------------------------

def evaluateStudent(student_id: str):
    import datetime
    
    # Check if student exists
    student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    
    if not student.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    current_timestamp = int(datetime.datetime.now().timestamp() * 1000)  # Convert to milliseconds
    result = supabase.table("students").update({"evaluated": current_timestamp}).eq("student_id", student_id).execute()
    
    # Reload students list
    loadStudents()
    
    return JSONResponse(content={"message": "Student evaluated successfully", "timestamp": str(current_timestamp)})

def takeOffEvaluation(student_id: str):
    # Check if student exists
    student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    
    if not student.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    result = supabase.table("students").update({"evaluated": None}).eq("student_id", student_id).execute()
    
    # Reload students list
    loadStudents()
    
    return JSONResponse(content={"message": "Evaluation removed successfully"})