# Creating Admin and User Accounts

## User Types

Your system now supports three user types:

### 1. **Students** 
- Login with: **student_id** (e.g., "2021-00001")
- Email auto-generated: `student_id@uphsl.edu.ph`
- Have `student_id` in profile
- Role: `student`

### 2. **Admin**
- Login with: **email** (e.g., "admin@uphsl.edu.ph")
- No student_id required
- Role: `admin`

### 3. **Faculty**
- Login with: **email** (e.g., "teacher@uphsl.edu.ph")
- No student_id required
- Role: `faculty`

---

## Creating the First Admin Account

### Option 1: Using the API Endpoint (Simplest)

Start your backend and run:

```bash
curl -X POST http://localhost:8000/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@uphsl.edu.ph",
    "password": "YourSecurePassword123!",
    "full_name": "System Administrator"
  }'
```

**⚠️ IMPORTANT**: After creating your admin, either:
- Remove the `/create-admin` endpoint from production
- Or add authentication check to require existing admin

### Option 2: Using Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter:
   - Email: `admin@uphsl.edu.ph`
   - Password: (your secure password)
   - Confirm email: ✅ (check this box so you can login immediately)
4. Click **Create User**
5. Go to **SQL Editor** and run:

```sql
-- Update the profile to admin role
UPDATE public.profiles 
SET role = 'admin', 
    full_name = 'System Administrator'
WHERE email = 'admin@uphsl.edu.ph';
```

---

## Creating User Accounts

### For Students:

**API Call:**
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "2021-00001",
    "password": "StudentPass123!",
    "role": "student"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "2021-00001",
    "password": "StudentPass123!"
  }'
```

### For Admin:

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@uphsl.edu.ph",
    "password": "YourSecurePassword123!"
  }'
```

### For Faculty:

**API Call (admin creates this):**
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@uphsl.edu.ph",
    "password": "TeacherPass123!",
    "role": "faculty",
    "full_name": "John Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@uphsl.edu.ph",
    "password": "TeacherPass123!"
  }'
```

---

## Database Schema

```
profiles table:
├── id (UUID) → references auth.users
├── email (TEXT) → REQUIRED for all users
├── student_id (TEXT) → OPTIONAL (only for students)
├── full_name (TEXT) → OPTIONAL
├── role (TEXT) → admin | student | faculty
├── created_at
└── updated_at

students table (academic records):
├── student_id (TEXT) → PK (e.g., "2021-00001")
├── auth.users.id (UUID) → FK to profiles (optional link)
├── f_name, l_name, m_name
└── ... (academic data)
```

---

## Frontend Login Form Updates

You'll want to update your frontend to support both login methods:

```javascript
// For students
loginData = {
  student_id: "2021-00001",
  password: "password"
}

// For admin/faculty
loginData = {
  email: "admin@uphsl.edu.ph",
  password: "password"
}
```

Consider adding a toggle or separate login pages for students vs. admin/faculty.

---

## Security Recommendations

1. **Remove `/create-admin` endpoint** after creating your first admin
2. **Use strong passwords** for admin accounts
3. **Consider adding 2FA** for admin accounts (Supabase supports this)
4. **Limit admin creation** - only existing admins should create new admins
5. **Monitor admin activity** through Supabase logs

---

## Testing Your Setup

1. **Create admin:**
   ```bash
   curl -X POST http://localhost:8000/auth/create-admin \
     -d '{"email":"admin@test.com","password":"Test123!","full_name":"Admin"}'
   ```

2. **Login as admin:**
   ```bash
   curl -X POST http://localhost:8000/auth/login \
     -d '{"email":"admin@test.com","password":"Test123!"}'
   ```

3. **Create student:**
   ```bash
   curl -X POST http://localhost:8000/auth/signup \
     -d '{"student_id":"2021-99999","password":"Test123!","role":"student"}'
   ```

4. **Login as student:**
   ```bash
   curl -X POST http://localhost:8000/auth/login \
     -d '{"student_id":"2021-99999","password":"Test123!"}'
   ```

All should return access tokens and profile data!
