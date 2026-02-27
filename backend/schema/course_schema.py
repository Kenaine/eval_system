from pydantic import BaseModel

class CourseSchema(BaseModel):
    course_id:      str
    course_name:    str
    course_hours:   int
    course_preq:    str | None
    course_sem:     int
    hours_lab:      int
    hours_lec:      int
    units_lab:      int
    units_lec:      int