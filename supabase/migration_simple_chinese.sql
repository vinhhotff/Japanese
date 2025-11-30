-- Simple Chinese Support Migration
-- Reuse existing columns for Chinese data

-- Add language column to vocabulary (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='vocabulary' AND column_name='language') THEN
    ALTER TABLE vocabulary ADD COLUMN language VARCHAR(20) DEFAULT 'japanese';
  END IF;
END $$;

-- Add constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vocabulary_language_check') THEN
    ALTER TABLE vocabulary ADD CONSTRAINT vocabulary_language_check CHECK (language IN ('japanese', 'chinese'));
  END IF;
END $$;

-- Add language column to grammar
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='grammar' AND column_name='language') THEN
    ALTER TABLE grammar ADD COLUMN language VARCHAR(20) DEFAULT 'japanese';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grammar_language_check') THEN
    ALTER TABLE grammar ADD CONSTRAINT grammar_language_check CHECK (language IN ('japanese', 'chinese'));
  END IF;
END $$;

-- Add language column to listening_exercises
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='listening_exercises' AND column_name='language') THEN
    ALTER TABLE listening_exercises ADD COLUMN language VARCHAR(20) DEFAULT 'japanese';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'listening_language_check') THEN
    ALTER TABLE listening_exercises ADD CONSTRAINT listening_language_check CHECK (language IN ('japanese', 'chinese'));
  END IF;
END $$;

-- Add language column to sentence_games
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='sentence_games' AND column_name='language') THEN
    ALTER TABLE sentence_games ADD COLUMN language VARCHAR(20) DEFAULT 'japanese';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sentence_games_language_check') THEN
    ALTER TABLE sentence_games ADD CONSTRAINT sentence_games_language_check CHECK (language IN ('japanese', 'chinese'));
  END IF;
END $$;

-- Add language column to roleplay_scenarios
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='roleplay_scenarios' AND column_name='language') THEN
    ALTER TABLE roleplay_scenarios ADD COLUMN language VARCHAR(20) DEFAULT 'japanese';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roleplay_language_check') THEN
    ALTER TABLE roleplay_scenarios ADD CONSTRAINT roleplay_language_check CHECK (language IN ('japanese', 'chinese'));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vocabulary_language ON vocabulary(language);
CREATE INDEX IF NOT EXISTS idx_grammar_language ON grammar(language);

-- Comments
COMMENT ON COLUMN vocabulary.language IS 'Language: japanese or chinese';
COMMENT ON COLUMN vocabulary.word IS 'Hiragana for Japanese, Simplified Hanzi for Chinese';
COMMENT ON COLUMN vocabulary.hiragana IS 'Hiragana for Japanese, Pinyin for Chinese';

-- Add character column if it doesn't exist (renamed from kanji)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='vocabulary' AND column_name='character') THEN
    ALTER TABLE vocabulary ADD COLUMN character VARCHAR(255);
  END IF;
END $$;

COMMENT ON COLUMN vocabulary.character IS 'Kanji for Japanese, Traditional Hanzi for Chinese (optional)';
