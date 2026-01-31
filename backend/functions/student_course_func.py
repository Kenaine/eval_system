# functions/student_course_func.py
from fastapi import HTTPException, status
from db.firestore import fs
from math import ceil

def addEntry(student_id: str, program_id: str):
    PC_collection = fs.collection("program_course")
    SC_collection = fs.collection("student_courses")

    courses = PC_collection.where("program_id", "==", program_id).stream()

    student_course = [
        {
            **course.to_dict(),
            "student_id": student_id,
            "grade": None,
            "remark": "",
            "evaluated": False

        }
        for course in courses
    ]

    chunk_size = 500

    for chunk in range(ceil(len(student_course) / chunk_size)):
        batch = fs.batch()

        for i in student_course[chunk * chunk_size : (chunk + 1) * chunk_size]:
            doc_ref = SC_collection.document()
            batch.set(doc_ref, i)

        batch.commit()

def addCourseStudent(course_ids: list[str]):
    student_course_collection = fs.collection("student_courses")
    student_collection = fs.collection("students")

    students_docs = student_collection.stream()
    students_ids = [student.id for student in students_docs]

    batch = fs.batch()
    chunk_size = 500
    index = 0

    for student_id in students_ids:

        for course_id in course_ids:
            doc_ref = student_course_collection.document()
            batch.set(doc_ref, {"student_id": student_id, "course_id": course_id, "grade": 0, "remark": None})
            index += 1

            if index % chunk_size == 0:
                batch.commit()
                batch = fs.batch()

    batch.commit()


def deleteCourses(course_id: str):
    SC_collection = fs.collection("student_courses")

    courses = list(SC_collection.where("course_id", "==", course_id).stream())

    if len(courses) == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")
    
    chunk_size = 500

    for chunk in range(ceil(len(courses) / chunk_size)):
        batch = fs.batch()

        for course in courses[chunk * chunk_size : (chunk + 1) * chunk_size]:
            batch.delete(course.reference)

        batch.commit()

def deleteStudent(student_id: str):
    SC_collection = fs.collection("student_courses")

    student_courses = list(SC_collection.where("student_id", "==", student_id).stream())

    if len(student_courses) == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    chunk_size = 500

    for chunk in range(ceil(len(student_courses) / 4)):
        batch = fs.batch()

        for course in student_courses[chunk * chunk_size : (chunk + 1) * chunk_size]:
            batch.delete(course.reference)

        batch.commit()
    
def getStudentCourses(student_id: str, program_id: str):
    SC_collection = fs.collection("student_courses")

    student_courses = list(SC_collection.where("student_id", "==", student_id).stream())

    if len(student_courses) == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    courses = []

    for course in student_courses:
        student_course_dict = course.to_dict()

        courses.append({ "course_id": student_course_dict["course_id"],
                        "course_name": student_course_dict["course_name"],
                        "course_units": student_course_dict["course_units"],
                        "year": student_course_dict["course_year"],
                        "semester": student_course_dict["course_sem"],
                        "grade": student_course_dict["grade"],
                        "remark": student_course_dict["remark"] or "N/A",
                        "sequence": student_course_dict["sequence"]
                        })
        
    courses.sort(key = lambda x: (x["year"], x["semester"], x["sequence"]))
        
    return courses

def getGWA(courses):
    total_weighted = 0
    total_units = 0

    for course in courses:
        grade = course.get("grade")
        units = course.get("course_units")
        remark = course.get("remark", "")

        if grade is not None and remark == "Passed":
            total_weighted += grade * units
            total_units += units

    if total_units == 0:
        return 0.0  # or 0.0, or "N/A", depending on your app

    return round(total_weighted / total_units, 4)  # Rounded to 4 decimal places

def updateGrades(course_id: str, student_id: str, grade: float, remark: str):
    if grade == -1.0:
        grade = None

    student_course_collection = fs.collection("student_courses")

    course = list(student_course_collection.where("course_id", "==", course_id).where("student_id", "==", student_id).stream())

    if len(course) == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student/Course not found")
    
    course[0].reference.update({"grade": grade, "remark": remark})

def updateGradesBulk(student_id: str, grades_list: list):
    student_course_collection = fs.collection("student_courses")
    batch = fs.batch()
    index = 0
    chunk_size = 500
    
    for grade_entry in grades_list:
        course_id = grade_entry["course_id"]
        grade = grade_entry["grade"]
        
        
        if grade == -1.0:
            grade = None
        
        remark = getRemark(grade)
        courses = list(student_course_collection.where("course_id", "==", course_id).where("student_id", "==", student_id).stream())
        
        if len(courses) == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Course {course_id} not found for student {student_id}")
        
        batch.update(courses[0].reference, {"grade": grade, "remark": remark})
        index += 1
        
        if index % chunk_size == 0:
            batch.commit()
            batch = fs.batch()
    
    batch.commit()
    return {"message": "Grades updated successfully"}

def getRemark(grade: float | None) -> str:
    if grade is None:
        return "N/A"
    elif grade <= 2.5:
        return "Passed"
    else:
        return "Failed"
