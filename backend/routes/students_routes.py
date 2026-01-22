from fastapi import APIRouter, Depends, HTTPException, status, Query
from schema.student_schema import Student
from schema.user_schema import User
from functions import student_func
from functions.auth_func import getCurrentUser, checkRole
from services.student_services import addStudentHelper


router = APIRouter()

@router.post("/add")
def addStudent(student: Student):
    return addStudentHelper(student)

@router.put("/edit")
def editStudent(student: Student):
    return student_func.editStudent(student)

@router.delete("/delete/{student_id}")
def deleteStudent(student_id: str):
    return student_func.deleteStudent(student_id)

@router.get("/search")
def search_students(q: str = Query(..., min_length=1)):
    return student_func.search_students(q)

@router.get("/get/{student_id}")
def getStudentByID(student_id: str):
    return student_func.getStudent(student_id)

@router.get("/get_all")
def getAllStudents():
    return student_func.get_students()

