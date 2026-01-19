from fastapi import APIRouter, UploadFile, File
from functions.student_course_func import updateGrades, getStudentCourses, updateGradesBulk
from pydantic import BaseModel
import csv
import io

router = APIRouter()

class Grades(BaseModel):
    grade: float
    remark: str 

@router.get("/get")
def getStudentCourse(student_id: str, program_id: str):
    return getStudentCourses(student_id, program_id)

@router.patch("/update-grade/{student_id}-{course_id}")
def updateGrade(course_id: str, student_id: str, newGrades: Grades):
    return updateGrades(course_id, student_id, newGrades.grade, newGrades.remark)

@router.post("/update-grades-bulk/{student_id}")
async def updateGradesBulkRoute(student_id: str, file: UploadFile = File(...)):
    contents = await file.read()
    csv_data = csv.DictReader(io.StringIO(contents.decode("utf-8")))
    
    grades_list = []
    for row in csv_data:
        grades_list.append({
            "course_id": row["course_id"],
            "grade": float(row["grade"]) if row["grade"] != "-1" else -1.0
        })
    
    return updateGradesBulk(student_id, grades_list)

