import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import JSONResponse
from schema.student_schema import Student
from functions import student_func
from services.student_services import addStudentHelper, bulkAddStudents


router = APIRouter()

@router.post("/add")
def addStudent(student: Student):
    return addStudentHelper(student)

@router.put("/edit")
def editStudent(student: Student):
    return student_func.editStudent(student)

@router.delete("/delete/{student_id}")
def deleteStudent(student_id: str):
    return student_func.deleteStudent(student_id)

@router.get("/search")
def search_students(q: str = Query(default="", min_length=0)):
    return student_func.search_students(q)

@router.get("/get/{student_id}")
def getStudentByID(student_id: str):
    return student_func.getStudent(student_id)

@router.get("/get_all")
def getAllStudents():
    return student_func.get_students()

@router.get("/filter/{key}/{value}")
def getFilteredStudents(key: str, value: str):
    return  student_func.filter_students(key, value)

@router.post("/edit_filter/{key}/{value}")
def editFilter(key: str, value: str):
    return student_func.edit_filter(key, value)

@router.put("/reset_filter")
def resetFilter():
    return student_func.reset_filter()

@router.post("/evaluate/{student_id}")
def evaluateStudent(student_id: str):
    return student_func.evaluateStudent(student_id)

@router.post("/take_off_evaluation/{student_id}")
def takeOffEvaluation(student_id: str):
    return student_func.takeOffEvaluation(student_id)


@router.post("/bulk-upload")
async def bulk_upload_students(file: UploadFile = File(...)):
    """
    Accept a CSV file and insert each row as a student.
        Required columns (same as Add Student popup):
            student_id, email, dept, program_id, curriculum, f_name, l_name, year, status
        Optional columns:
            m_name, is_transferee, gwa, evaluated, archived

    Returns a summary: { inserted, failed, errors: [{row, reason}] }
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only .csv files are accepted")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # strip BOM if present
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    required = {
        "student_id",
        "email",
        "dept",
        "program_id",
        "curriculum",
        "f_name",
        "l_name",
        "year",
        "status",
    }
    if not required.issubset(set(reader.fieldnames or [])):
        missing = required - set(reader.fieldnames or [])
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"CSV missing required columns: {', '.join(sorted(missing))}"
        )

    rows = list(reader)
    results = bulkAddStudents(rows)
    return JSONResponse(status_code=207, content=results)

@router.patch("/archive")
def archiveStudent(student_id: str = Query(...)):
    return student_func.archiveStudent(student_id)

@router.patch("/unarchive")
def unarchiveStudent(student_id: str = Query(...)):
    return student_func.unarchiveStudent(student_id)

