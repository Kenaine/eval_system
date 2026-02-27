from fastapi import APIRouter
from functions.program_func import getPrograms

router = APIRouter()

@router.get("/get")
def getProgramsRoute():
    return getPrograms()