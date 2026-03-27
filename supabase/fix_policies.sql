-- Fix duplicate policy errors - add IF NOT EXISTS to existing policies

-- Drop and recreate policies with IF NOT EXISTS logic
-- Since PostgreSQL doesn't support IF NOT EXISTS for policies, we need to drop first then create

-- Profiles policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Lessons policies
DROP POLICY IF EXISTS "Users can view all lessons" ON public.lessons;
CREATE POLICY "Users can view all lessons" ON public.lessons
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers can create lessons" ON public.lessons;
CREATE POLICY "Teachers can create lessons" ON public.lessons
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers can update lessons" ON public.lessons;
CREATE POLICY "Teachers can update lessons" ON public.lessons
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'teacher')
    );

-- Vocabulary policies
DROP POLICY IF EXISTS "Users can view vocabulary" ON public.vocabulary;
CREATE POLICY "Users can view vocabulary" ON public.vocabulary
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers can create vocabulary" ON public.vocabulary;
CREATE POLICY "Teachers can create vocabulary" ON public.vocabulary
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers can update vocabulary" ON public.vocabulary;
CREATE POLICY "Teachers can update vocabulary" ON public.vocabulary
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'teacher')
    );

DROP POLICY IF EXISTS "Teachers can delete vocabulary" ON public.vocabulary;
CREATE POLICY "Teachers can delete vocabulary" ON public.vocabulary
    FOR DELETE USING (
        auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'teacher')
    );

-- Grammar policies
DROP POLICY IF EXISTS "Users can view grammar" ON public.grammar;
CREATE POLICY "Users can view grammar" ON public.grammar
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers can create grammar" ON public.grammar;
CREATE POLICY "Teachers can create grammar" ON public.grammar
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers can update grammar" ON public.grammar;
CREATE POLICY "Teachers can update grammar" ON public.grammar
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'teacher')
    );

-- Speaking exercises policies
DROP POLICY IF EXISTS "Users can view speaking exercises" ON public.speaking_exercises;
CREATE POLICY "Users can view speaking exercises" ON public.speaking_exercises
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers can create speaking exercises" ON public.speaking_exercises;
CREATE POLICY "Teachers can create speaking exercises" ON public.speaking_exercises
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Assignments policies
DROP POLICY IF EXISTS "Users can view assignments" ON public.assignments;
CREATE POLICY "Users can view assignments" ON public.assignments
    FOR SELECT USING (
        auth.uid() = student_id OR 
        auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'teacher')
    );

DROP POLICY IF EXISTS "Students can create assignments" ON public.assignments;
CREATE POLICY "Students can create assignments" ON public.assignments
    FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can update assignments" ON public.assignments;
CREATE POLICY "Teachers can update assignments" ON public.assignments
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'teacher')
    );

-- Progress policies
DROP POLICY IF EXISTS "Users can view own progress" ON public.progress;
CREATE POLICY "Users can view own progress" ON public.progress
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.progress;
CREATE POLICY "Users can update own progress" ON public.progress
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.progress;
CREATE POLICY "Users can insert own progress" ON public.progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User progress policies
DROP POLICY IF EXISTS "Users can view own user_progress" ON public.user_progress;
CREATE POLICY "Users can view own user_progress" ON public.user_progress
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_progress" ON public.user_progress;
CREATE POLICY "Users can update own user_progress" ON public.user_progress
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user_progress" ON public.user_progress;
CREATE POLICY "Users can insert own user_progress" ON public.user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Study sessions policies
DROP POLICY IF EXISTS "Users can view own study_sessions" ON public.study_sessions;
CREATE POLICY "Users can view own study_sessions" ON public.study_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create study_sessions" ON public.study_sessions;
CREATE POLICY "Users can create study_sessions" ON public.study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
