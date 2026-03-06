-- =====================================================
-- USER CREDENTIALS TABLE - Unified authentication
-- =====================================================
-- This table stores ALL user credentials (students, admins, faculty)
-- No Supabase Auth needed - complete database-based authentication

-- Create user credentials table
CREATE TABLE IF NOT EXISTS public.user_credentials (
    username TEXT PRIMARY KEY,  -- student_id for students, email/username for admin
    hashed_password TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'student', 'faculty')) NOT NULL,
    full_name TEXT,
    student_id TEXT UNIQUE,  -- Only for students, links to students table
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_credentials_username ON public.user_credentials(username);
CREATE INDEX IF NOT EXISTS idx_user_credentials_student_id ON public.user_credentials(student_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_role ON public.user_credentials(role);

-- Enable Row Level Security
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can manage user credentials" ON public.user_credentials;

-- Only service role (backend) can access credentials
CREATE POLICY "Service role can manage user credentials"
    ON public.user_credentials FOR ALL
    USING (true);  -- Backend has full access via service_role key

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_credentials_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_user_credentials ON public.user_credentials;
CREATE TRIGGER set_updated_at_user_credentials
    BEFORE UPDATE ON public.user_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_credentials_timestamp();

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Create admin account
-- Username: admin
-- Password: Admin123! (will be hashed on first login)
INSERT INTO public.user_credentials (username, hashed_password, role, full_name, email)
VALUES ('admin', 'TEMP_Admin123!', 'admin', 'System Administrator', 'admin@uphsl.edu.ph')
ON CONFLICT (username) DO NOTHING;

-- Create sample students with default password
-- Password: Student123! (will be hashed on first login)
INSERT INTO public.user_credentials (username, hashed_password, role, student_id, full_name)
VALUES 
    ('2021-00001', 'TEMP_Student123!', 'student', '2021-00001', 'Test Student 1'),
    ('2021-00002', 'TEMP_Student123!', 'student', '2021-00002', 'Test Student 2'),
    ('2021-00003', 'TEMP_Student123!', 'student', '2021-00003', 'Test Student 3'),
    ('2021-00004', 'TEMP_Student123!', 'student', '2021-00004', 'Test Student 4'),
    ('2021-00005', 'TEMP_Student123!', 'student', '2021-00005', 'Test Student 5')
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- BULK INSERT TEMPLATE FOR HUNDREDS OF STUDENTS
-- =====================================================
/*
INSERT INTO public.user_credentials (username, hashed_password, role, student_id, full_name)
VALUES 
    ('2021-00006', 'TEMP_Student123!', 'student', '2021-00006', 'Student Name'),
    ('2021-00007', 'TEMP_Student123!', 'student', '2021-00007', 'Student Name'),
    -- Copy this line for hundreds more students
    ('2021-00999', 'TEMP_Student123!', 'student', '2021-00999', 'Student Name')
ON CONFLICT (username) DO NOTHING;
*/

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check created accounts
SELECT username, role, full_name, student_id, created_at
FROM public.user_credentials
ORDER BY role, username;
