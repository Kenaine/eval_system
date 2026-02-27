# functions/student_course_func.py
from fastapi import HTTPException, status
from db.supabase_client import supabase

def addEntry(student_id: str, program_id: str):
    # Get all courses for the program
    pc_result = supabase.table("program_course")\
        .select("course_id")\
        .eq("program_id", program_id)\
        .execute()
    
    if not pc_result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No courses found for this program")
    
    # Create student_course entries (only IDs, no denormalized data)
    student_courses = [
        {
            "student_id": student_id,
            "course_id": course["course_id"],
            "grade": None,
            "remark": ""
        }
        for course in pc_result.data
    ]
    
    # Insert in bulk
    result = supabase.table("student_courses").insert(student_courses).execute()
    return result

def addCourseStudent(course_ids: list[str]):
    # Get all students
    students_result = supabase.table("students").select("student_id").execute()
    students_ids = [student["student_id"] for student in students_result.data]
    
    # Create student_course entries
    entries = []
    for student_id in students_ids:
        for course_id in course_ids:
            entries.append({
                "student_id": student_id,
                "course_id": course_id,
                "grade": None,
                "remark": ""
            })
    
    # Insert in bulk
    if entries:
        result = supabase.table("student_courses").insert(entries).execute()
    return result

def deleteCourses(course_id: str):
    # Delete all student_courses for this course_id
    result = supabase.table("student_courses")\
        .delete()\
        .eq("course_id", course_id)\
        .execute()
    
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")
    
    return result

def deleteStudent(student_id: str):
    # Delete all courses for this student
    result = supabase.table("student_courses")\
        .delete()\
        .eq("student_id", student_id)\
        .execute()
    
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    return result
    
def getStudentCourses(student_id: str, program_id: str):
    # Get student courses with full course details via join
    result = supabase.table("student_courses")\
        .select("*, courses(*), program_course!inner(sequence)")\
        .eq("student_id", student_id)\
        .eq("program_course.program_id", program_id)\
        .execute()
    
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    courses = []
    for item in result.data:
        course_data = item.get("courses", {})
        program_course = item.get("program_course", [{}])[0] if isinstance(item.get("program_course"), list) else item.get("program_course", {})
        
        # Calculate total units
        units_lec = course_data.get("units_lec", 0)
        units_lab = course_data.get("units_lab", 0)
        
        courses.append({
            "course_id": course_data.get("course_id"),
            "course_name": course_data.get("course_name"),
            "course_units": units_lec + units_lab,
            "units_lec": units_lec,
            "units_lab": units_lab,
            "semester": course_data.get("course_sem"),
            "grade": item.get("grade"),
            "remark": item.get("remark") or "N/A",
            "sequence": program_course.get("sequence", 0)
        })
    
    # Sort by sequence
    courses.sort(key=lambda x: x["sequence"])
        
    return courses

def getGWA(courses):
    total_weighted = 0
    total_units = 0

    for course in courses:
        grade = course.get("grade")
        units = course.get("course_units")
        remark = course.get("remark", "")

        if grade is not None and remark == "Passed":
            total_weighted += grade * units
            total_units += units

    if total_units == 0:
        return 0.0

    return round(total_weighted / total_units, 4)

def updateGrades(course_id: str, student_id: str, grade: float, remark: str):
    if grade == -1.0:
        grade = None
    
    # Find the student_course record
    course_result = supabase.table("student_courses")\
        .select("*")\
        .eq("course_id", course_id)\
        .eq("student_id", student_id)\
        .execute()
    
    if not course_result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student/Course not found")
    
    # Update the record
    result = supabase.table("student_courses")\
        .update({"grade": grade, "remark": remark})\
        .eq("course_id", course_id)\
        .eq("student_id", student_id)\
        .execute()
    
    return result

def updateGradesBulk(student_id: str, grades_list: list):
    for grade_entry in grades_list:
        course_id = grade_entry["course_id"]
        grade = grade_entry["grade"]
        
        if grade == -1.0:
            grade = None
        
        remark = getRemark(grade)
        
        # Check if course exists for student
        courses = supabase.table("student_courses")\
            .select("*")\
            .eq("course_id", course_id)\
            .eq("student_id", student_id)\
            .execute()
        
        if not courses.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Course {course_id} not found for student {student_id}")
        
        # Update the grade
        supabase.table("student_courses")\
            .update({"grade": grade, "remark": remark})\
            .eq("course_id", course_id)\
            .eq("student_id", student_id)\
            .execute()
    
    return {"message": "Grades updated successfully"}

def getRemark(grade: float | None) -> str:
    if grade is None:
        return "N/A"
    elif grade <= 2.5:
        return "Passed"
    else:
        return "Failed"
