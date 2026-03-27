-- ============================================================
-- Forum: FK user_id → profiles (PostgREST embed + integrity)
-- Lỗi PGRST200: "Could not find a relationship between forum_posts and profiles"
-- xảy ra khi .select('..., profiles(...)') mà chưa có foreign key.
-- Chạy file này một lần trên Supabase SQL Editor (sau khi đã có bảng forum_*).
-- ============================================================

-- forum_posts.user_id → profiles(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'forum_posts_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.forum_posts
      ADD CONSTRAINT forum_posts_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- forum_replies.user_id → profiles(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'forum_replies_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.forum_replies
      ADD CONSTRAINT forum_replies_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
