-- Supabase Database Schema for Japanese Learning App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Courses table
-- Note: Removed UNIQUE(level) constraint to allow multiple courses per level
-- For example, you can have multiple N5 courses with different topics
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level VARCHAR(10) NOT NULL CHECK (level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  lesson_number INTEGER NOT NULL,
  description TEXT,
  level VARCHAR(10) NOT NULL CHECK (level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, lesson_number)
);

-- Vocabulary table
CREATE TABLE IF NOT EXISTS vocabulary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  word VARCHAR(255) NOT NULL,
  kanji VARCHAR(255),
  hiragana VARCHAR(255) NOT NULL,
  meaning TEXT NOT NULL,
  example TEXT,
  example_translation TEXT,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_difficult BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kanji table
CREATE TABLE IF NOT EXISTS kanji (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  character VARCHAR(10) NOT NULL,
  meaning TEXT NOT NULL,
  onyomi TEXT[], -- Array of onyomi readings
  kunyomi TEXT[], -- Array of kunyomi readings
  stroke_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kanji examples table
CREATE TABLE IF NOT EXISTS kanji_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kanji_id UUID REFERENCES kanji(id) ON DELETE CASCADE,
  word VARCHAR(255) NOT NULL,
  reading VARCHAR(255) NOT NULL,
  meaning TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grammar table
CREATE TABLE IF NOT EXISTS grammar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  pattern VARCHAR(255) NOT NULL,
  meaning TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grammar examples table
CREATE TABLE IF NOT EXISTS grammar_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grammar_id UUID REFERENCES grammar(id) ON DELETE CASCADE,
  japanese TEXT NOT NULL,
  romaji TEXT,
  translation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listening exercises table
CREATE TABLE IF NOT EXISTS listening_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  audio_url TEXT,
  image_url TEXT, -- Image for the listening exercise
  transcript TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listening questions table
CREATE TABLE IF NOT EXISTS listening_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listening_exercise_id UUID REFERENCES listening_exercises(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Speaking exercises table
CREATE TABLE IF NOT EXISTS speaking_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  example_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sentence games table
CREATE TABLE IF NOT EXISTS sentence_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  sentence TEXT NOT NULL,
  translation TEXT NOT NULL,
  words TEXT[] NOT NULL,
  correct_order INTEGER[] NOT NULL,
  hint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table (optional, for future use)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- Can be linked to auth.users if using Supabase Auth
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  vocabulary_mastered UUID[],
  kanji_mastered UUID[],
  grammar_mastered UUID[],
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson_id ON vocabulary(lesson_id);
CREATE INDEX IF NOT EXISTS idx_kanji_lesson_id ON kanji(lesson_id);
CREATE INDEX IF NOT EXISTS idx_grammar_lesson_id ON grammar(lesson_id);
CREATE INDEX IF NOT EXISTS idx_listening_lesson_id ON listening_exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_speaking_lesson_id ON speaking_exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_sentence_games_lesson_id ON sentence_games(lesson_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vocabulary_updated_at BEFORE UPDATE ON vocabulary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanji_updated_at BEFORE UPDATE ON kanji
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grammar_updated_at BEFORE UPDATE ON grammar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listening_exercises_updated_at BEFORE UPDATE ON listening_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_speaking_exercises_updated_at BEFORE UPDATE ON speaking_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sentence_games_updated_at BEFORE UPDATE ON sentence_games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Roleplay scenarios table
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

-- Indexes for roleplay scenarios
CREATE INDEX IF NOT EXISTS idx_roleplay_scenarios_lesson_id ON roleplay_scenarios(lesson_id);

-- Trigger to update updated_at for roleplay_scenarios
CREATE TRIGGER update_roleplay_scenarios_updated_at BEFORE UPDATE ON roleplay_scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

