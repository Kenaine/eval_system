from schema.student_schema import Student
from functions.student_func import addStudent
from functions.student_course_func import addEntry
from db.supabase_client import supabase


def addStudentHelper(student: Student):
    if student.curriculum and not student.curriculum_id:
        curriculum_result = supabase.table("curriculum") \
            .select("id") \
            .eq("program_id", student.program_id) \
            .eq("name", student.curriculum) \
            .limit(1) \
            .execute()

        if curriculum_result.data:
            student.curriculum_id = curriculum_result.data[0]["id"]

    # Add student record
    addStudent(student)

    # Auto-create user credentials (ported from course_checklist addUser).
    # Check if credentials already exist to avoid duplicate key errors
    existing_creds = supabase.table("user_credentials").select("username").eq("username", student.student_id).execute()
    
    if not existing_creds.data:
        # Username = student_id. Password stored as TEMP_<student_id> so it gets
        # bcrypt-hashed automatically on the student's first login.
        supabase.table("user_credentials").insert({
            "username":       student.student_id,
            "hashed_password": "TEMP_#Uphsl123",
            "role":           "student",
            "student_id":     student.student_id,
            "full_name":      f"{student.f_name} {student.l_name}"
        }).execute()

    # Add their courses
    addEntry(student.student_id, student.program_id, student.curriculum, student.curriculum_id)


def bulkAddStudents(rows: list[dict]) -> dict:
    """
    Insert multiple students from parsed CSV rows.
    Returns { inserted: int, failed: int, errors: [{row, reason}] }
    """
    inserted = 0
    failed = 0
    errors = []

    for i, row in enumerate(rows, start=2):  # start=2: row 1 is the header
        try:
            required_fields = [
                "student_id", "email", "dept", "program_id", "curriculum",
                "f_name", "l_name", "year", "status", "gender"
            ]

            for field in required_fields:
                if not row.get(field, "").strip():
                    raise ValueError(f"Missing required value for '{field}'")

            student = Student(
                student_id   = row["student_id"].strip(),
                f_name       = row["f_name"].strip(),
                m_name       = row.get("m_name", "").strip() or None,
                l_name       = row["l_name"].strip(),
                program_id   = row["program_id"].strip(),
                curriculum   = row["curriculum"].strip(),
                year         = int(row["year"]),
                status       = row["status"].strip(),
                is_transferee= row.get("is_transferee", "false").strip().lower() == "true",
                dept         = row["dept"].strip(),
                email        = row["email"].strip(),
                gwa          = float(row["gwa"]) if row.get("gwa", "").strip() else None,
                evaluated    = int(row["evaluated"]) if row.get("evaluated", "").strip() else None,
                archived     = row.get("archived", "false").strip().lower() == "true",
                gender       = row["gender"].strip(),
            )
            addStudentHelper(student)
            inserted += 1
        except Exception as e:
            failed += 1
            errors.append({"row": i, "student_id": row.get("student_id", ""), "reason": str(e)})

    return {"inserted": inserted, "failed": failed, "errors": errors}

