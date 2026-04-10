# functions/student_course_func.py
from fastapi import HTTPException, status
from db.supabase_client import supabase


def _validate_percentage_grade(grade: float | None):
    if grade is None:
        return
    if grade < 0 or grade > 100:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Grade must be within 0 to 100"
        )


def percentage_to_gwa(grade: float | None) -> float | None:
    if grade is None:
        return None

    if grade >= 99:
        return 1.0
    if grade >= 96:
        return 1.25
    if grade >= 93:
        return 1.5
    if grade >= 90:
        return 1.75
    if grade >= 87:
        return 2.0
    if grade >= 84:
        return 2.25
    if grade >= 81:
        return 2.5
    if grade >= 78:
        return 2.75
    if grade >= 75:
        return 3.0
    return 5.0

def addEntry(student_id: str, program_id: str, curriculum: str | None = None, curriculum_id: int | None = None):
    pc_result = None

    if curriculum_id is None and curriculum:
        curr_result = supabase.table("curriculum")\
            .select("id")\
            .eq("program_id", program_id)\
            .eq("name", curriculum)\
            .limit(1)\
            .execute()

        if not curr_result.data:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                f"Curriculum '{curriculum}' not found for program '{program_id}'"
            )

        curriculum_id = curr_result.data[0]["id"]

    if curriculum_id is not None:
        pc_result = supabase.table("curriculum_course")\
            .select("course_id")\
            .eq("curriculum_id", curriculum_id)\
            .order("course_year")\
            .order("course_sem")\
            .order("sequence")\
            .execute()
    else:
        # Fallback: get all courses for the program
        pc_result = supabase.table("program_course")\
            .select("course_id")\
            .eq("program_id", program_id)\
            .execute()
    
    if not pc_result.data:
        if curriculum:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                f"No courses found for curriculum '{curriculum}'"
            )
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
    
