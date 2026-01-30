-- Migration: Add missing columns to assignments table
-- This ensures the schema matches the fields sent by the AssignmentForm component

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'exercise';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'N5';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 50;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allowed_attempts INTEGER DEFAULT 1;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;

-- Optional: Add comments
COMMENT ON COLUMN assignments.category IS 'Category of the assignment (exercise, quiz, exam, homework)';
COMMENT ON COLUMN assignments.passing_score IS 'Minimum score required to pass';
COMMENT ON COLUMN assignments.allowed_attempts IS 'Number of times a student can attempt the assignment';
COMMENT ON COLUMN assignments.duration_minutes IS 'Time limit for the assignment in minutes (0 means unlimited)';
