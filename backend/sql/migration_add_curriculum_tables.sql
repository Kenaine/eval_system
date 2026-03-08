-- Migration: Add curriculum and curriculum_course tables
-- Purpose: Support versioned curricula per program (e.g., "2023-2024 BSCS", "2024-2025 BSCS")
-- Date: March 8, 2026

-- Curriculum versions per program
CREATE TABLE IF NOT EXISTS curriculum (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    program_id   TEXT NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, program_id)
);

-- Courses assigned to a curriculum
CREATE TABLE IF NOT EXISTS curriculum_course (
    id            SERIAL PRIMARY KEY,
    curriculum_id INT NOT NULL REFERENCES curriculum(id) ON DELETE CASCADE,
    course_id     TEXT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    course_year   INT NOT NULL,
    course_sem    INT NOT NULL,
    sequence      INT DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(curriculum_id, course_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_curriculum_program ON curriculum(program_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_course_curriculum ON curriculum_course(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_course_course ON curriculum_course(course_id);

-- Comments for documentation
COMMENT ON TABLE curriculum IS 'Stores curriculum versions per program (e.g., 2023-2024, 2024-2025)';
COMMENT ON TABLE curriculum_course IS 'Links courses to a specific curriculum with year/semester/sequence';
COMMENT ON COLUMN curriculum.name IS 'Curriculum version name (e.g., "2023-2024", "2024-2025")';
COMMENT ON COLUMN curriculum_course.course_year IS 'Year level (1-4) for this course in this curriculum';
COMMENT ON COLUMN curriculum_course.course_sem IS 'Semester (1-2) for this course in this curriculum';
COMMENT ON COLUMN curriculum_course.sequence IS 'Display order within year/semester';
