from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from functions.student_course_func import getStudentCourses, getGWA, deleteCourses as DS
from schema.student_schema import Student
from schema.user_schema import User
from db.firestore import fs

students_list = []
student_collection = fs.collection("students").stream()

students_list = [{**student.to_dict(), "id": student.id} for student in student_collection]
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
    student_collection = fs.collection("students")

    student_info = student.model_dump()

    students_list.append(student.model_dump())

    del student_info["id"]
    student_collection.document(student.id).set(student_info)

def editStudent(student: Student):
    student_collection = fs.collection("students")

    student_info = student.model_dump()
    del student_info["id"]

    student_collection.document(student.id).set(student_info)

def deleteStudent(student_id: str):
    student = fs.collection("students").document(student_id)

    if not student.get().exists:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    student.delete()

def getStudent(student_id: str = None):
    if not student_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Admin must specify a student ID.")
    
    student_collection = fs.collection("students")
    
    student_doc = student_collection.document(student_id)
    student = student_doc.get()

    if not student.exists:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    student_data = student.to_dict()

    courses = getStudentCourses(student_doc.id, student_data["program_id"])

    total_units = sum(course["course_units"] for course in courses)
    units_taken = sum(course["course_units"] for course in courses if course["remark"] == "Passed")
    gwa = getGWA(courses)

    student_data["id"] = student.id
    student_data["gwa"] = gwa
    student_data["units_taken"] = units_taken
    student_data["total_units_required"] = total_units
    student_data["role"] = "student"

    return JSONResponse(content={"student": student_data, "courses": courses})

def search_students(query: str):
    valid_students = []

    pool = apply_filter()

    for student in pool:
        full_name = " ".join(filter(None, [student["l_name"], student["f_name"], student["m_name"]])).lower()

        if query not in full_name and query not in student["id"]:
            continue

        valid_students.append(student)

    result = [
        {
            "student_id":   student["id"],
            "id":           student["id"],
            "name":         f"{student["l_name"]}, {student["f_name"]} {student["m_name"] or ''}".strip()
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