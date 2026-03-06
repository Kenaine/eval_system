# Quick Setup Checklist

## ✅ What You Need to Do

### 1. Run the Database Migration (5 minutes)

📂 **File to use:** `fix_auth_schema.sql`

**Steps:**
1. Open Supabase Dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `fix_auth_schema.sql`
5. Paste into the editor
6. Click **Run** (or press Ctrl+Enter)

**What this does:**
- ✅ Removes old disconnected `users` table
- ✅ Sets up `profiles` table with proper connection to Supabase Auth
- ✅ Adds automatic profile creation trigger
- ✅ Sets up security policies

---

### 2. Disable Email Confirmation (2 minutes)

**Why?** Your school blocks emails, so you can't verify via email.

**Steps:**
1. Open Supabase Dashboard
2. Click **Authentication** (left sidebar)
3. Click **Settings** tab
4. Scroll down to **"Email Auth"** section
5. Find **"Enable email confirmations"** toggle
6. **Turn it OFF** (should be grey/disabled)
7. Click **Save** at the bottom

**What this does:**
- ✅ Lets users login immediately after signup
- ✅ No email verification required

---

### 3. Test Your Setup (3 minutes)

**Make sure your backend is running:**
```bash
cd backend
uvicorn api:app --reload
```

**Test Signup:**
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": \"2021-99999\", \"password\": \"TestPass123!\"}"
```

**Test Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": \"2021-99999\", \"password\": \"TestPass123!\"}"
```

**You should see:**
- ✅ Signup returns: `"message": "Account created successfully"`
- ✅ Login returns: `access_token`, `user`, and `profile` data

---

## 🗺️ Database Connection Map

### Before (BROKEN ❌):
```
users table          profiles table
├── user_id         ├── id
├── hashed_pass     ├── email
└── role            └── role

❌ No connection between them!
❌ When auth.users creates a user, profiles has no idea
```

### After (WORKING ✅):
```
auth.users (Supabase)
├── id (UUID)
├── email
└── encrypted_password
        │
        │ FK Reference
        ↓
public.profiles
├── id → REFERENCES auth.users(id)
├── student_id
├── email
└── role
        │
        │ Optional FK
        ↓
public.students
├── student_id (PK)
└── user_id → REFERENCES profiles(id)

✅ On signup: auth.users → trigger → auto-creates profile
✅ On login: validates auth.users → returns profile data
✅ On API calls: validates token → gets profile by user UUID
```

---

## 🧪 Verification

After running the migration, verify in Supabase Dashboard:

### Check Tables:
1. Go to **Table Editor**
2. You should see:
   - ✅ `profiles` table (with columns: id, email, student_id, role, etc.)
   - ❌ NO `users` table (it's been removed)
   - ✅ `students` table (with new `user_id` column)

### Check Trigger:
1. Go to **Database** → **Functions**
2. You should see:
   - ✅ `handle_new_user()` function
3. Go to **Database** → **Triggers**
4. You should see:
   - ✅ `on_auth_user_created` on `auth.users` table

### Check Policies:
1. Go to **Authentication** → **Policies**
2. Under `profiles` table, you should see:
   - ✅ "Users can view their own profile"
   - ✅ "Users can update their own profile"
   - ✅ "Service role can manage all profiles"

---

## 🎯 What Changed in Your Code

### Backend (`auth_routes.py`):
- ✅ Added `POST /auth/login` endpoint
- ✅ Added `POST /auth/signup` endpoint
- ✅ Signup now uses database trigger (no manual profile creation)
- ✅ Login validates with Supabase and returns profile

### Frontend (`login.js`):
- ✅ Now calls backend `POST /auth/login` endpoint
- ✅ Stores access token in sessionStorage
- ✅ Better error handling

### Database:
- ✅ Removed standalone `users` table
- ✅ `profiles` now properly references `auth.users`
- ✅ Automatic profile creation on signup
- ✅ Added `user_id` to `students` table for linking

---

## ⚠️ Common Issues

**"relation 'users' does not exist"**
- ✅ Good! The old `users` table is removed
- If your code references it, update to use `profiles` instead

**"duplicate key value violates unique constraint"**
- Student ID already exists
- Try a different student_id for testing

**"Email not confirmed"**
- You forgot Step 2 above
- Disable email confirmations in Auth Settings

**"Invalid or expired token"**
- Token expired (they last 1 hour by default)
- Login again to get a new token

---

## 🎉 You're Done!

Once you complete steps 1-3 above, your authentication system will be fully functional:

✅ Students can signup with student_id + password  
✅ Students can login and get a secure token  
✅ Backend validates tokens and returns user profiles  
✅ No email verification needed  
✅ Secure password hashing  
✅ Proper database relationships  

Test it in your frontend by going to the login page!
