-- Migration: Add RLS Policies for Assignments System
-- This allows teachers/admins to delete assignments they created

-- Enable RLS on assignments tables (if not already enabled)
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Teachers can manage their assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can create assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can update their assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can delete their assignments" ON assignments;
DROP POLICY IF EXISTS "Everyone can view published assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can manage assignment questions" ON assignment_questions;
DROP POLICY IF EXISTS "Everyone can view assignment questions" ON assignment_questions;
DROP POLICY IF EXISTS "Users can view relevant submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Students can create submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Students can update their submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Users can delete relevant submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Users can manage their submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Users can view relevant answers" ON assignment_answers;
DROP POLICY IF EXISTS "Students can manage their answers" ON assignment_answers;
DROP POLICY IF EXISTS "Teachers can update answers for their assignments" ON assignment_answers;
DROP POLICY IF EXISTS "Users can delete relevant answers" ON assignment_answers;
DROP POLICY IF EXISTS "Users can manage their answers" ON assignment_answers;

-- ============================================
-- ASSIGNMENTS TABLE POLICIES
-- ============================================

-- Allow authenticated users to view published assignments
CREATE POLICY "Everyone can view published assignments"
ON assignments
FOR SELECT
TO authenticated
USING (is_published = true OR created_by = auth.uid());

-- Allow teachers/admins to create assignments
CREATE POLICY "Teachers can create assignments"
ON assignments
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow all authenticated users to create

-- Allow teachers/admins to update their own assignments
CREATE POLICY "Teachers can update their assignments"
ON assignments
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Allow teachers/admins to delete their own assignments
-- Also allow if created_by is NULL (for old assignments created before RLS)
CREATE POLICY "Teachers can delete their assignments"
ON assignments
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() OR 
  created_by IS NULL
);

-- ============================================
-- ASSIGNMENT_QUESTIONS TABLE POLICIES
-- ============================================

-- Allow viewing questions for published assignments
CREATE POLICY "Everyone can view assignment questions"
ON assignment_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments 
    WHERE assignments.id = assignment_questions.assignment_id 
    AND (assignments.is_published = true OR assignments.created_by = auth.uid())
  )
);

-- Allow teachers to manage questions for their assignments
CREATE POLICY "Teachers can manage assignment questions"
ON assignment_questions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments 
    WHERE assignments.id = assignment_questions.assignment_id 
    AND assignments.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assignments 
    WHERE assignments.id = assignment_questions.assignment_id 
    AND assignments.created_by = auth.uid()
  )
);

-- ============================================
-- ASSIGNMENT_SUBMISSIONS TABLE POLICIES
-- ============================================

-- Allow students to view their own submissions
-- Allow teachers to view submissions for their assignments
CREATE POLICY "Users can view relevant submissions"
ON assignment_submissions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM assignments 
    WHERE assignments.id = assignment_submissions.assignment_id 
    AND assignments.created_by = auth.uid()
  )
);

-- Allow students to create their own submissions
CREATE POLICY "Students can create submissions"
ON assignment_submissions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow students to update their own submissions
CREATE POLICY "Students can update their submissions"
ON assignment_submissions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow students to delete their own draft submissions
-- Allow teachers to delete submissions for their assignments
CREATE POLICY "Users can delete relevant submissions"
ON assignment_submissions
FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid() AND status = 'draft') OR
  EXISTS (
    SELECT 1 FROM assignments 
    WHERE assignments.id = assignment_submissions.assignment_id 
    AND assignments.created_by = auth.uid()
  )
);

-- ============================================
-- ASSIGNMENT_ANSWERS TABLE POLICIES
-- ============================================

-- Allow viewing answers for own submissions or teacher's assignments
CREATE POLICY "Users can view relevant answers"
ON assignment_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignment_submissions 
    WHERE assignment_submissions.id = assignment_answers.submission_id 
    AND (
      assignment_submissions.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM assignments 
        WHERE assignments.id = assignment_submissions.assignment_id 
        AND assignments.created_by = auth.uid()
      )
    )
  )
);

-- Allow students to create/update answers for their submissions
CREATE POLICY "Students can manage their answers"
ON assignment_answers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignment_submissions 
    WHERE assignment_submissions.id = assignment_answers.submission_id 
    AND assignment_submissions.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assignment_submissions 
    WHERE assignment_submissions.id = assignment_answers.submission_id 
    AND assignment_submissions.user_id = auth.uid()
  )
);

-- Allow teachers to update answers for submissions to their assignments
CREATE POLICY "Teachers can update answers for their assignments"
ON assignment_answers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignment_submissions 
    JOIN assignments ON assignments.id = assignment_submissions.assignment_id
    WHERE assignment_submissions.id = assignment_answers.submission_id 
    AND assignments.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assignment_submissions 
    JOIN assignments ON assignments.id = assignment_submissions.assignment_id
    WHERE assignment_submissions.id = assignment_answers.submission_id 
    AND assignments.created_by = auth.uid()
  )
);

-- Allow deletion of answers (for cleanup when deleting submissions)
CREATE POLICY "Users can delete relevant answers"
ON assignment_answers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignment_submissions 
    WHERE assignment_submissions.id = assignment_answers.submission_id 
    AND (
      assignment_submissions.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM assignments 
        WHERE assignments.id = assignment_submissions.assignment_id 
        AND assignments.created_by = auth.uid()
      )
    )
  )
);

-- Comments
COMMENT ON POLICY "Teachers can delete their assignments" ON assignments IS 
'Allows teachers/admins to delete assignments they created';
COMMENT ON POLICY "Users can delete relevant submissions" ON assignment_submissions IS 
'Allows students to delete draft submissions and teachers to delete submissions for their assignments';
