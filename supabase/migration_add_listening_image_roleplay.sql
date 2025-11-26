-- Migration: Add image_url to listening_exercises and create roleplay_scenarios table

-- Add image_url column to listening_exercises
ALTER TABLE listening_exercises 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create roleplay_scenarios table
CREATE TABLE IF NOT EXISTS roleplay_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scenario TEXT NOT NULL, -- The roleplay scenario/script
  character_a VARCHAR(255) NOT NULL, -- Character A name/role
  character_b VARCHAR(255) NOT NULL, -- Character B name/role
  character_a_script TEXT[], -- Array of lines for character A
  character_b_script TEXT[], -- Array of lines for character B
  vocabulary_hints TEXT[], -- Vocabulary hints for the scenario
  grammar_points TEXT[], -- Grammar points used
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for roleplay scenarios
CREATE INDEX IF NOT EXISTS idx_roleplay_scenarios_lesson_id ON roleplay_scenarios(lesson_id);

-- Trigger to update updated_at for roleplay_scenarios
CREATE TRIGGER update_roleplay_scenarios_updated_at BEFORE UPDATE ON roleplay_scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

