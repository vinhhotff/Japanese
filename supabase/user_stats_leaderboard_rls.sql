-- ============================================================
-- user_stats: cho phép đọc công khai để bảng xếp hạng hiển thị top N
-- Policy "user_stats_all" (FOR ALL USING auth.uid() = user_id) khiến
-- mỗi user chỉ thấy 1 dòng của chính họ → Leaderboard chỉ có 1 người.
-- Chạy toàn bộ file này trong Supabase SQL Editor nếu DB đã tồn tại.
-- ============================================================

DROP POLICY IF EXISTS "user_stats_select_leaderboard" ON user_stats;

CREATE POLICY "user_stats_select_leaderboard"
  ON user_stats
  FOR SELECT
  USING (true);
