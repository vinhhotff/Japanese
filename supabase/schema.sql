-- ================================================================
-- COMPLETE DATABASE SCHEMA - Japanese Learning App
-- Generated from all migration files
-- Run this file in Supabase SQL Editor to set up the entire database
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- HELPER: update_updated_at trigger function
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- CORE TABLES: Courses & Lessons
-- ================================================================

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('N5', 'N4', 'N3', 'N2', 'N1', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese')),
    price INTEGER DEFAULT 0,
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
    level VARCHAR(10) NOT NULL CHECK (level IN ('N5', 'N4', 'N3', 'N2', 'N1', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6')),
    language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese')),
    is_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, lesson_number)
);

-- ================================================================
-- CONTENT TABLES: Vocabulary
-- ================================================================

CREATE TABLE IF NOT EXISTS vocabulary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    word VARCHAR(255) NOT NULL,
    character VARCHAR(255), -- Kanji (Japanese) / Traditional (Chinese)
    hiragana VARCHAR(255) NOT NULL, -- Hiragana (Japanese) / Pinyin (Chinese)
    meaning TEXT NOT NULL,
    example TEXT,
    example_translation TEXT,
    language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese')),
    pinyin VARCHAR(255), -- For Chinese pronunciation
    simplified VARCHAR(255), -- Simplified Chinese
    traditional VARCHAR(255), -- Traditional Chinese
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    is_difficult BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- CONTENT TABLES: Kanji / Hanzi
-- ================================================================

CREATE TABLE IF NOT EXISTS kanji (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    character VARCHAR(10) NOT NULL,
    meaning TEXT NOT NULL,
    onyomi TEXT[],
    kunyomi TEXT[],
    stroke_count INTEGER,
    language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese')),
    pinyin VARCHAR(255),
    simplified VARCHAR(10),
    traditional VARCHAR(10),
    radical VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kanji_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kanji_id UUID REFERENCES kanji(id) ON DELETE CASCADE,
    word VARCHAR(255) NOT NULL,
    reading VARCHAR(255) NOT NULL,
    meaning TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- CONTENT TABLES: Grammar
-- ================================================================

CREATE TABLE IF NOT EXISTS grammar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    pattern VARCHAR(255) NOT NULL,
    meaning TEXT NOT NULL,
    explanation TEXT,
    language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grammar_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grammar_id UUID REFERENCES grammar(id) ON DELETE CASCADE,
    japanese TEXT NOT NULL,
    romaji TEXT,
    translation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- CONTENT TABLES: Listening & Speaking
-- ================================================================

CREATE TABLE IF NOT EXISTS listening_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    audio_url TEXT,
    image_url TEXT,
    transcript TEXT NOT NULL,
    language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listening_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listening_exercise_id UUID REFERENCES listening_exercises(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_answer INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS speaking_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    example_response TEXT,
    language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- CONTENT TABLES: Sentence Games & Roleplay
-- ================================================================

CREATE TABLE IF NOT EXISTS sentence_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    sentence TEXT NOT NULL,
    translation TEXT NOT NULL,
    words TEXT[] NOT NULL,
    correct_order INTEGER[] NOT NULL,
    hint TEXT,
    language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roleplay_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scenario TEXT NOT NULL,
    character_a VARCHAR(255) NOT NULL,
    character_b VARCHAR(255) NOT NULL,
    character_a_script TEXT[],
    character_b_script TEXT[],
    vocabulary_hints TEXT[],
    grammar_points TEXT[],
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    image_url TEXT,
    language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- USER MANAGEMENT: Profiles & Roles
-- ================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teacher assignments (which courses a teacher is assigned to)
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_email TEXT NOT NULL,
    language VARCHAR(20) NOT NULL CHECK (language IN ('japanese', 'chinese')),
    level VARCHAR(10) NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- CLASS MANAGEMENT
-- ================================================================

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    teacher_id UUID NOT NULL,
    level VARCHAR(10) NOT NULL,
    language VARCHAR(20) NOT NULL CHECK (language IN ('japanese', 'chinese')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- PAYMENTS & COURSE ACCESS
-- ================================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    order_code BIGINT UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'failed')),
    checkout_url TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_id UUID REFERENCES payments(id),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- ================================================================
-- PROGRESS & GAMIFICATION
-- ================================================================

CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_challenge_at TIMESTAMPTZ,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_learning_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    completed_steps TEXT[],
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    last_studied_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    criteria_json JSONB,
    category TEXT
);

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS user_notebook (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT CHECK (item_type IN ('vocabulary', 'kanji', 'grammar')),
    item_id UUID,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ASSIGNMENTS SYSTEM (Media Assignments)
-- ================================================================

CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    language VARCHAR(20) NOT NULL CHECK (language IN ('japanese', 'chinese')),
    assignment_type VARCHAR(50) NOT NULL CHECK (assignment_type IN ('writing', 'translation', 'essay', 'vocabulary', 'grammar', 'speaking', 'mixed')),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    max_score INTEGER DEFAULT 100,
    due_date TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT TRUE,
    created_by UUID,
    category TEXT DEFAULT 'exercise',
    level TEXT DEFAULT 'N5',
    passing_score INTEGER DEFAULT 50,
    allowed_attempts INTEGER DEFAULT 1,
    duration_minutes INTEGER DEFAULT 0,
    attachment_urls TEXT[] DEFAULT '{}',
    audio_url TEXT,
    video_url TEXT,
    rich_content JSONB DEFAULT '{}',
    allow_file_upload BOOLEAN DEFAULT FALSE,
    allowed_file_types TEXT[] DEFAULT '{"image/*", "application/pdf"}',
    max_file_size_mb INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) CHECK (question_type IN ('short_answer', 'essay', 'multiple_choice', 'fill_blank', 'translation', 'audio_response')),
    options TEXT[],
    correct_answer TEXT,
    points INTEGER DEFAULT 10,
    attachment_urls TEXT[] DEFAULT '{}',
    audio_url TEXT,
    video_url TEXT,
    requires_file_upload BOOLEAN DEFAULT FALSE,
    allowed_file_types TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID,
    score INTEGER,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, user_id)
);