def getStudentCourses(student_id: str, program_id: str, curriculum_id: int | None = None):
    # 1. Get student_courses for this student
    student_courses_result = supabase.table("student_courses")\
        .select("course_id, grade, remark")\
        .eq("student_id", student_id)\
        .execute()
    
    if not student_courses_result.data:
        return []
    
    # Get list of course_ids
    course_ids = [sc["course_id"] for sc in student_courses_result.data]
    
    if not course_ids:
        return []
    
    # 2. Get only the course details needed by this student
    courses_result = supabase.table("courses")\
        .select("course_id, course_name, units_lec, units_lab, course_sem")\
        .in_("course_id", course_ids)\
        .execute()
    
    # Filter to only the courses the student has
    course_map = {c["course_id"]: c for c in courses_result.data if c["course_id"] in course_ids}
    
    # 3. Resolve curriculum mapping.
    # Fast path: use stored curriculum_id. Fallback: infer by overlap.
    curriculum_meta_map = {}
    selected_curriculum_id = curriculum_id

    if selected_curriculum_id is None:
        curriculums_result = supabase.table("curriculum")\
            .select("id")\
            .eq("program_id", program_id)\
            .execute()

        if curriculums_result.data:
            curriculum_ids = [curr["id"] for curr in curriculums_result.data]
            curriculum_courses_result = supabase.table("curriculum_course")\
                .select("curriculum_id, course_id")\
                .in_("curriculum_id", curriculum_ids)\
                .in_("course_id", course_ids)\
                .execute()

            overlap_count = {}
            for item in curriculum_courses_result.data:
                cid = item.get("curriculum_id")
                overlap_count[cid] = overlap_count.get(cid, 0) + 1

            if overlap_count:
                selected_curriculum_id = max(overlap_count, key=overlap_count.get)

    if selected_curriculum_id is not None:
        selected_curriculum_courses = supabase.table("curriculum_course")\
            .select("course_id, course_year, course_sem, sequence")\
            .eq("curriculum_id", selected_curriculum_id)\
            .in_("course_id", course_ids)\
            .execute()

        curriculum_meta_map = {
            item["course_id"]: item
            for item in selected_curriculum_courses.data
        }

    # 4. Get program_course data for this program (fallback metadata)
    program_courses_result = supabase.table("program_course")\
        .select("course_id, sequence")\
        .eq("program_id", program_id)\
        .in_("course_id", course_ids)\
        .execute()
    
    # Create lookup maps
    sequence_map = {pc["course_id"]: pc["sequence"] for pc in program_courses_result.data}
    grade_map = {
        sc["course_id"]: {
            "grade": sc.get("grade"),
            "remark": sc.get("remark")
        }
        for sc in student_courses_result.data
    }
    
    # Build final course list
    courses = []
    for index, course_id in enumerate(course_ids):
        curriculum_meta = curriculum_meta_map.get(course_id, {})

        sequence = curriculum_meta.get("sequence")
        if sequence is None:
            sequence = sequence_map.get(course_id)

        if sequence is None:
            # Fallback for curriculum-seeded courses that are not present in program_course
            sequence = 10000 + index
        
        course_data = course_map.get(course_id, {})
        grade_data = grade_map.get(course_id, {})
        remark_value = grade_data.get("remark") or "N/A"
        evaluated_value = bool(grade_data.get("grade") is not None or (remark_value not in ["", "N/A"]))
        
        year = curriculum_meta.get("course_year")
        semester = curriculum_meta.get("course_sem") or course_data.get("course_sem")

        # Fallback when curriculum metadata is unavailable.
        if year is None:
            if sequence >= 10000:
                year = 1
            else:
                year = min((sequence // 10) + 1, 4)
        
        units_lec = course_data.get("units_lec", 0) or 0
        units_lab = course_data.get("units_lab", 0) or 0
        
        courses.append({
            "course_id": course_id,
            "course_name": course_data.get("course_name"),
            "course_units": units_lec + units_lab,
            "units_lec": units_lec,
            "units_lab": units_lab,
            "semester": semester,
            "year": year,
            "grade": grade_data.get("grade"),
            "remark": remark_value,
            "evaluated": evaluated_value,
            "sequence": sequence
        })
    
    # Sort by curriculum year/semester first, then sequence for stable in-sem ordering.
    courses.sort(key=lambda x: (x.get("year") or 999, x.get("semester") or 999, x["sequence"], x["course_id"] or ""))
        
    return courses

def getGWA(courses):
    total_weighted = 0
    total_units = 0

    for course in courses:
        grade = course.get("grade")
        units = course.get("course_units")

        if grade is None or units is None:
            continue

        gwa_equivalent = percentage_to_gwa(float(grade))
        if gwa_equivalent is None:
            continue

        total_weighted += gwa_equivalent * units
        total_units += units

    if total_units == 0:
        return 0.0

    return round(total_weighted / total_units, 4)

def updateGrades(course_id: str, student_id: str, grade: float, remark: str, force_incomplete: bool = False):
    if force_incomplete or str(remark or "").strip().lower() == "incomplete":
        grade = None
        remark = "Incomplete"
    else:
        _validate_percentage_grade(grade)
        remark = getRemark(grade)
    
    # Find the student_course record
    course_result = supabase.table("student_courses")\
        .select("*")\
        .eq("course_id", course_id)\
        .eq("student_id", student_id)\
        .execute()
    
    if not course_result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student/Course not found")
    
    update_payload = {"grade": grade, "remark": remark}

    # Update the record
    result = supabase.table("student_courses")\
        .update(update_payload)\
        .eq("course_id", course_id)\
        .eq("student_id", student_id)\
        .execute()
    
    return result

def updateGradesBulk(student_id: str, grades_list: list):
    for grade_entry in grades_list:
        course_id = grade_entry["course_id"]
        grade = grade_entry["grade"]

        _validate_percentage_grade(grade)
        
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
    return "Passed" if grade >= 75 else "Failed"
