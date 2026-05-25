from pydantic import BaseModel
from typing import Optional

class StudentCourse(BaseModel):
    student_id: str
    course_id: str
    grade: float | None = None
    remark: str | None = None
    retakes: int | None = None
    evaluator: str | None = None