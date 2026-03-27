-- Add missing columns to existing tables

-- Add jlpt_level column to grammar table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grammar' AND column_name = 'jlpt_level'
    ) THEN
        ALTER TABLE public.grammar ADD COLUMN jlpt_level TEXT;
    END IF;
END $$;

-- Add text column to speaking_exercises table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'speaking_exercises' AND column_name = 'text'
    ) THEN
        ALTER TABLE public.speaking_exercises ADD COLUMN text TEXT NOT NULL;
    END IF;
END $$;
