from schema.student_schema import Student
from functions.student_func import addStudent
from functions.student_course_func import addEntry
from db.supabase_client import supabase


def addStudentHelper(student: Student):
    # Add student record
    addStudent(student)

    # Auto-create user credentials (ported from course_checklist addUser).
    # Username = student_id. Password stored as TEMP_<student_id> so it gets
    # bcrypt-hashed automatically on the student's first login.
    supabase.table("user_credentials").insert({
        "username":       student.student_id,
        "hashed_password": f"TEMP_{student.student_id}",
        "role":           "student",
        "student_id":     student.student_id,
        "full_name":      f"{student.f_name} {student.l_name}"
    }).execute()

    # Add their courses
    addEntry(student.student_id, student.program_id)


