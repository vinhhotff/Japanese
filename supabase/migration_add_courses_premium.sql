-- Add is_premium column to courses table if not exists
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;