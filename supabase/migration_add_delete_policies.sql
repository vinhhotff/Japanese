-- Migration: Add RLS Delete Policies for Classes and Homework
-- Run this in Supabase SQL Editor to fix delete permission issues

-- ============================================
-- CLASSES TABLE POLICIES
-- ============================================

-- Enable RLS on classes table (if not already enabled)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Teachers can view their classes" ON classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update their classes" ON classes;
DROP POLICY IF EXISTS "Teachers can delete their classes" ON classes;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON classes;
DROP POLICY IF EXISTS "Everyone can view classes" ON classes;

-- Allow everyone to view classes
CREATE POLICY "Everyone can view classes"
ON classes
FOR SELECT
TO authenticated
USING (true);

-- Allow teachers to create classes
CREATE POLICY "Teachers can create classes"
ON classes
FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid());

-- Allow teachers to update their own classes
CREATE POLICY "Teachers can update their classes"
ON classes
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Allow teachers to delete their own classes
CREATE POLICY "Teachers can delete their classes"
ON classes
FOR DELETE
TO authenticated
USING (teacher_id = auth.uid());

-- ============================================
-- HOMEWORK TABLE POLICIES
-- ============================================

-- Enable RLS on homework table (if not already enabled)
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Teachers can view their homework" ON homework;
DROP POLICY IF EXISTS "Teachers can create homework" ON homework;
DROP POLICY IF EXISTS "Teachers can update their homework" ON homework;
DROP POLICY IF EXISTS "Teachers can delete their homework" ON homework;
DROP POLICY IF EXISTS "Students can view homework" ON homework;
DROP POLICY IF EXISTS "Everyone can view homework" ON homework;

-- Allow everyone to view homework
CREATE POLICY "Everyone can view homework"
ON homework
FOR SELECT
TO authenticated
USING (true);

-- Allow teachers to create homework
CREATE POLICY "Teachers can create homework"
ON homework
FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid());

-- Allow teachers to update their own homework
CREATE POLICY "Teachers can update their homework"
ON homework
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Allow teachers to delete their own homework
CREATE POLICY "Teachers can delete their homework"
ON homework
FOR DELETE
TO authenticated
USING (teacher_id = auth.uid());

-- ============================================
-- HOMEWORK_SUBMISSIONS TABLE POLICIES
-- ============================================

-- Enable RLS on homework_submissions table (if not already enabled)
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Students can view their submissions" ON homework_submissions;
DROP POLICY IF EXISTS "Students can create submissions" ON homework_submissions;
DROP POLICY IF EXISTS "Students can update their submissions" ON homework_submissions;
DROP POLICY IF EXISTS "Teachers can view all submissions" ON homework_submissions;
DROP POLICY IF EXISTS "Teachers can delete submissions" ON homework_submissions;

-- Allow students to view their own submissions
CREATE POLICY "Students can view their submissions"
ON homework_submissions
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Allow teachers to view submissions for their homework
CREATE POLICY "Teachers can view all submissions"
ON homework_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM homework 
    WHERE homework.id = homework_submissions.homework_id 
    AND homework.teacher_id = auth.uid()
  )
);

-- Allow students to create submissions
CREATE POLICY "Students can create submissions"
ON homework_submissions
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- Allow students to update their own submissions
CREATE POLICY "Students can update their submissions"
ON homework_submissions
FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Allow teachers to delete submissions for their homework (for cleanup)
CREATE POLICY "Teachers can delete submissions"
ON homework_submissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM homework 
    WHERE homework.id = homework_submissions.homework_id 
    AND homework.teacher_id = auth.uid()
  )
);

-- ============================================
-- ENROLLMENTS TABLE POLICIES (for class deletion cleanup)
-- ============================================

-- Enable RLS on enrollments table (if not already enabled)
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Students can view their enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers can view class enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers can delete enrollments" ON enrollments;
DROP POLICY IF EXISTS "Students can enroll" ON enrollments;
DROP POLICY IF EXISTS "Students can leave" ON enrollments;

-- Allow students to view their own enrollments
CREATE POLICY "Students can view their enrollments"
ON enrollments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow teachers to view enrollments for their classes
CREATE POLICY "Teachers can view class enrollments"
ON enrollments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = enrollments.class_id 
    AND classes.teacher_id = auth.uid()
  )
);

-- Allow students to enroll themselves
CREATE POLICY "Students can enroll"
ON enrollments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow students to leave (unenroll themselves)
CREATE POLICY "Students can leave"
ON enrollments
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Allow teachers to remove students from their classes
CREATE POLICY "Teachers can delete enrollments"
ON enrollments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = enrollments.class_id 
    AND classes.teacher_id = auth.uid()
  )
);

-- ============================================
-- Comments/Documentation
-- ============================================
COMMENT ON POLICY "Teachers can delete their classes" ON classes IS 
'Allows teachers to delete classes they created (teacher_id matches)';

COMMENT ON POLICY "Teachers can delete their homework" ON homework IS 
'Allows teachers to delete homework they created';

COMMENT ON POLICY "Teachers can delete submissions" ON homework_submissions IS 
'Allows teachers to delete submissions for cleanup when deleting homework';

COMMENT ON POLICY "Teachers can delete enrollments" ON enrollments IS 
'Allows teachers to remove students from their classes or cleanup when deleting class';
