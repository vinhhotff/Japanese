-- ============================================
-- JAPANESE LEARNING APP - DATABASE MIGRATION
-- Run all at once in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USER MANAGEMENT
-- ============================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (admin, teacher, student)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. COURSES & LESSONS
-- ============================================

-- Courses (JLPT levels, HSK levels)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL, -- N5, N4, N3, N2, N1 for Japanese; HSK1-6 for Chinese
    title TEXT NOT NULL,
    description TEXT,
    language TEXT NOT NULL CHECK (language IN ('japanese', 'chinese')),
    image_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    lesson_number INTEGER NOT NULL,
    description TEXT,
    level TEXT NOT NULL, -- N5, N4, etc.
    language TEXT NOT NULL CHECK (language IN ('japanese', 'chinese')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Course Enrollments
CREATE TABLE IF NOT EXISTS public.user_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    UNIQUE(user_id, course_id)
);

-- ============================================
-- 3. LEARNING CONTENT
-- ============================================

-- Vocabulary
CREATE TABLE IF NOT EXISTS public.vocabulary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    kanji TEXT,
    hiragana TEXT,
    meaning TEXT NOT NULL,
    example TEXT,
    example_translation TEXT,
    furigana TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    is_difficult BOOLEAN DEFAULT false,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kanji
CREATE TABLE IF NOT EXISTS public.kanji (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    character TEXT NOT NULL,
    meaning TEXT NOT NULL,
    onyomi TEXT[],
    kunyomi TEXT[],
    stroke_count INTEGER,
    jlpt_level TEXT,
    example_words TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kanji Examples
CREATE TABLE IF NOT EXISTS public.kanji_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kanji_id UUID REFERENCES public.kanji(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    reading TEXT NOT NULL,
    meaning TEXT NOT NULL
);

-- Grammar
CREATE TABLE IF NOT EXISTS public.grammar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    pattern TEXT NOT NULL,
    meaning TEXT NOT NULL,
    explanation TEXT,
    structure TEXT,
    examples TEXT[],
    jlpt_level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grammar Examples
CREATE TABLE IF NOT EXISTS public.grammar_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grammar_id UUID REFERENCES public.grammar(id) ON DELETE CASCADE,
    example TEXT NOT NULL,
    translation TEXT NOT NULL
);

-- Listening Exercises
CREATE TABLE IF NOT EXISTS public.listening_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    transcript TEXT,
    difficulty TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listening Questions
CREATE TABLE IF NOT EXISTS public.listening_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID REFERENCES public.listening_exercises(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options TEXT[], -- JSON array of options
    correct_answer INTEGER NOT NULL, -- Index of correct option
    explanation TEXT
);

-- Sentence Games
CREATE TABLE IF NOT EXISTS public.sentence_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sentences TEXT[], -- JSON array of sentences to reorder
    difficulty TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roleplay Scenarios
CREATE TABLE IF NOT EXISTS public.roleplay_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scenario_type TEXT, -- restaurant, hotel, shopping, etc.
    language TEXT NOT NULL CHECK (language IN ('japanese', 'chinese')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Speaking Exercises
CREATE TABLE IF NOT EXISTS public.speaking_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    text TEXT NOT NULL, -- The text to speak
    pronunciation TEXT,
    translation TEXT,
    audio_url TEXT,
    difficulty TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. CLASSES & ENROLLMENTS
-- ============================================

-- Classes (teacher-managed)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    level TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('japanese', 'chinese')),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, user_id)
);

-- ============================================
-- 5. ASSIGNMENTS & HOMEWORK
-- ============================================

-- Assignments (teacher-created)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- writing, translation, essay, vocabulary, grammar, speaking, mixed
    questions JSONB, -- Array of questions
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ
);

-- Assignment Questions
CREATE TABLE IF NOT EXISTS public.assignment_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT, -- multiple_choice, short_answer, essay
    options JSONB,
    correct_answer TEXT,
    points INTEGER DEFAULT 1
);

-- Assignment Submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    score INTEGER,
    feedback TEXT,
    answers JSONB
);