CREATE TABLE IF NOT EXISTS assignment_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES assignment_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    audio_url TEXT,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    feedback TEXT,
    file_urls TEXT[] DEFAULT '{}',
    video_url TEXT,
    file_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_submission_question UNIQUE (submission_id, question_id)
);

CREATE TABLE IF NOT EXISTS assignment_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    question_id UUID REFERENCES assignment_questions(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- HOMEWORK SYSTEM (Fast Homework)
-- ================================================================

CREATE TABLE IF NOT EXISTS homework (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homework_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homework_id UUID REFERENCES homework(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    content TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    feedback TEXT,
    grade VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- FORUM SYSTEM
-- ================================================================

CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL DEFAULT '💬',
    color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- PEER MATCHING SYSTEM
-- ================================================================

CREATE TABLE IF NOT EXISTS peer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese', 'both')),
    study_level VARCHAR(20) DEFAULT 'N5',
    study_goal VARCHAR(50) DEFAULT 'jlpt',
    available_days TEXT[] DEFAULT '{}',
    available_hours VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    avatar_url TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE,
    total_matches INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS peer_match_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL,
    to_user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS peer_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES peer_match_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- INDEXES
-- ================================================================

-- Core content indexes
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_language ON lessons(language);
CREATE INDEX IF NOT EXISTS idx_lessons_level ON lessons(level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson_id ON vocabulary(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_language ON vocabulary(language);
CREATE INDEX IF NOT EXISTS idx_kanji_lesson_id ON kanji(lesson_id);
CREATE INDEX IF NOT EXISTS idx_grammar_lesson_id ON grammar(lesson_id);
CREATE INDEX IF NOT EXISTS idx_listening_lesson_id ON listening_exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_speaking_lesson_id ON speaking_exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_sentence_games_lesson_id ON sentence_games(lesson_id);
CREATE INDEX IF NOT EXISTS idx_roleplay_scenarios_lesson_id ON roleplay_scenarios(lesson_id);

-- User & auth indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_email ON teacher_assignments(teacher_email);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);

-- Enrollment indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);

-- Assignment indexes
CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id ON assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignments_language ON assignments(language);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_questions_assignment_id ON assignment_questions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user_id ON assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_assignment_answers_submission_id ON assignment_answers(submission_id);

-- Homework indexes
CREATE INDEX IF NOT EXISTS idx_homework_class_id ON homework(class_id);
CREATE INDEX IF NOT EXISTS idx_homework_teacher_id ON homework(teacher_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_homework_id ON homework_submissions(homework_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_student_id ON homework_submissions(student_id);

-- Forum indexes
CREATE INDEX IF NOT EXISTS idx_forum_posts_category_id ON forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_last_reply_at ON forum_posts(last_reply_at);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_user_id ON forum_replies(user_id);

-- Peer matching indexes
CREATE INDEX IF NOT EXISTS idx_peer_profiles_user_id ON peer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_profiles_language ON peer_profiles(language);
CREATE INDEX IF NOT EXISTS idx_peer_profiles_level ON peer_profiles(study_level);
CREATE INDEX IF NOT EXISTS idx_peer_match_requests_from ON peer_match_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_match_requests_to ON peer_match_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_match_requests_status ON peer_match_requests(status);
CREATE INDEX IF NOT EXISTS idx_peer_chat_messages_match_id ON peer_chat_messages(match_id);

-- ================================================================
-- TRIGGERS (auto-update updated_at)
-- ================================================================

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

CREATE TRIGGER update_roleplay_scenarios_updated_at BEFORE UPDATE ON roleplay_scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_courses_updated_at BEFORE UPDATE ON user_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_answers_updated_at BEFORE UPDATE ON assignment_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homework_updated_at BEFORE UPDATE ON homework
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homework_submissions_updated_at BEFORE UPDATE ON homework_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at BEFORE UPDATE ON forum_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_peer_profiles_updated_at BEFORE UPDATE ON peer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_peer_match_requests_updated_at BEFORE UPDATE ON peer_match_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_chat_messages ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- RLS POLICIES
-- ================================================================

-- profiles: users can view all, update their own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles: admin-only management (read all)
CREATE POLICY "user_roles_select" ON user_roles FOR SELECT USING (true);

-- classes: anyone authenticated can view, teachers manage their own
CREATE POLICY "classes_select" ON classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes_insert" ON classes FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "classes_update" ON classes FOR UPDATE TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "classes_delete" ON classes FOR DELETE TO authenticated USING (teacher_id = auth.uid());

-- enrollments: students manage their own, teachers manage for their classes
CREATE POLICY "enrollments_select" ON enrollments FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM classes WHERE classes.id = enrollments.class_id AND classes.teacher_id = auth.uid())
);
CREATE POLICY "enrollments_insert" ON enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "enrollments_delete" ON enrollments FOR DELETE TO authenticated USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM classes WHERE classes.id = enrollments.class_id AND classes.teacher_id = auth.uid())
);

-- payments: users see own payments
CREATE POLICY "payments_select" ON payments FOR SELECT USING (auth.uid() = user_id);

-- user_courses: users see own access
CREATE POLICY "user_courses_select" ON user_courses FOR SELECT USING (auth.uid() = user_id);

-- user_stats: users manage own; public read for leaderboard (top N / rankings)
CREATE POLICY "user_stats_all" ON user_stats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_stats_select_leaderboard" ON user_stats FOR SELECT USING (true);

-- user_learning_progress: users manage own
CREATE POLICY "user_learning_progress_all" ON user_learning_progress FOR ALL USING (auth.uid() = user_id);

-- badges: everyone can see
CREATE POLICY "badges_select" ON badges FOR SELECT USING (true);

-- user_badges: users see own
CREATE POLICY "user_badges_select" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- user_notebook: users manage own
CREATE POLICY "user_notebook_all" ON user_notebook FOR ALL USING (auth.uid() = user_id);

-- assignments: published = visible, creators manage
CREATE POLICY "assignments_select" ON assignments FOR SELECT TO authenticated USING (
    is_published = true OR created_by = auth.uid()
);
CREATE POLICY "assignments_insert" ON assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "assignments_update" ON assignments FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "assignments_delete" ON assignments FOR DELETE TO authenticated USING (created_by = auth.uid() OR created_by IS NULL);

-- assignment_questions: visible for published assignments
CREATE POLICY "assignment_questions_select" ON assignment_questions FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM assignments WHERE assignments.id = assignment_questions.assignment_id AND (assignments.is_published = true OR assignments.created_by = auth.uid()))
);

