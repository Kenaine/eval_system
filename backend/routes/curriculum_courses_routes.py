from functions import curriculum_course_func
from schema.curriculum_course_schema import CurriculumCourse, DeleteCurriculumCourse
from fastapi import APIRouter
from pydantic import BaseModel

class ReorderCoursesRequest(BaseModel):
    program_id: str
    curriculum: str
    course_ids: list

router = APIRouter()

@router.get("/get_courses")
def getCurrCourses(program: str, curriculum: str):
    return curriculum_course_func.getCurrCourse(program, curriculum)

@router.post("/add-course")
def addCourse(course: CurriculumCourse):
    return curriculum_course_func.addCourse(course)

@router.post("/delete-course")
def deleteCourse(course: DeleteCurriculumCourse):
    return curriculum_course_func.deleteCourse(course.course_id, course.program_id, course.curriculum)

@router.post("/reorder-courses")
def reorderCourses(request: ReorderCoursesRequest):
    return curriculum_course_func.reorderCourses(request.program_id, request.curriculum, request.course_ids)
