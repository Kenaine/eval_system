from functions import curriculum_func
from fastapi import APIRouter
from schema.curriculum_schema import Curriculum

router = APIRouter()

@router.get("/get/{program_id}")
def getPrgmCurr(program_id: str):
    return curriculum_func.getPrgmCurr(program_id)

@router.post("/add")
def addCurr(curr: Curriculum):
    return curriculum_func.addCurr(curr)