-- Assignment Answers
CREATE TABLE IF NOT EXISTS public.assignment_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.assignment_questions(id) ON DELETE CASCADE,
    answer TEXT,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0
);

-- Homework (simple, fast)
CREATE TABLE IF NOT EXISTS public.homework (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homework Submissions
CREATE TABLE IF NOT EXISTS public.homework_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homework_id UUID REFERENCES public.homework(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    content TEXT,
    score INTEGER,
    feedback TEXT
);

-- Teacher Assignments (which teacher teaches which course)
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES auth.users(id),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    level TEXT,
    language TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. USER STATS & PROGRESS
-- ============================================

-- User Stats
CREATE TABLE IF NOT EXISTS public.user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_xp INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ,
    lessons_completed INTEGER DEFAULT 0,
    words_learned INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Learning Progress
CREATE TABLE IF NOT EXISTS public.user_learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    completed_steps TEXT[] DEFAULT '{}',
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    last_studied_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- ============================================
-- 7. SPEAKING PRACTICE (NEW)
-- ============================================

-- Speaking Practice Attempts
CREATE TABLE IF NOT EXISTS public.speaking_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_text TEXT NOT NULL,
    target_language TEXT NOT NULL CHECK (target_language IN ('japanese', 'chinese')),
    audio_url TEXT,
    transcript TEXT,
    confidence REAL,
    similarity INTEGER,
    is_match BOOLEAN DEFAULT false,
    duration_sec REAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    lesson_id TEXT,
    course_id TEXT
);

-- ============================================
-- 8. STORAGE BUCKETS
-- ============================================

-- Insert storage buckets (run once)
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('images', 'images', true),
    ('audio-files', 'audio-files', true),
    ('videos', 'videos', true),
    ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanji ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentence_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roleplay_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified - allow all for development)
DROP POLICY IF EXISTS "Allow public read courses" ON public.courses;
CREATE POLICY "Allow public read courses" ON public.courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read lessons" ON public.lessons;
CREATE POLICY "Allow public read lessons" ON public.lessons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read vocabulary" ON public.vocabulary;
CREATE POLICY "Allow public read vocabulary" ON public.vocabulary FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read kanji" ON public.kanji;
CREATE POLICY "Allow public read kanji" ON public.kanji FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read grammar" ON public.grammar;
CREATE POLICY "Allow public read grammar" ON public.grammar FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read listening" ON public.listening_exercises;
CREATE POLICY "Allow public read listening" ON public.listening_exercises FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read speaking" ON public.speaking_exercises;
CREATE POLICY "Allow public read speaking" ON public.speaking_exercises FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read classes" ON public.classes;
CREATE POLICY "Allow public read classes" ON public.classes FOR SELECT USING (true);

-- User policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can read own enrollments" ON public.enrollments;
CREATE POLICY "Users can read own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can read own submissions" ON public.assignment_submissions;
CREATE POLICY "Users can read own submissions" ON public.assignment_submissions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can read own homework submissions" ON public.homework_submissions;
CREATE POLICY "Users can read own homework submissions" ON public.homework_submissions FOR SELECT USING (auth.uid() = student_id);
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_learning_progress;
CREATE POLICY "Users can manage own progress" ON public.user_learning_progress FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own speaking attempts" ON public.speaking_attempts;
CREATE POLICY "Users can manage own speaking attempts" ON public.speaking_attempts FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can read own stats" ON public.user_stats;
CREATE POLICY "Users can read own stats" ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
CREATE POLICY "Users can update own stats" ON public.user_stats FOR ALL USING (auth.uid() = user_id);

