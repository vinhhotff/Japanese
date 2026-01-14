
-- Content Tables for Japanese/Chinese Learning App

-- Courses
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  level text not null, -- 'N5', 'N4', etc.
  title text not null,
  description text,
  language text not null default 'japanese',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.courses enable row level security;
create policy "Public read courses" on courses for select using (true);
create policy "Admins/Teachers modify courses" on courses for all using (
  exists (select 1 from user_roles where user_roles.user_id = auth.uid() and role in ('admin', 'teacher'))
);

-- Lessons
create table if not exists public.lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) on delete cascade not null,
  title text not null,
  lesson_number int not null,
  description text,
  level text not null,
  language text not null default 'japanese',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.lessons enable row level security;
create policy "Public read lessons" on lessons for select using (true);
create policy "Admins/Teachers modify lessons" on lessons for all using (
  exists (select 1 from user_roles where user_roles.user_id = auth.uid() and role in ('admin', 'teacher'))
);

-- Vocabulary
create table if not exists public.vocabulary (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references lessons(id) on delete cascade not null,
  word text not null,
  meaning text not null,
  hiragana text, -- Japanese reading
  kanji text, -- Optional kanji representation
  romaji text, -- Romanized (optional)
  example text,
  example_translation text,
  difficulty text default 'medium',
  is_difficult boolean default false,
  language text not null default 'japanese',
  character text, -- Chinese Hanzi / Japanese Kanji primary
  pinyin text, -- Chinese Pinyin
  simplified text, -- Chinese Simplified
  traditional text, -- Chinese Traditional
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.vocabulary enable row level security;
create policy "Public read vocabulary" on vocabulary for select using (true);
create policy "Admins/Teachers modify vocabulary" on vocabulary for all using (
  exists (select 1 from user_roles where user_roles.user_id = auth.uid() and role in ('admin', 'teacher'))
);

-- Kanji / Hanzi
create table if not exists public.kanji (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references lessons(id) on delete cascade not null,
  character text not null,
  meaning text not null,
  onyomi text[], -- Japanese
  kunyomi text[], -- Japanese
  pinyin text, -- Chinese
  simplified text, -- Chinese
  traditional text, -- Chinese
  radical text,
  stroke_count int,
  language text not null default 'japanese',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.kanji enable row level security;
create policy "Public read kanji" on kanji for select using (true);
create policy "Admins/Teachers modify kanji" on kanji for all using (
  exists (select 1 from user_roles where user_roles.user_id = auth.uid() and role in ('admin', 'teacher'))
);

-- Kanji Examples
create table if not exists public.kanji_examples (
  id uuid default gen_random_uuid() primary key,
  kanji_id uuid references kanji(id) on delete cascade not null,
  word text not null,
  reading text,
  meaning text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.kanji_examples enable row level security;
create policy "Public read kanji examples" on kanji_examples for select using (true);
create policy "Admins/Teachers modify kanji examples" on kanji_examples for all using (
  exists (select 1 from user_roles where user_roles.user_id = auth.uid() and role in ('admin', 'teacher'))
);

-- Grammar
create table if not exists public.grammar (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references lessons(id) on delete cascade not null,
  pattern text not null,
  meaning text not null,
  explanation text,
  language text not null default 'japanese',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.grammar enable row level security;
create policy "Public read grammar" on grammar for select using (true);
create policy "Admins/Teachers modify grammar" on grammar for all using (
  exists (select 1 from user_roles where user_roles.user_id = auth.uid() and role in ('admin', 'teacher'))
);

-- Grammar Examples
create table if not exists public.grammar_examples (
  id uuid default gen_random_uuid() primary key,
  grammar_id uuid references grammar(id) on delete cascade not null,
  japanese text, -- Sentence
  romaji text,
  translation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.grammar_examples enable row level security;
create policy "Public read grammar examples" on grammar_examples for select using (true);
create policy "Admins/Teachers modify grammar examples" on grammar_examples for all using (
  exists (select 1 from user_roles where user_roles.user_id = auth.uid() and role in ('admin', 'teacher'))
);

-- Listening Exercises
create table if not exists public.listening_exercises (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references lessons(id) on delete cascade not null,
  title text not null,
  audio_url text,
  image_url text,
  transcript text,
  language text not null default 'japanese',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.listening_exercises enable row level security;
create policy "Public read listening" on listening_exercises for select using (true);
create policy "Admins/Teachers modify listening" on listening_exercises for all using (
  exists (select 1 from user_roles where user_roles.user_id = auth.uid() and role in ('admin', 'teacher'))
);

-- Listening Questions
create table if not exists public.listening_questions (
  id uuid default gen_random_uuid() primary key,
  listening_exercise_id uuid references listening_exercises(id) on delete cascade not null,
  question text not null,
  options text[] not null,
  correct_answer int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.listening_questions enable row level security;
create policy "Public read listening questions" on listening_questions for select using (true);
create policy "Admins/Teachers modify listening questions" on listening_questions for all using (
  exists (select 1 from user_roles where user_roles.user_id = auth.uid() and role in ('admin', 'teacher'))
);

-- Sentence Games
create table if not exists public.sentence_games (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references lessons(id) on delete cascade not null,
  sentence text not null,
  translation text not null,
  words text[] not null,
  correct_order int[] not null,
  hint text,
  language text not null default 'japanese',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.sentence_games enable row level security;
create policy "Public read sentence games" on sentence_games for select using (true);
create policy "Admins/Teachers modify sentence games" on sentence_games for all using (
  exists (select 1 from user_roles where user_roles.user_id = auth.uid() and role in ('admin', 'teacher'))
);

-- Roleplay Scenarios
create table if not exists public.roleplay_scenarios (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references lessons(id) on delete cascade not null,
  title text not null,
  description text,
  scenario text,
  character_a text,
  character_b text,
  character_a_script text[],
  character_b_script text[],
  vocabulary_hints text[],
  grammar_points text[],
  difficulty text default 'medium',
  image_url text,
  language text not null default 'japanese',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.roleplay_scenarios enable row level security;
create policy "Public read roleplay" on roleplay_scenarios for select using (true);
create policy "Admins/Teachers modify roleplay" on roleplay_scenarios for all using (
  exists (select 1 from user_roles where user_roles.user_id = auth.uid() and role in ('admin', 'teacher'))
);

-- Speaking Exercises
create table if not exists public.speaking_exercises (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references lessons(id) on delete cascade not null,
  title text not null,
  prompt text not null,
  example_response text,
  language text not null default 'japanese',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.speaking_exercises enable row level security;
create policy "Public read speaking" on speaking_exercises for select using (true);
create policy "Admins/Teachers modify speaking" on speaking_exercises for all using (
  exists (select 1 from user_roles where user_roles.user_id = auth.uid() and role in ('admin', 'teacher'))
);
