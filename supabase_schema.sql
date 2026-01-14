-- Profiles (User Details)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  bio text,
  updated_at timestamp with time zone,
  constraint username_length check (char_length(full_name) >= 3)
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can update their own profile." on profiles for update using ( auth.uid() = id );

-- User Roles (RBAC)
create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'teacher', 'student')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(email)
);
alter table public.user_roles enable row level security;
create policy "Allow read access for all authenticated users" on user_roles for select to authenticated using ( true );
-- In real prod, restrict write to admin only via RLS logic or triggers

-- Teacher Assignments (Permission to manage content)
create table if not exists public.teacher_assignments (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references auth.users(id) on delete cascade,
  teacher_email text not null,
  language text not null,
  level text not null,
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  assigned_by uuid references auth.users(id)
);
alter table public.teacher_assignments enable row level security;
create policy "Teachers can view their own assignments" on teacher_assignments for select using ( auth.uid() = teacher_id );

-- Classes (Created by teachers)
create table if not exists public.classes (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  name text not null,
  teacher_id uuid references auth.users(id) on delete cascade,
  level text not null,
  language text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.classes enable row level security;
create policy "Public read classes" on classes for select using (true);
create policy "Teachers can insert classes" on classes for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their own classes" on classes for update using (auth.uid() = teacher_id);

-- Enrollments (Students joining classes)
create table if not exists public.enrollments (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(class_id, user_id)
);
alter table public.enrollments enable row level security;
create policy "Users can view their own enrollments" on enrollments for select using (auth.uid() = user_id);
create policy "Teachers can view enrollments of their classes" on enrollments for select using (
  exists (select 1 from classes where classes.id = enrollments.class_id and classes.teacher_id = auth.uid())
);
create policy "Users can insert their own enrollment" on enrollments for insert with check (auth.uid() = user_id);

-- Homework Assignments
create table if not exists public.homework (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade,
  teacher_id uuid references auth.users(id),
  title text not null,
  description text,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.homework enable row level security;
create policy "Read homework" on homework for select using (
  exists (select 1 from enrollments where enrollments.class_id = homework.class_id and enrollments.user_id = auth.uid())
  or
  teacher_id = auth.uid()
);
create policy "Teachers create homework" on homework for insert with check (teacher_id = auth.uid());

-- Homework Submissions
create table if not exists public.homework_submissions (
  id uuid default gen_random_uuid() primary key,
  homework_id uuid references homework(id) on delete cascade,
  student_id uuid references auth.users(id),
  content text, 
  feedback text,
  grade text,
  submitted_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.homework_submissions enable row level security;
create policy "View submissions" on homework_submissions for select using (
  student_id = auth.uid() or 
  exists (select 1 from homework where homework.id = homework_submissions.homework_id and homework.teacher_id = auth.uid())
);
create policy "Student submit" on homework_submissions for insert with check (student_id = auth.uid());
create policy "Teacher grade" on homework_submissions for update using (
  exists (select 1 from homework where homework.id = homework_submissions.homework_id and homework.teacher_id = auth.uid())
);

-- Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info', 
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.notifications enable row level security;
create policy "Users see own notifications" on notifications for select using (auth.uid() = user_id);
