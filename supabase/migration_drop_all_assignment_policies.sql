-- Script để xóa TẤT CẢ policies liên quan đến assignments
-- Chạy script này TRƯỚC khi chạy migration_add_assignments_rls.sql

-- Xóa tất cả policies trên bảng assignments
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'assignments') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON assignments';
    END LOOP;
END $$;

-- Xóa tất cả policies trên bảng assignment_questions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'assignment_questions') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON assignment_questions';
    END LOOP;
END $$;

-- Xóa tất cả policies trên bảng assignment_submissions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'assignment_submissions') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON assignment_submissions';
    END LOOP;
END $$;

-- Xóa tất cả policies trên bảng assignment_answers
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'assignment_answers') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON assignment_answers';
    END LOOP;
END $$;
