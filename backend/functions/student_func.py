from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from functions.student_course_func import getStudentCourses, getGWA, deleteCourses as DS
from schema.student_schema import Student
from schema.user_schema import User
from db.supabase_client import supabase
import json

students_list = []

def loadStudents():
    """Load all students into memory for filtering"""
    global students_list
    result = supabase.table("students").select("*").execute()
    students_list = result.data

# Load students on module import
loadStudents()

active_filter = {
    "status": {"value": "", "active": False}, 
    "is_transferee": {"value": "", "active": False},
    "program_id": ["BSCS", "BSIT", "BSEMC", "BITCF"],
    "year": [1, 2, 3, 4]}

search_filter = {
    "year": [1, 2, 3, 4],
    "status": ["Regular", "Irregular"], 
    "is_transferee": [True, False],
    "program_id": ["BSCS", "BSIT", "BSEMC", "BITCF"],
    "archived": [False]}

def addStudent(student: Student):
    student_info = student.model_dump(exclude={"curriculum"}, exclude_none=True)
    
    # Check if student_id already exists
    existing_student = supabase.table("students").select("*").eq("student_id", student.student_id).execute()
    if existing_student.data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Student with ID '{student.student_id}' already exists")
    
    # Check if email already exists (if provided)
    if student.email:
        existing_email = supabase.table("students").select("*").eq("email", student.email).execute()
        if existing_email.data:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Student with email '{student.email}' already exists")
    
    result = supabase.table("students").insert(student_info).execute()
    
    # Reload students list
    loadStudents()
    
    return result

def editStudent(student: Student):
    student_info = student.model_dump(exclude={"curriculum"}, exclude_none=True)
    student_id = student_info["student_id"]
    
    # Check if student exists
    existing_student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    if not existing_student.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Student with ID '{student_id}' not found")
    
    # Check if email already exists in another student record (if provided)
    if student.email:
        existing_email = supabase.table("students").select("*").eq("email", student.email).execute()
        if existing_email.data and existing_email.data[0]["student_id"] != student_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Student with email '{student.email}' already exists")
    
    result = supabase.table("students").update(student_info).eq("student_id", student_id).execute()
    
    # Reload students list
    loadStudents()
    
    return result

def deleteStudent(student_id: str):
    # Check if student exists
    student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    
    if not student.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    result = supabase.table("students").delete().eq("student_id", student_id).execute()
    result = supabase.table("user_credentials").delete().eq("student_id", student_id).execute()
    result = supabase.table("student_courses").delete().eq("student_id", student_id).execute()
    
    # Reload students list
    loadStudents()
    
    return result

