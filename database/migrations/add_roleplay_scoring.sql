-- Migration: Add scoring fields to roleplay_scenarios table
-- Run this in Supabase SQL Editor

-- Add new columns for scoring system
ALTER TABLE roleplay_scenarios 
ADD COLUMN IF NOT EXISTS character_a_correct_answers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS character_b_correct_answers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS enable_scoring boolean DEFAULT false;

-- Add comment to explain the structure
COMMENT ON COLUMN roleplay_scenarios.character_a_correct_answers IS 'Array of arrays containing correct answers for each line of character A. Example: [["こんにちは", "こんにちわ"], ["ありがとう"]]';
COMMENT ON COLUMN roleplay_scenarios.character_b_correct_answers IS 'Array of arrays containing correct answers for each line of character B. Example: [["はい", "ええ"], ["いいえ"]]';
COMMENT ON COLUMN roleplay_scenarios.enable_scoring IS 'Enable automatic scoring and answer validation for this scenario';

-- Update existing records to have empty arrays
UPDATE roleplay_scenarios 
SET 
  character_a_correct_answers = '[]'::jsonb,
  character_b_correct_answers = '[]'::jsonb,
  enable_scoring = false
WHERE 
  character_a_correct_answers IS NULL 
  OR character_b_correct_answers IS NULL 
  OR enable_scoring IS NULL;
