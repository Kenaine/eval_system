-- Migration: Add evaluator column to student_courses table
-- This column tracks which evaluator (admin) updated the grade for a student course
-- Run this in the Supabase SQL Editor before deploying the updated backend.

ALTER TABLE student_courses
    ADD COLUMN IF NOT EXISTS evaluator VARCHAR(255);

-- Add a comment to explain the column purpose
COMMENT ON COLUMN student_courses.evaluator IS 'Full name of the admin/evaluator who last updated the grade for this student course';
