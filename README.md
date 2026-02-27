# Evaluation System - Supabase Migration

This is a forked version of the Course Checklist/Evaluation System that has been migrated from Firebase Firestore to Supabase (PostgreSQL).

## 🎯 What Changed

This fork migrates the entire backend database layer from Firebase Firestore (NoSQL) to Supabase (PostgreSQL/SQL) to overcome the limitations of document-based databases for this relational data model.

### Why the Migration?

The original Firebase implementation faced challenges inherent to NoSQL:
- **Data denormalization**: Course details were duplicated across student enrollments and program courses
- **Complex queries**: Fetching related data required multiple round-trips and client-side joins
- **Data integrity**: No foreign key constraints meant orphaned records were possible
- **Scalability**: Updates to course information required batch updates across thousands of documents

PostgreSQL solves these issues with proper relational modeling, foreign keys, and efficient JOIN operations.

**Original Repository**: [Shoccio/course_checklist](https://github.com/Shoccio/course_checklist)  
**Forked Repository**: [Kenaine/eval_system](https://github.com/Kenaine/eval_system)

## 📦 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 14+ (for frontend)
- Supabase account

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone git@github.com:Kenaine/eval_system.git
   cd eval_system
   ```

2. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Get your Project URL and service_role key

3. **Configure environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your Supabase credentials
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the backend**
   ```bash
   uvicorn api:app --reload
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Run the frontend**
   ```bash
   npm start
   ```

## 📚 Documentation

- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Complete migration documentation
- **[supabase/schema.sql](./supabase/schema.sql)** - Database schema

## 🔄 Migration Summary

### Database Changes
- ✅ Firebase Firestore → Supabase (PostgreSQL)
- ✅ NoSQL collections → Relational tables
- ✅ Row Level Security (RLS) enabled
- ✅ Foreign keys and indexes added
- ✅ Automatic timestamp triggers

### Code Changes
- ✅ All backend functions migrated to Supabase client
- ✅ Authentication system updated
- ✅ Student, Course, and Program management migrated
- ✅ Grading system updated
- ✅ Dependencies updated

## 🗂️ Database Structure

```
users
├── user_id (PK)
├── hashed_pass
└── role

programs
├── program_id (PK)
├── program_name
└── program_specialization

courses
├── course_id (PK)
├── course_name
├── course_hours
├── course_preq
├── course_sem
├── hours_lab
├── hours_lec
├── units_lab
└── units_lec

students
├── student_id (PK)
├── program_id (FK → programs)
├── f_name, l_name, m_name
├── year
├── status
├── archived
├── evaluated
├── gwa
└── is_transferee

program_course
├── program_id (FK → programs)
├── course_id (FK → courses)
└── sequence
└── PRIMARY KEY(program_id, course_id)

student_courses
├── student_id (FK → students)
├── course_id (FK → courses)
├── grade
└── remark
└── PRIMARY KEY(student_id, course_id)
```

## 🚀 Features

- Student management (CRUD operations)
- Course catalog management
- Program and curriculum management
- Student enrollment management
- Grade recording and GPA calculation
- Student evaluation tracking
- Role-based authentication (admin/student)

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Service role key required for backend operations
- JWT-based authentication
- Password hashing with bcrypt
- Environment variables for sensitive data

## 🛠️ Technologies

### Backend
- FastAPI (Python web framework)
- Supabase (PostgreSQL database)
- Pydantic (data validation)
- PassLib (password hashing)
- Python-JOSE (JWT handling)

### Frontend
- React
- React Router
- Axios
- React Icons
- Recharts (for data visualization)

## 📝 API Endpoints

### Authentication
- `POST /auth/login` - User login

### Students
- `GET /students` - List all students
- `GET /students/{id}` - Get student details
- `POST /students` - Add new student
- `PUT /students/{id}` - Update student
- `DELETE /students/{id}` - Delete student

### Courses
- `GET /courses` - List all courses
- `POST /courses` - Add new course
- `PUT /courses/{id}` - Update course
- `DELETE /courses/{id}` - Delete course

### Programs
- `GET /programs` - List all programs

### Grades
- `POST /grades` - Update student grades
- `PUT /grades/bulk` - Bulk update grades

## 🤝 Contributing

If you'd like to contribute:
1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project maintains the same license as the original repository.

## 🙏 Acknowledgments

- Original project by [Shoccio](https://github.com/Shoccio)
- Migrated to Supabase by Kenaine

## 📧 Support

For migration-specific questions, refer to [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

**Note**: This is a database migration fork. All original features and functionality have been preserved while upgrading to a more scalable PostgreSQL-based infrastructure.
