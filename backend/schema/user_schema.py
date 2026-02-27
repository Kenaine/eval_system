from pydantic import BaseModel

class RequestedPass(BaseModel):
    newPass:        str

class User(BaseModel):
    user_id:        str
    hashed_pass:    str
    role:           str