-- assignment_submissions: own or for own assignments
CREATE POLICY "assignment_submissions_select" ON assignment_submissions FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM assignments WHERE assignments.id = assignment_submissions.assignment_id AND assignments.created_by = auth.uid())
);
CREATE POLICY "assignment_submissions_insert" ON assignment_submissions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "assignment_submissions_update" ON assignment_submissions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "assignment_submissions_delete" ON assignment_submissions FOR DELETE TO authenticated USING (
    (user_id = auth.uid() AND status = 'draft') OR EXISTS (SELECT 1 FROM assignments WHERE assignments.id = assignment_submissions.assignment_id AND assignments.created_by = auth.uid())
);

-- assignment_answers: own or for own assignments
CREATE POLICY "assignment_answers_select" ON assignment_answers FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM assignment_submissions WHERE assignment_submissions.id = assignment_answers.submission_id AND (assignment_submissions.user_id = auth.uid() OR EXISTS (SELECT 1 FROM assignments WHERE assignments.id = assignment_submissions.assignment_id AND assignments.created_by = auth.uid())))
);

-- homework: all visible
CREATE POLICY "homework_select" ON homework FOR SELECT TO authenticated USING (true);
CREATE POLICY "homework_insert" ON homework FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "homework_update" ON homework FOR UPDATE TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "homework_delete" ON homework FOR DELETE TO authenticated USING (teacher_id = auth.uid());

