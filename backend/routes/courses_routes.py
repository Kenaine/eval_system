from functions import courses_func
from functions.program_course_func import getCourseByProgram
from schema.course_schema import CourseSchema
from fastapi import APIRouter

router = APIRouter()

#--------------------------Firestore Functions--------------------------
@router.post("/add")
def addCourse(course: CourseSchema):
    courses_func.addCourseFirestore(course)
    return {"message": "Course add successful"}

@router.put("/edit/{course_id}")
def editCourse(course: CourseSchema, course_id: str):
    courses_func.editCourseFirestore(course, course_id)
    return {"message": "Course edited succesful"}

@router.delete("/delete/{course_id}")
def deleteCourse(course_id: str):
    courses_func.deleteCourseFirestore(course_id)
    return {"message": "Course deleted succesful"}

@router.put("/update/{program_id}")
def updateCourses(program_id: str, course: list[CourseSchema]):
    return courses_func.updateCourses(program_id, course)

@router.get("/get/{program_id}")
def getCourse(program_id: str):
    return getCourseByProgram(program_id)