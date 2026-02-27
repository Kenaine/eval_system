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
    "program_id": ["BSCS", "BSIT", "BSEMC", "BITCF"]}

search_filter = {
    "year": [1, 2, 3, 4],
    "status": ["Regular", "Irregular"], 
    "is_transferee": [True, False],
    "program_id": ["BSCS", "BSIT", "BSEMC", "BITCF"]}

def addStudent(student: Student):
    student_info = student.model_dump()
    
    result = supabase.table("students").insert(student_info).execute()
    
    # Reload students list
    loadStudents()
    
    return result

def editStudent(student: Student):
    student_info = student.model_dump()
    student_id = student_info["student_id"]
    
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
    
    result = supabase.table("students").select("*").eq("student_id", student_id).execute()
    
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    student_data = result.data[0]

    courses = getStudentCourses(student_id, student_data["program_id"])

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

def search_students(query: str):
    valid_students = []

    pool = apply_filter()

    for student in pool:
        full_name = " ".join(filter(None, [student["l_name"], student["f_name"], student.get("m_name", "")])).lower()

        if query not in full_name and query not in student["student_id"]:
            continue

        valid_students.append(student)

    result = [
        {
            "student_id":   student["student_id"],
            "name":         f"{student['l_name']}, {student['f_name']} {student.get('m_name', '') or ''}".strip(),
            "evaluated":    str(student.get("evaluated", ""))
        }

        for student in valid_students[:10]
    ]

    return result

def get_students():
    return students_list

def edit_filter(key: str, value: str):
    if key == "is_transferee":
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
    

#------------------------------------------------FOR DASHBOARD--------------------------------------------------------

def filter_students(key: str, value: str):
    if key == "program_id":
        if value in active_filter[key]:
            active_filter[key].remove(value)
        else:
            active_filter[key].append(value)

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
        if key == "program_id":
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
    "program_id": ["BSCS", "BSIT", "BSEMC", "BITCF"]}

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