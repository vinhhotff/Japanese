-- Migration: Enhance Assignments with Media Support
-- This adds support for images, video, audio, and documents in assignments

-- 1. Update assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS attachment_urls TEXT[] DEFAULT '{}';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS rich_content JSONB DEFAULT '{}';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allow_file_upload BOOLEAN DEFAULT FALSE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allowed_file_types TEXT[] DEFAULT '{"image/*", "application/pdf"}';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 10;

-- 2. Update assignment_questions table
ALTER TABLE assignment_questions ADD COLUMN IF NOT EXISTS attachment_urls TEXT[] DEFAULT '{}';
ALTER TABLE assignment_questions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE assignment_questions ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE assignment_questions ADD COLUMN IF NOT EXISTS requires_file_upload BOOLEAN DEFAULT FALSE;
ALTER TABLE assignment_questions ADD COLUMN IF NOT EXISTS allowed_file_types TEXT[] DEFAULT '{}';

-- 3. Update assignment_answers table
ALTER TABLE assignment_answers ADD COLUMN IF NOT EXISTS file_urls TEXT[] DEFAULT '{}';
ALTER TABLE assignment_answers ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE assignment_answers ADD COLUMN IF NOT EXISTS file_metadata JSONB DEFAULT '{}';

-- 4. Create assignment_attachments table for persistent tracking
CREATE TABLE IF NOT EXISTS assignment_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    question_id UUID REFERENCES assignment_questions(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by UUID NOT NULL, -- references auth.users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignment_attachments_assignment_id ON assignment_attachments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_attachments_question_id ON assignment_attachments(question_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id ON assignments(lesson_id);

-- Add comments for documentation
COMMENT ON COLUMN assignments.attachment_urls IS 'List of image/document URLs for the assignment';
COMMENT ON COLUMN assignments.allow_file_upload IS 'Whether students are allowed to upload files as part of their submission';
COMMENT ON COLUMN assignment_answers.file_urls IS 'URLs to files uploaded by the student';
