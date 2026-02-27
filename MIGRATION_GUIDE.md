# Eval System — Migration & Deployment Guide

## Overview
This document outlines the complete migration from Firebase Firestore to Supabase for the eval_system project.

### Why Migrate?
The migration from Firebase (NoSQL) to Supabase (PostgreSQL/SQL) was necessary due to several limitations of NoSQL databases:

- **Complex Relationships**: The evaluation system has multiple interconnected entities (students, courses, programs, enrollments) that are better modeled with relational foreign keys
- **Data Integrity**: Relational constraints ensure referential integrity across tables (e.g., student enrollments automatically cascade when courses are deleted)
- **Query Complexity**: SQL provides powerful JOIN operations for complex queries like fetching student courses with full course details
- **Data Redundancy**: NoSQL required denormalizing data (storing course details in every student_course document), leading to update anomalies
- **Transaction Support**: PostgreSQL offers ACID transactions for critical operations like grade updates
- **Analytical Queries**: Better support for aggregations, reporting, and GPA calculations

## ✅ What's Been Migrated

### 1. Database Schema
- Created comprehensive Supabase schema in `supabase/schema.sql`
- Tables created:
  - `users` - Authentication and user roles
  - `programs` - Academic programs (BSCS, BSIT, etc.)
  - `courses` - Course catalog
  - `students` - Student information
  - `program_course` - Program-to-course relationships
  - `student_courses` - Student enrollment and grades

### 2. Backend Code
All Firebase Firestore references have been replaced with Supabase:
- ✅ `db/supabase_client.py` - New Supabase client configuration
- ✅ `functions/auth_func.py` - Authentication functions
- ✅ `functions/user_func.py` - User management
- ✅ `functions/student_func.py` - Student CRUD operations
- ✅ `functions/courses_func.py` - Course management
- ✅ `functions/program_func.py` - Program queries
- ✅ `functions/program_course_func.py` - Program-course relationships
- ✅ `functions/student_course_func.py` - Student enrollment and grading

### 3. Dependencies
- ✅ Updated `requirements.txt` with:
  - `supabase==2.4.0` - Supabase Python client
  - `python-dotenv==1.0.0` - Environment variable management

## 🚀 Next Steps

### Step 1: Set Up Supabase Project

