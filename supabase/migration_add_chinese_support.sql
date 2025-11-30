-- Migration: Add Chinese Language Support
-- This adds support for learning Chinese (Mandarin) alongside Japanese

-- Add language column to existing tables
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese'));
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese'));

-- Update level check to support both Japanese (N5-N1) and Chinese (HSK1-HSK6)
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_check;
ALTER TABLE courses ADD CONSTRAINT courses_level_check 
  CHECK (level IN ('N5', 'N4', 'N3', 'N2', 'N1', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'));

ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_level_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_level_check 
  CHECK (level IN ('N5', 'N4', 'N3', 'N2', 'N1', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'));

-- Update vocabulary table for Chinese
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese'));
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS pinyin VARCHAR(255); -- For Chinese pronunciation
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS simplified VARCHAR(255); -- Simplified Chinese
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS traditional VARCHAR(255); -- Traditional Chinese
-- Rename kanji to character (more generic)
ALTER TABLE vocabulary RENAME COLUMN kanji TO character;

-- Update kanji table to support Chinese characters (Hanzi)
ALTER TABLE kanji ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese'));
ALTER TABLE kanji ADD COLUMN IF NOT EXISTS pinyin VARCHAR(255); -- For Chinese pronunciation
ALTER TABLE kanji ADD COLUMN IF NOT EXISTS simplified VARCHAR(10); -- Simplified form
ALTER TABLE kanji ADD COLUMN IF NOT EXISTS traditional VARCHAR(10); -- Traditional form
ALTER TABLE kanji ADD COLUMN IF NOT EXISTS radical VARCHAR(50); -- Character radical

-- Update grammar table
ALTER TABLE grammar ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese'));

-- Update listening exercises
ALTER TABLE listening_exercises ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese'));

-- Update speaking exercises
ALTER TABLE speaking_exercises ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese'));

-- Update sentence games
ALTER TABLE sentence_games ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese'));

-- Update roleplay scenarios
ALTER TABLE roleplay_scenarios ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese'));

-- Create indexes for language filtering
CREATE INDEX IF NOT EXISTS idx_courses_language ON courses(language);
CREATE INDEX IF NOT EXISTS idx_lessons_language ON lessons(language);
CREATE INDEX IF NOT EXISTS idx_vocabulary_language ON vocabulary(language);
CREATE INDEX IF NOT EXISTS idx_kanji_language ON kanji(language);
CREATE INDEX IF NOT EXISTS idx_grammar_language ON grammar(language);

-- Create indexes for level filtering (for pagination)
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_lessons_level ON lessons(level);

-- Comments for documentation
COMMENT ON COLUMN courses.language IS 'Language of the course: japanese or chinese';
COMMENT ON COLUMN vocabulary.pinyin IS 'Pinyin pronunciation for Chinese words';
COMMENT ON COLUMN vocabulary.simplified IS 'Simplified Chinese characters';
COMMENT ON COLUMN vocabulary.traditional IS 'Traditional Chinese characters';
COMMENT ON COLUMN kanji.pinyin IS 'Pinyin pronunciation for Chinese characters (Hanzi)';
