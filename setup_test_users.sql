/*
  SETUP TEST USERS SCRIPT
  =======================
  This script helps you create test users for Teacher and Student roles.
  
  INSTRUCTIONS:
  1. Go to your Supabase Dashboard > SQL Editor.
  2. Copy and paste the script below.
  3. Run the script.
  
  NOTE: Creating users in 'auth.users' directly via SQL is difficult because it requires 
  hasing passwords. 
  
  INSTEAD, WE RECOMMEND:
  1. Go to your app's Register page (/register).
  2. Create an account for Teacher: 
     Email: teacher1@japanese-learning.com
     pass: 123456
  3. Create an account for Student:
     Email: student1@japanese-learning.com
     pass: 123456
  
  AFTER REGISTERING, RUN THIS SQL TO ASSIGN ROLES:
*/

-- 1. Assign TEACHER role
-- Replace 'teacher1@japanese-learning.com' with the email you actually registered.
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, email, 'teacher'
FROM auth.users
WHERE email = 'teacher1@japanese-learning.com'
ON CONFLICT (email) DO UPDATE SET role = 'teacher';

-- 2. Assign STUDENT role (Optional, as default is student, but good to be explicit for tests)
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, email, 'student'
FROM auth.users
WHERE email = 'student1@japanese-learning.com'
ON CONFLICT (email) DO UPDATE SET role = 'student';

-- 3. Verify
SELECT * FROM public.user_roles;
