-- =============================================
-- DATABASE SCHEMA FOR CLOUD SYNC & GAMIFICATION
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Table: user_stats (Streak, Points, Levels)
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

-- 2. Table: user_learning_progress (Sync progress for each lesson)
CREATE TABLE IF NOT EXISTS user_learning_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    completed_steps TEXT[], -- Array of step IDs completed
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    last_studied_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- 3. Table: badges (Definitions for achievements)
CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY, -- e.g., 'first_lesson', '7_day_streak'
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    criteria_json JSONB, -- JSON representation of requirements
    category TEXT -- 'learning', 'community', 'streak'
);

-- 4. Table: user_badges (Badges awarded to users)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 5. Table: user_notebook (Personal saved items)
CREATE TABLE IF NOT EXISTS user_notebook (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT CHECK (item_type IN ('vocabulary', 'kanji', 'grammar')),
    item_id UUID, -- References the specific item
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notebook ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see and edit their own data
CREATE POLICY "Users can manage own stats" ON user_stats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON user_learning_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Everyone can see badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notebook" ON user_notebook FOR ALL USING (auth.uid() = user_id);

-- Initial Badges Data
INSERT INTO badges (id, name, description, category) VALUES 
('first_lesson', 'Người mới bắt đầu', 'Hoàn thành bài học đầu tiên của bạn', 'learning'),
('streak_7', 'Kiên trì', 'Duy trì chuỗi học tập 7 ngày liên tiếp', 'streak'),
('course_completed', 'Nhà thông thái', 'Hoàn thành tất cả bài học trong một khóa học', 'learning')
ON CONFLICT (id) DO NOTHING;