def getStudent(student_id: str = None):
    if not student_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Admin must specify a student ID.")
    
    try:
        result = supabase.table("students").select("*").eq("student_id", student_id).execute()
        
        if not result.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
        
        student_data = result.data[0]

        # Check if student has any courses in student_courses
        check_courses = supabase.table("student_courses")\
            .select("course_id")\
            .eq("student_id", student_id)\
            .limit(1)\
            .execute()
        
        # Only auto-populate courses for regular students (not irregular, not transferee)
        is_regular = student_data.get("status", "").upper() == "REGULAR"
        is_transferee = student_data.get("is_transferee", False)
        
        if not check_courses.data and is_regular and not is_transferee:
            from functions.student_course_func import addEntry
            addEntry(student_id, student_data["program_id"])
        
        courses = getStudentCourses(student_id, student_data["program_id"], student_data.get("curriculum_id"))

        total_units = sum(course["course_units"] for course in courses)
        units_taken = sum(course["course_units"] for course in courses if course["remark"] == "Passed")
        gwa = getGWA(courses)

        student_data["gwa"] = gwa
        student_data["units_taken"] = units_taken
        student_data["total_units_required"] = total_units
        student_data["role"] = "student"
        middle_name = student_data.get("m_name") or ""
        student_data["full_name"] = f"{student_data['l_name']}, {student_data['f_name']} {middle_name}".strip()

        specialization_result = supabase.table("programs") \
                         .select("program_specialization") \
                         .eq("program_id", student_data["program_id"]) \
                         .execute()
        
        program_specialization = ""
        if specialization_result.data:
            program_specialization = specialization_result.data[0].get("program_specialization") or ""

        student_data["prgm_spec"] = (
            f"{student_data['program_id']} - {program_specialization}"
            if program_specialization
            else student_data["program_id"]
        )
        
        # Update GWA in database
        supabase.table("students").update({"gwa": gwa}).eq("student_id", student_id).execute()
        
        # Convert evaluated timestamp to string if it exists
        if "evaluated" in student_data and student_data["evaluated"] is not None:
            if hasattr(student_data["evaluated"], "isoformat"):
                student_data["evaluated"] = student_data["evaluated"].isoformat()
            else:
                student_data["evaluated"] = str(student_data["evaluated"])

        return JSONResponse(content={"student": student_data, "courses": courses})
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in getStudent for {student_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error fetching student: {str(e)}")

def search_students(query: str, apply_filters: bool = False, admin_dept: str = None):
    """
    Search students by name or student_id in the students table.
    When apply_filters is True, applies the active search filters.
    When query is empty and apply_filters is True, returns all students that match the active filters.
    When admin_dept is provided, only returns students from that department.
    """
    query_lower = query.lower().strip() if query else ""
    results = []

    # Start building the query with base selection
    query_builder = supabase.table("students") \
        .select("student_id, f_name, l_name, m_name, evaluated, status, is_transferee, program_id, year, dept")
    
    # Filter by admin's department if provided
    if admin_dept:
        query_builder = query_builder.eq("dept", admin_dept)
    
    # Only apply search filters if apply_filters is True
    if apply_filters:
        if search_filter.get("status"):
            # Filter by status values in search_filter
            query_builder = query_builder.in_("status", search_filter["status"])
        
        if search_filter.get("is_transferee") is not None:
            # Filter by is_transferee values in search_filter
            query_builder = query_builder.in_("is_transferee", search_filter["is_transferee"])
        
        if search_filter.get("program_id"):
            # Filter by program_id values in search_filter
            query_builder = query_builder.in_("program_id", search_filter["program_id"])
        
        if search_filter.get("year"):
            # Filter by year values in search_filter
            query_builder = query_builder.in_("year", search_filter["year"])

        if search_filter.get("archived"):
            query_builder = query_builder.in_("archived", search_filter["archived"])
    
    db_result = query_builder.limit(1000).execute()

    for s in db_result.data:
        full_name = " ".join(
            filter(None, [s.get("l_name"), s.get("f_name"), s.get("m_name")])
        ).lower()
        # If query is empty, include all students; otherwise filter by query
        if not query_lower or query_lower in full_name or query_lower in s["student_id"].lower():
            results.append({
                "student_id": s["student_id"],
                "name": f"{s['l_name']}, {s['f_name']} {s.get('m_name', '') or ''}".strip(),
                "evaluated": str(s.get("evaluated", "")),
                "dept": s.get("dept", "")
            })
            if len(results) >= 30:
                break

    return results

def get_students():
    students_list.sort(key= lambda x: (x["status"] != "Regular", -x["gwa"]))
    return students_list

def edit_filter(key: str, value: str):
    if key == "is_transferee" or key == "archived":
        value = str_to_bool(value)
    elif key == "year":
        value = int(value)

    if value in search_filter[key]:
        search_filter[key].remove(value)
    else:
        search_filter[key].append(value)
    
    return search_filter


def str_to_bool(value: str):
    if value == "true":
        return True
    elif value == "false":
        return False
    
    return value

def apply_filter():
    pool = students_list

    for key, value in search_filter.items():
        print(key)

        pool = [students for students in pool
                if students[key] in search_filter[key]]
        
    return pool

def reset_searchFilter():
    global search_filter 
    search_filter = {
    "year": [1, 2, 3, 4],
    "status": ["Regular", "Irregular"], 
    "is_transferee": [True, False],
    "program_id": ["BSCS", "BSIT", "BSEMC", "BITCF"]}
    return search_filter

def archiveStudent(student_id: str):
    # Check if student exists
    student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    
    if not student.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    result = supabase.table("students").update({"archived": True}).eq("student_id", student_id).execute()
    
    # Reload students list
    loadStudents()
    
    return JSONResponse(content={"message": "Student archived successfully"})

def unarchiveStudent(student_id: str):
    # Check if student exists
    student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    
    if not student.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    result = supabase.table("students").update({"archived": False}).eq("student_id", student_id).execute()
    
    # Reload students list
    loadStudents()
    
    return JSONResponse(content={"message": "Student unarchived successfully"})
    

#------------------------------------------------FOR DASHBOARD--------------------------------------------------------

def filter_students(key: str, value: str):
    if key == "program_id":
        if value in active_filter[key]:
            active_filter[key].remove(value)
        else:
            active_filter[key].append(value)

        return {"filtered": execute_filter(), "filters": active_filter}

    if key == "year":
        num = int(value)

        if num in active_filter[key]:
            active_filter[key].remove(num)
        else:
            active_filter[key].append(num)

        return {"filtered": execute_filter(), "filters": active_filter}
            
    if key == "is_transferee":
        value = str_to_bool(value)

    if active_filter[key]["value"] == value:
        active_filter[key]["value"] = ""
        active_filter[key]["active"] = False
    else:
        active_filter[key]["value"] = value
        active_filter[key]["active"] = True

    return {"filtered": execute_filter(), "filters": active_filter}

def execute_filter():
    pool = students_list

    for key, value in active_filter.items():
        if key == "program_id" or key == "year":
            pool = [students for students in pool
                    if students[key] in active_filter[key]]
            continue

        if value["active"] != True:
            continue

        pool = [students for students in pool
                if students[key] == value["value"]]
        
    return pool

def reset_filter():
    global active_filter 
    active_filter = {
    "status": {"value": "", "active": False}, 
    "is_transferee": {"value": "", "active": False},
    "program_id": ["BSCS", "BSIT", "BSEMC", "BITCF"],
    "year": [1, 2, 3, 4]}
    return active_filter

#------------------------------------------------FOR EVALUATION--------------------------------------------------------

def evaluateStudent(student_id: str):
    from datetime import datetime, timezone
    
    # Check if student exists
    student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    
    if not student.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    current_timestamp = str(datetime.now(timezone.utc).date())
    result = supabase.table("students").update({"evaluated": current_timestamp}).eq("student_id", student_id).execute()
    
    # Reload students list
    loadStudents()
    
    return JSONResponse(content={"message": "Student evaluated successfully", "timestamp": str(current_timestamp)})

def takeOffEvaluation(student_id: str):
    # Check if student exists
    student = supabase.table("students").select("*").eq("student_id", student_id).execute()
    
    if not student.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    
    result = supabase.table("students").update({"evaluated": None}).eq("student_id", student_id).execute()
    
    # Reload students list
    loadStudents()
    
    return JSONResponse(content={"message": "Evaluation removed successfully"})

def exportAllStudents():
    students = supabase.table("student_courses") \
        .select("student_id, course_id, grade, remark, retakes, evaluator") \
        .execute()

    return students.data

def importAllStudents(data):
    updated_count = 0
    inserted_count = 0
    updated_records = []
    inserted_records = []

    # Process each record: update if exists, insert if new
    for record in data:
        student_id = record.get("student_id")
        course_id = record.get("course_id")
        
        # Check if record exists
        existing = supabase.table("student_courses") \
            .select("*") \
            .eq("student_id", student_id) \
            .eq("course_id", course_id) \
            .execute()
        
        if existing.data:
            # Update existing record
            response = supabase.table("student_courses") \
                .update(record) \
                .eq("student_id", student_id) \
                .eq("course_id", course_id) \
                .execute()
            updated_count += 1
            if response.data:
                updated_records.extend(response.data)
        else:
            # Insert new record
            response = supabase.table("student_courses") \
                .insert(record) \
                .execute()
            inserted_count += 1
            if response.data:
                inserted_records.extend(response.data)

    return {
        "message": "Students imported successfully",
        "updated": updated_count,
        "inserted": inserted_count,
        "total": len(data),
        "updated_data": updated_records,
        "inserted_data": inserted_records
    }

def FixCourses():
    """Fix courses by populating student_courses for all students based on their program and curriculum"""
    
    # Students that got skipped - get only these students
    missing = ["25-0080-680", "25-2793-942", "1-241-02682",
                "1-241-02116", "25-3108-889", "23-1930-480"]
    
    # Get only the students from the missing list
    students = supabase.table("students").select("*").in_("student_id", missing).execute()
    
    if not students.data:
        return {"message": "No students found in missing list"}
    
    total_students = len(students.data)
    processed_students = 0
    inserted_courses = 0
    skipped_students = []
    
    print(f"\n{'='*60}")
    print(f"Starting FixCourses - Processing {total_students} students")
    print(f"{'='*60}\n")
    
    for index, student in enumerate(students.data, 1):
        student_id = student["student_id"]
        program_id = student["program_id"]
        curriculum_id = student.get("curriculum_id")
        
        # Skip if no curriculum_id
        if not curriculum_id:
            skipped_students.append({"student_id": student_id, "reason": "No curriculum_id"})
            print(f"[{index}/{total_students}] ⊘ Skipped {student_id} - No curriculum_id")
            continue
        
        try:
            # Get all courses for this curriculum
            curriculum_courses = supabase.table("curriculum_course") \
                .select("course_id") \
                .eq("curriculum_id", curriculum_id) \
                .execute()
            
            if not curriculum_courses.data:
                skipped_students.append({"student_id": student_id, "reason": "No courses found for curriculum"})
                print(f"[{index}/{total_students}] ⊘ Skipped {student_id} - No courses found for curriculum")
                continue
            
            courses_inserted_for_student = 0
            # For each course, check if student_course entry exists, if not insert
            for course in curriculum_courses.data:
                course_id = course["course_id"]
                
                # Check if entry already exists
                existing = supabase.table("student_courses") \
                    .select("*") \
                    .eq("student_id", student_id) \
                    .eq("course_id", course_id) \
                    .execute()
                
                if not existing.data:
                    # Insert new record
                    supabase.table("student_courses") \
                        .insert({
                            "student_id": student_id,
                            "course_id": course_id
                        }) \
                        .execute()
                    inserted_courses += 1
                    courses_inserted_for_student += 1
            
            processed_students += 1
            print(f"[{index}/{total_students}] ✓ Processed {student_id} - Inserted {courses_inserted_for_student} courses")
        
        except Exception as e:
            print(f"[{index}/{total_students}] ✗ Error processing student {student_id}: {str(e)}")
            skipped_students.append({"student_id": student_id, "reason": str(e)})
    
    print(f"\n{'='*60}")
    print(f"FixCourses Completed!")
    print(f"  Processed: {processed_students}/{total_students} students")
    print(f"  Inserted: {inserted_courses} total courses")
    print(f"  Skipped: {len(skipped_students)} students")
    print(f"{'='*60}\n")
    
    return {
        "message": "Courses fixed successfully",
        "processed_students": processed_students,
        "inserted_courses": inserted_courses,
        "total_students": len(students.data),
        "skipped": skipped_students
    }