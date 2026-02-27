from functions import courses_func
from functions.program_course_func import getCourseByProgram
from schema.course_schema import CourseSchema
from fastapi import APIRouter

router = APIRouter()

#--------------------------Supabase Functions--------------------------
@router.post("/add")
def addCourseRoute(course: CourseSchema):
    courses_func.addCourse(course)
    return {"message": "Course add successful"}

@router.put("/edit/{course_id}")
def editCourseRoute(course: CourseSchema, course_id: str):
    courses_func.editCourse(course, course_id)
    return {"message": "Course edited succesful"}

@router.delete("/delete/{course_id}")
def deleteCourseRoute(course_id: str):
    courses_func.deleteCourse(course_id)
    return {"message": "Course deleted succesful"}

@router.put("/update/{program_id}")
def updateCourses(program_id: str, course: list[CourseSchema]):
    return courses_func.updateCourses(program_id, course)

@router.get("/get/{program_id}")
def getCourse(program_id: str):
    return getCourseByProgram(program_id)