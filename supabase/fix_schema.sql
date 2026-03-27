-- Fix schema issues: Add missing columns to match the SQL insert statements

-- 1. Add jlpt_level column to kanji table (if not exists)
ALTER TABLE public.kanji 
ADD COLUMN IF NOT EXISTS jlpt_level TEXT;

-- 2. Add jlpt_level column to grammar table (if not exists)
ALTER TABLE public.grammar 
ADD COLUMN IF NOT EXISTS jlpt_level TEXT;

-- 3. Change hiragana in vocabulary to nullable (for Chinese vocabulary)
ALTER TABLE public.vocabulary 
ALTER COLUMN hiragana DROP NOT NULL;
