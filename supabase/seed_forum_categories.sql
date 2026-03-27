-- ============================================================
-- Seed Forum Categories
-- Chạy file này trong Supabase SQL Editor để thêm các chủ đề diễn đàn
-- Nếu app không thấy dữ liệu: chạy thêm forum_categories_rls.sql
-- ============================================================

INSERT INTO forum_categories (name, description, icon, color, order_index) VALUES
  ('Hỏi đáp Tiếng Nhật', 'Đặt câu hỏi về ngữ pháp, từ vựng, và cách sử dụng tiếng Nhật', '🇯🇵', '#ef4444', 1),
  ('Hỏi đáp Tiếng Trung', 'Thắc mắc về Hanzi, Pinyin, ngữ pháp tiếng Trung', '🇨🇳', '#f59e0b', 2),
  ('Chia sẻ tài liệu', 'Chia sẻ sách, video, website học tiếng hữu ích', '📚', '#10b981', 3),
  ('Kinh nghiệm học tập', 'Chia sẻ phương pháp và kinh nghiệm học hiệu quả', '💡', '#6366f1', 4),
  ('Luyện thi JLPT / HSK', 'Thảo luận về lộ trình và tài liệu luyện thi', '📝', '#8b5cf6', 5),
  ('Góc giải trí', 'Nghỉ ngơi, giao lưu, chia sẻ văn hóa Nhật Bản / Trung Quốc', '🎌', '#ec4899', 6)
ON CONFLICT DO NOTHING;

-- Verify
SELECT * FROM forum_categories ORDER BY order_index;
