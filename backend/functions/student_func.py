from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from functions.student_course_func import getStudentCourses, getGWA, deleteCourses as DS
from schema.student_schema import Student
from schema.user_schema import User
from db.firestore import fs

students_list = []
student_collection = fs.collection("students").stream()

students_list = [{**student.to_dict(), "id": student.id} for student in student_collection]

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
    for student in students_list:
        full_name = " ".join(filter(None, [student["l_name"], student["f_name"], student["m_name"]])).lower()

        if query not in full_name and query not in student["id"]:
            continue

        valid_students.append(student)

    result = [
        {
            "student_id":   student["id"],
            "name":         f"{student["l_name"]}, {student["f_name"]} {student["m_name"] or ''}".strip()
        }

        for student in valid_students[:10]
    ]

    return result

def get_students():
    return students_list

def filter_students(key: str, value: str):
    filtered = [students for students in students_list
                if students[key] == value]
    
    return filtered