-- Migration: Optimize user_roles table for faster queries
-- This adds an index on email column to speed up role lookups

-- Create index on email column for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);

-- If user_roles table doesn't have email as unique, consider adding it
-- (Uncomment if needed)
-- ALTER TABLE user_roles ADD CONSTRAINT user_roles_email_unique UNIQUE (email);

-- Add comment
COMMENT ON INDEX idx_user_roles_email IS 'Index to speed up role queries by email';
