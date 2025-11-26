-- Migration: Remove unique constraint on courses.level
-- This allows multiple courses with the same level (e.g., multiple N5 courses)

-- Drop the unique constraint
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_key;

-- Also drop if it exists with different name
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_unique;

-- Note: If you get an error about the constraint not existing, 
-- you can check existing constraints with:
-- SELECT constraint_name FROM information_schema.table_constraints 
-- WHERE table_name = 'courses' AND constraint_type = 'UNIQUE';

