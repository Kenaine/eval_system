from pydantic import BaseModel

class Student(BaseModel):
    student_id:     str
    program_id:     str
    archived:       bool = False
    evaluated:      int | None = None
    f_name:         str
    gwa:            float | None = None
    is_transferee:  bool = False
    l_name:         str
    m_name:         str | None = None
    status:         str
    year:           int