1. **Create a Supabase account** at [https://supabase.com](https://supabase.com)

2. **Create a new project**
   - Choose a project name (e.g., "eval-system")
   - Set a strong database password
   - Choose your region

3. **Run the migration schema**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase/schema.sql`
   - Paste and run the SQL script

4. **Get your credentials**
   - Go to Project Settings > API
   - Copy your Project URL (SUPABASE_URL)
   - Copy your service_role key (SUPABASE_KEY) - **NOT the anon key**

### Step 2: Configure Environment Variables

1. **Create a `.env` file** in the `backend/` directory:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-service-role-key-here
   ```

2. **Add `.env` to `.gitignore`** if not already there:
   ```
   .env
   .env.local
   ```

### Step 3: Migrate Existing Data (Optional)

If you have existing Firebase data you want to migrate:

1. **Export data from Firebase**
   - Use Firebase Console to export collections
   - Or use the Firebase Admin SDK to export programmatically

2. **Transform and import to Supabase**
   - Firestore documents → PostgreSQL rows
   - Document IDs become primary keys
   - Nested objects may need flattening

   Example Python script for migration:
   ```python
   from firebase_admin import credentials, firestore, initialize_app
   from supabase import create_client
   import os

   # Initialize Firebase
   cred = credentials.Certificate("path/to/firebase-credentials.json")
   initialize_app(cred)
   fs = firestore.client()

   # Initialize Supabase
   supabase = create_client(
       os.getenv("SUPABASE_URL"),
       os.getenv("SUPABASE_KEY")
   )

   # Migrate users
   users = fs.collection("users").stream()
   for user in users:
       data = user.to_dict()
       data["login_id"] = user.id
       supabase.table("users").insert(data).execute()

   # Repeat for other collections...
   ```

### Step 4: Install Dependencies and Test

1. **Install Python dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Test the API**:
   ```bash
   uvicorn api:app --reload
   ```

3. **Verify connections**:
   - Test login endpoint
   - Test student retrieval
   - Test course operations

### Step 5: Update Row Level Security (RLS) Policies

The default RLS policies in the schema are basic. You should customize them based on your authentication strategy:

1. **For admin operations**, you may want to:
   - Use Supabase Auth for user authentication
   - Or use your current JWT-based auth with custom claims

2. **Example: Update policies to use JWT claims**:
   ```sql
   -- Allow users with admin role to manage students
   CREATE POLICY "Admins can manage students" ON students
       FOR ALL USING (
           (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
       );
   ```

## 📊 Database Differences

### Key Changes from Firestore (NoSQL) to PostgreSQL (SQL)

| Aspect | Firestore (NoSQL) | Supabase (PostgreSQL) |
|--------|-----------|----------------------|
| Document ID | `doc.id` | Primary key column (`student_id`, `course_id`, etc.) |
| Collections | Dynamic, schema-less | Fixed tables with schemas |
| Queries | `.where()`, `.stream()` | SQL-based: `.select()`, `.eq()`, JOINs |
| Batch Writes | `batch.commit()` | Single queries update multiple rows |
| Timestamps | Server timestamp | `TIMESTAMPTZ` with triggers |
| Nested Data | Supported natively | Requires normalization (better design) |
| Data Duplication | Required for performance | Eliminated via foreign keys |
| Relationships | Manual reference management | Enforced via foreign key constraints |

### NoSQL Limitations Overcome

The previous Firebase implementation suffered from typical NoSQL challenges:

1. **Denormalization**: Every `student_courses` document stored complete course details (name, units, hours, etc.), leading to:
   - Massive data duplication
   - Update anomalies when course info changed
   - Increased storage costs

2. **No Referential Integrity**: Deleting a course didn't automatically clean up related records

3. **Complex Queries**: Joining student data with course details required multiple queries and client-side processing

4. **Consistency Issues**: Updating course information across all students required batch operations that could partially fail

PostgreSQL eliminates all these issues with proper normalization and relational design.

### Benefits of PostgreSQL/Supabase

- ✅ **ACID compliance** - Guaranteed data consistency
- ✅ **Relational data** - Foreign keys and joins eliminate data duplication
- ✅ **Better indexing** - Faster queries on normalized data
- ✅ **Real-time subscriptions** - Built-in (maintained from Firebase)
- ✅ **Direct SQL access** - More control and powerful query capabilities
- ✅ **Cost effective** - Better pricing for growing apps, no egress charges
- ✅ **No denormalization** - Single source of truth for each entity
- ✅ **Data integrity** - Cascading deletes and referential constraints

## 🔧 Testing Checklist

- [ ] Database schema created successfully
- [ ] Environment variables configured
- [ ] All API endpoints working:
  - [ ] POST `/auth/login` - User login
  - [ ] GET `/students/{id}` - Get student details  
  - [ ] POST `/students` - Add student
  - [ ] PUT `/students/{id}` - Update student
  - [ ] DELETE `/students/{id}` - Delete student
  - [ ] GET `/courses` - List courses
  - [ ] POST `/courses` - Add course
  - [ ] GET `/programs` - List programs
  - [ ] GET `/program-course/{program_id}` - Get program courses
  - [ ] POST `/grades` - Update grades
- [ ] Data integrity verified
- [ ] Performance tested

## 🐛 Troubleshooting

### Connection Errors
- Verify SUPABASE_URL and SUPABASE_KEY in `.env`
- Ensure you're using the service_role key, not anon key
- Check network connectivity to Supabase

### Query Errors  
- Check if tables exist: Run `SELECT * FROM students LIMIT 1;` in SQL Editor
- Verify RLS policies aren't blocking queries
- Check column names match schema

### Import Errors
- Verify `supabase` package is installed: `pip list | grep supabase`
- Ensure `python-dotenv` is installed
- Check Python version (3.9+ recommended)

## 📝 Additional Notes

### Changes from Original Implementation

1. **Batch operations**: Firestore's batch writes are replaced with direct SQL updates that can affect multiple rows
2. **Document IDs**: Now stored as regular primary key columns
3. **Timestamp storage**: Using PostgreSQL TIMESTAMPTZ instead of Firestore timestamps
4. **student_func.py**: Added `loadStudents()` function to maintain in-memory filtering (can be optimized with SQL queries later)

### Future Optimizations

1. **Replace in-memory filtering** in `student_func.py` with SQL queries
2. **Add database indexes** for frequently queried fields
3. **Implement connection pooling** for better performance
4. **Add caching** (Redis) for frequently accessed data
5. **Set up Supabase Edge Functions** for complex operations

## 🔐 Security Checklist

- [ ] Never commit `.env` file
- [ ] Use service_role key only in backend (never expose to frontend)
- [ ] Configure RLS policies before going to production
- [ ] Set up Supabase Auth if using client-side access
- [ ] Enable MFA on Supabase dashboard account
- [ ] Regularly rotate service_role keys
- [ ] Set up database backups in Supabase dashboard

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Python Client](https://github.com/supabase-community/supabase-py)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Support

If you encounter issues:
1. Check the Supabase dashboard logs
2. Review the API logs for error messages
3. Verify all environment variables are set correctly
4. Test SQL queries directly in Supabase SQL Editor

---

**Migration completed on**: February 27, 2026  
**Original repository**: Shoccio/course_checklist  
**Forked repository**: Kenaine/eval_system

---

## 🚀 Deployment

### Prerequisites
- GitHub account with the repository pushed
- [Render](https://render.com) account (backend)
- [Vercel](https://vercel.com) account (frontend)
- Supabase project running with schema applied

---

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

---

### Step 2: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Kenaine/eval_system`
4. Configure the service:
   - **Name**: `eval-system-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Under **Advanced → Environment Variables**, add:
   - `SUPABASE_URL` → `https://ifogxhfdcyzumnkqzivf.supabase.co`
   - `SUPABASE_KEY` → *(your service role key)*
   - `PYTHON_VERSION` → `3.13.0`
6. Click **"Create Web Service"**

After deployment you'll get a URL like:  
`https://eval-system-backend.onrender.com`

Test it at: `https://eval-system-backend.onrender.com/docs`

> **Note**: Free tier spins down after 15 min of inactivity. First request after idle takes 30–60 seconds.

---

### Step 3: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New…"** → **"Project"**
3. Import your GitHub repository: `Kenaine/eval_system`
4. Configure the project:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` *(auto-detected)*
   - **Output Directory**: `build` *(auto-detected)*
5. Under **Environment Variables**, add:
   - `REACT_APP_SUPABASE_URL` → `https://ifogxhfdcyzumnkqzivf.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY` → *(your publishable/anon key)*
   - `REACT_APP_API_URL` → *(your Render backend URL, e.g. `https://eval-system-backend.onrender.com`)*
6. Click **"Deploy"**

After deployment you'll get a URL like:  
`https://eval-system-frontend.vercel.app`

---

### Step 4: Update CORS (Backend)

Once you have your Vercel URL, make sure it's in the `origins` list in [backend/api.py](backend/api.py):

```python
origins = [
    "http://localhost:3000",
    "http://localhost:5000",
    "https://*.vercel.app",
    "https://*.onrender.com"
]
```

The wildcard `https://*.vercel.app` already covers all Vercel deployments, so no change is needed unless you use a custom domain.

---

### Environment Variables Summary

| Variable | Where | Value |
|---|---|---|
| `SUPABASE_URL` | Render (backend) | `https://ifogxhfdcyzumnkqzivf.supabase.co` |
| `SUPABASE_KEY` | Render (backend) | Service role key (`sb_secret_...`) |
| `PYTHON_VERSION` | Render (backend) | `3.13.0` |
| `REACT_APP_SUPABASE_URL` | Vercel (frontend) | `https://ifogxhfdcyzumnkqzivf.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | Vercel (frontend) | Publishable key (`sb_publishable_...`) |
| `REACT_APP_API_URL` | Vercel (frontend) | Your Render backend URL |

> ⚠️ **Never commit `.env` files to Git. Use environment variables in the platform dashboards only.**

---

### Deployment Troubleshooting

**Render build fails:**
- Check build logs in Render dashboard
- Verify `runtime.txt` says `python-3.13.0`
- Confirm all packages in `requirements.txt` are compatible

**API returns 401/403:**
- Verify `SUPABASE_KEY` is the **service role** key, not the anon key
- Check RLS policies in Supabase aren't blocking backend requests

**Frontend can't reach backend:**
- Confirm `REACT_APP_API_URL` in Vercel matches your Render URL exactly (no trailing slash)
- Check CORS origins in `api.py` include your Vercel domain

**Vercel build fails:**
- Ensure `Root Directory` is set to `frontend` in Vercel project settings
- Check for any missing `REACT_APP_*` environment variables
