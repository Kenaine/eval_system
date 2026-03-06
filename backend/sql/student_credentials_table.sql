-- =====================================================
-- STUDENT CREDENTIALS TABLE
-- For bulk importing student login credentials
-- =====================================================

-- Create table for student credentials (separate from Supabase Auth)
CREATE TABLE IF NOT EXISTS public.student_credentials (
    student_id TEXT PRIMARY KEY,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_credentials_student_id ON public.student_credentials(student_id);

-- Enable RLS
ALTER TABLE public.student_credentials ENABLE ROW LEVEL SECURITY;

-- Only service role (backend) can access credentials
CREATE POLICY "Service role can manage student credentials"
    ON public.student_credentials FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- BULK INSERT EXAMPLE - Students with default password
-- =====================================================
-- Default password: "Student123!" for all students
-- On first login, it will be automatically hashed

INSERT INTO public.student_credentials (student_id, hashed_password)
VALUES 
    ('2021-00001', 'TEMP_Student123!'),
    ('2021-00002', 'TEMP_Student123!'),
    ('2021-00003', 'TEMP_Student123!'),
    ('2021-00004', 'TEMP_Student123!'),
    ('2021-00005', 'TEMP_Student123!'),
    ('2021-00006', 'TEMP_Student123!'),
    ('2021-00007', 'TEMP_Student123!'),
    ('2021-00008', 'TEMP_Student123!'),
    ('2021-00009', 'TEMP_Student123!'),
    ('2021-00010', 'TEMP_Student123!')
    -- Add hundreds more here by copying the line above...
ON CONFLICT (student_id) DO NOTHING;

-- =====================================================
-- Or import from CSV
-- =====================================================
/*
COPY public.student_credentials(student_id, hashed_password)
FROM '/path/to/students.csv'
DELIMITER ','
CSV HEADER;
*/