-- Teacher/Admin policies
DROP POLICY IF EXISTS "Teachers can read all classes" ON public.classes;
CREATE POLICY "Teachers can read all classes" ON public.classes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE email = auth.jwt()->>'email' AND role IN ('teacher', 'admin'))
);
DROP POLICY IF EXISTS "Teachers can manage classes" ON public.classes;
CREATE POLICY "Teachers can manage classes" ON public.classes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE email = auth.jwt()->>'email' AND role IN ('teacher', 'admin'))
);
DROP POLICY IF EXISTS "Teachers can manage assignments" ON public.assignments;
CREATE POLICY "Teachers can manage assignments" ON public.assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE email = auth.jwt()->>'email' AND role IN ('teacher', 'admin'))
);
DROP POLICY IF EXISTS "Teachers can read submissions" ON public.assignment_submissions;
CREATE POLICY "Teachers can read submissions" ON public.assignment_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE email = auth.jwt()->>'email' AND role IN ('teacher', 'admin'))
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson ON public.vocabulary(lesson_id);
CREATE INDEX IF NOT EXISTS idx_kanji_lesson ON public.kanji(lesson_id);
CREATE INDEX IF NOT EXISTS idx_grammar_lesson ON public.grammar(lesson_id);
CREATE INDEX IF NOT EXISTS idx_listening_lesson ON public.listening_exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_creator ON public.assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_homework_teacher ON public.homework(teacher_id);
CREATE INDEX IF NOT EXISTS idx_homework_class ON public.homework(class_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_speaking_user ON public.speaking_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_speaking_created ON public.speaking_attempts(created_at DESC);

-- ============================================
-- INITIAL DATA (SAMPLE COURSES)
-- ============================================

INSERT INTO public.courses (level, title, description, language) VALUES
    ('N5', 'JLPT N5 - Tiếng Nhật Cơ bản', 'Khóa học tiếng Nhật cơ bản dành cho người mới bắt đầu', 'japanese'),
    ('N4', 'JLPT N4 - Tiếng Nhật Sơ cấp', 'Khóa học tiếng Nhật sơ cấp', 'japanese'),
    ('N3', 'JLPT N3 - Tiếng Nhật Trung cấp', 'Khóa học tiếng Nhật trung cấp', 'japanese'),
    ('HSK1', 'HSK 1 - Tiếng Trung Cơ bản', 'Khóa học tiếng Trung cơ bản (100 từ)', 'chinese'),
    ('HSK2', 'HSK 2 - Tiếng Trung Sơ cấp', 'Khóa học tiếng Trung sơ cấp (300 từ)', 'chinese')
ON CONFLICT DO NOTHING;

-- Get course IDs and create sample lessons
DO $$
DECLARE
    n5_uuid UUID;
    hsk1_uuid UUID;
BEGIN
    SELECT id INTO n5_uuid FROM public.courses WHERE level = 'N5' AND language = 'japanese' LIMIT 1;
    SELECT id INTO hsk1_uuid FROM public.courses WHERE level = 'HSK1' AND language = 'chinese' LIMIT 1;

    IF n5_uuid IS NOT NULL THEN
        INSERT INTO public.lessons (course_id, title, lesson_number, level, language) VALUES
            (n5_uuid, 'Bài 1: Chào hỏi', 1, 'N5', 'japanese'),
            (n5_uuid, 'Bài 2: Giới thiệu bản thân', 2, 'N5', 'japanese'),
            (n5_uuid, 'Bài 3: Gia đình', 3, 'N5', 'japanese'),
            (n5_uuid, 'Bài 4: Thời gian', 4, 'N5', 'japanese'),
            (n5_uuid, 'Bài 5: Mua sắm', 5, 'N5', 'japanese')
        ON CONFLICT DO NOTHING;
    END IF;

    IF hsk1_uuid IS NOT NULL THEN
        INSERT INTO public.lessons (course_id, title, lesson_number, level, language) VALUES
            (hsk1_uuid, 'Bài 1: Chào hỏi', 1, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 2: Giới thiệu', 2, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 3: Gia đình', 3, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 4: Số đếm', 4, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 5: Mua sắm', 5, 'HSK1', 'chinese')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- DEFAULT ROLES (example)
-- ============================================

-- Add your admin/teacher emails here
-- INSERT INTO public.user_roles (email, role) VALUES 
--     ('admin@example.com', 'admin'),
--     ('teacher@example.com', 'teacher');

-- ============================================
-- DONE!
-- ============================================