-- homework_submissions: own or for own homework
CREATE POLICY "homework_submissions_select" ON homework_submissions FOR SELECT TO authenticated USING (
    student_id = auth.uid() OR EXISTS (SELECT 1 FROM homework WHERE homework.id = homework_submissions.homework_id AND homework.teacher_id = auth.uid())
);
CREATE POLICY "homework_submissions_insert" ON homework_submissions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "homework_submissions_update" ON homework_submissions FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- forum_categories: public read
CREATE POLICY "forum_categories_select" ON forum_categories FOR SELECT USING (true);

-- forum_posts: public read, auth write own
CREATE POLICY "forum_posts_select" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "forum_posts_insert" ON forum_posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "forum_posts_update" ON forum_posts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "forum_posts_delete" ON forum_posts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- forum_replies: public read, auth write own
CREATE POLICY "forum_replies_select" ON forum_replies FOR SELECT USING (true);
CREATE POLICY "forum_replies_insert" ON forum_replies FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "forum_replies_update" ON forum_replies FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "forum_replies_delete" ON forum_replies FOR DELETE TO authenticated USING (user_id = auth.uid());

-- peer_profiles: auth users only
CREATE POLICY "peer_profiles_select" ON peer_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "peer_profiles_insert" ON peer_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "peer_profiles_update" ON peer_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- peer_match_requests: participants only
CREATE POLICY "peer_match_requests_select" ON peer_match_requests FOR SELECT TO authenticated USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
);
CREATE POLICY "peer_match_requests_insert" ON peer_match_requests FOR INSERT TO authenticated WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "peer_match_requests_update" ON peer_match_requests FOR UPDATE TO authenticated USING (
    (from_user_id = auth.uid() OR to_user_id = auth.uid())
) WITH CHECK (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- peer_chat_messages: match participants only
CREATE POLICY "peer_chat_messages_select" ON peer_chat_messages FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM peer_match_requests WHERE peer_match_requests.id = peer_chat_messages.match_id AND (peer_match_requests.from_user_id = auth.uid() OR peer_match_requests.to_user_id = auth.uid()))
);
CREATE POLICY "peer_chat_messages_insert" ON peer_chat_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- ================================================================
-- SEED DATA: Default Forum Categories
-- ================================================================

INSERT INTO forum_categories (name, description, icon, color, order_index) VALUES
    ('Hỏi đáp Tiếng Nhật', 'Đặt câu hỏi về ngữ pháp, từ vựng, và cách sử dụng tiếng Nhật', '🇯🇵', '#ef4444', 1),
    ('Hỏi đáp Tiếng Trung', 'Thắc mắc về Hanzi, Pinyin, ngữ pháp tiếng Trung', '🇨🇳', '#f59e0b', 2),
    ('Chia sẻ tài liệu', 'Chia sẻ sách, video, website học tiếng hữu ích', '📚', '#10b981', 3),
    ('Kinh nghiệm học tập', 'Chia sẻ phương pháp và kinh nghiệm học hiệu quả', '💡', '#6366f1', 4),
    ('Luyện thi JLPT / HSK', 'Thảo luận về lộ trình và tài liệu luyện thi', '📝', '#8b5cf6', 5),
    ('Góc giải trí', 'Nghỉ ngơi, giao lưu, chia sẻ văn hóa Nhật Bản / Trung Quốc', '🎌', '#ec4899', 6)
ON CONFLICT DO NOTHING;

-- ================================================================
-- SEED DATA: Default Badges
-- ================================================================

INSERT INTO badges (id, name, description, category) VALUES
    ('first_lesson', 'Người mới bắt đầu', 'Hoàn thành bài học đầu tiên của bạn', 'learning'),
    ('streak_7', 'Kiên trì', 'Duy trì chuỗi học tập 7 ngày liên tiếp', 'streak'),
    ('course_completed', 'Nhà thông thái', 'Hoàn thành tất cả bài học trong một khóa học', 'learning')
ON CONFLICT (id) DO NOTHING;
