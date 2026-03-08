from pydantic import BaseModel

class Curriculum(BaseModel):
    name:       str
    program_id: str
