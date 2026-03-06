# Authentication Setup Guide

## Database Structure

### How the Tables Connect:

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE AUTH SYSTEM                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  auth.users (Built-in Supabase table)                │   │
│  │  ├── id (UUID) - Primary Key                         │   │
│  │  ├── email                                            │   │
│  │  ├── encrypted_password                              │   │
│  │  └── raw_user_meta_data (stores custom fields)       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ ON INSERT → Trigger creates profile
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  public.profiles (Your custom profile table)                │
│  ├── id (UUID) → REFERENCES auth.users(id)                  │
│  ├── email                                                   │
│  ├── student_id (e.g., "2021-00001")                        │
│  ├── full_name                                               │
│  ├── role (admin/student/faculty)                           │
│  ├── created_at                                              │
│  └── updated_at                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Optional: Links student record
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  public.students (Student academic records)                 │
│  ├── student_id (PK) - e.g., "2021-00001"                   │
│  ├── user_id (UUID) → REFERENCES profiles(id) [OPTIONAL]    │
│  ├── program_id                                              │
│  ├── f_name, l_name, m_name                                 │
│  ├── year, status, gwa                                       │
│  └── ...                                                     │
└─────────────────────────────────────────────────────────────┘
```

## How It Works

### 1. **User Signup Flow**
```
POST /auth/signup
{
  "student_id": "2021-00001",
  "password": "securepass123"
}
```

**What happens:**
1. Backend auto-generates email: `2021-00001@uphsl.edu.ph`
2. Supabase creates user in `auth.users` with hashed password
3. Database trigger `on_auth_user_created` automatically runs
4. Trigger creates matching record in `profiles` table with:
   - `id` = same UUID from auth.users
   - `student_id` = "2021-00001"
   - `email` = "2021-00001@uphsl.edu.ph"
   - `role` = "student"

### 2. **User Login Flow**
```
POST /auth/login
{
  "student_id": "2021-00001",
  "password": "securepass123"
}
```

**What happens:**
1. Backend converts to email: `2021-00001@uphsl.edu.ph`
2. Supabase validates credentials
3. Returns JWT access token
4. Backend fetches profile from `profiles` table
5. Returns token + profile data

### 3. **Authenticated Requests**
```
GET /auth/me
Authorization: Bearer <token>
```

**What happens:**
1. Backend extracts token from header
2. Validates token with Supabase
3. Gets user UUID from token
4. Fetches profile from `profiles` table using UUID
5. Returns user profile

## Setup Instructions

### Step 1: Run the SQL Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `fix_auth_schema.sql`
4. Click **Run**

This will:
- Remove the old `users` table
- Set up `profiles` table with proper foreign key to `auth.users`
- Create automatic trigger to create profiles on signup
- Set up Row Level Security policies

### Step 2: Disable Email Confirmation

**IMPORTANT**: Since you can't receive emails, you must disable email confirmation:

1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Scroll to **Email Auth**
3. Find **"Enable email confirmations"**
4. **Turn it OFF** (toggle to disabled)
5. Click **Save**

This allows users to login immediately without email verification.

### Step 3: Test the System

**Create a test account:**
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "2021-00001",
    "password": "Test123!"
  }'
```

**Login with the account:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "2021-00001",
    "password": "Test123!"
  }'
```

**Check profile (use token from login response):**
```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer <your_token_here>"
```

## Key Benefits

✅ **No email needed** - Students use student_id instead of email  
✅ **Secure passwords** - Bcrypt hashing via Supabase Auth  
✅ **JWT tokens** - Industry-standard authentication  
✅ **Automatic profile creation** - Database trigger handles it  
✅ **Row Level Security** - Built-in access control  
✅ **Session management** - Handled by Supabase  

## Linking Students to User Accounts

If you want to link a student record to a user account (for students who already exist in the `students` table):

```bash
POST /auth/link-student
{
  "user_id": "uuid-from-auth-users",
  "student_id": "2021-00001"
}
```

This updates the profile's `student_id` field and can also update the `students` table's `user_id` field to link them together.

## Security Notes

🔒 **Passwords**: Never stored as plain text, always bcrypt hashed by Supabase  
🔒 **Tokens**: JWT tokens expire and can be refreshed  
🔒 **RLS Policies**: Users can only see/edit their own profile  
🔒 **Service Role**: Backend uses service_role key to bypass RLS when needed  
🔒 **HTTPS**: All production traffic encrypted via Render/Vercel  

## Troubleshooting

**Error: "Email not confirmed"**
- Go to Supabase → Authentication → Settings
- Disable "Enable email confirmations"

**Error: "User already exists"**
- Student ID already registered
- Use different student_id or check existing accounts

**Error: "Invalid token"**
- Token expired or invalid
- Login again to get new token

**Profile not created on signup**
- Check if trigger `on_auth_user_created` exists
- Re-run the migration SQL script
