-- ============================================================
-- Forum categories: RLS + public read
-- Nếu đã bật RLS nhưng chưa có policy SELECT, API trả về [] (không lỗi)
-- → dropdown / trang diễn đàn trống dù SQL Editor thấy dữ liệu.
-- Chạy toàn bộ file này trong Supabase SQL Editor.
-- ============================================================

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forum_categories_select" ON forum_categories;

CREATE POLICY "forum_categories_select"
  ON forum_categories
  FOR SELECT
  USING (true);
