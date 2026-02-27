from schema.student_schema import Student
from functions.student_func import addStudent
from functions.student_course_func import addEntry


def addStudentHelper(student: Student):
    # Add student record
    # Note: User accounts are created separately via Supabase Auth
    # Link student_id to profile after user signs up
    addStudent(student)
    # Add their courses
    addEntry(student.id, student.program_id)


