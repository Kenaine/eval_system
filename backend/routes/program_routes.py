from fastapi import APIRouter
from functions.program_func import  getProgramFirestore

router = APIRouter()

@router.get("/get")
def getPrograms():
    return getProgramFirestore()