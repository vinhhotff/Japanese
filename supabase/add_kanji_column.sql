-- Add kanji column back if it was renamed to character
DO $$ 
BEGIN
  -- Check if character column exists but kanji doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='vocabulary' AND column_name='character')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name='vocabulary' AND column_name='kanji') THEN
    -- Rename character back to kanji for backward compatibility
    ALTER TABLE vocabulary RENAME COLUMN character TO kanji;
  END IF;
  
  -- If neither exists, add kanji
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='vocabulary' AND column_name='kanji')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name='vocabulary' AND column_name='character') THEN
    ALTER TABLE vocabulary ADD COLUMN kanji VARCHAR(255);
  END IF;
END $$;

COMMENT ON COLUMN vocabulary.kanji IS 'Kanji for Japanese, Traditional Hanzi for Chinese (optional)';
