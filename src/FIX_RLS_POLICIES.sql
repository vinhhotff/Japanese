-- FIX: Allow all authenticated users (Students/Admins/Teachers) to VIEW courses
-- Issue: By default, Supabase might not allow logged-in users to SELECT from tables if no policy exists.

-- 1. Create Policy for COURSES
create policy "Enable read access for authenticated users" 
on "public"."courses"
as permissive
for select
to authenticated
using (true);

-- 2. Create Policy for LESSONS
create policy "Enable read access for authenticated users" 
on "public"."lessons"
as permissive
for select
to authenticated
using (true);

-- 3. Create Policy for VOCABULARY
create policy "Enable read access for authenticated users" 
on "public"."vocabulary"
as permissive
for select
to authenticated
using (true);
