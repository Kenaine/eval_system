-- Migration: Add email and dept columns to students table
-- Phase 4 of course_checklist → eval_system migration
-- Run this in the Supabase SQL Editor before deploying the updated backend.

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS email  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS dept   VARCHAR(100);

-- Ensure usernames in user_credentials are unique (risk mitigation from Risk Assessment).
ALTER TABLE user_credentials
    ADD CONSTRAINT IF NOT EXISTS user_credentials_username_unique UNIQUE (username);
