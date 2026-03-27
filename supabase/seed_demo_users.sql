-- ================================================================
-- SEED DEMO USERS (bypass auth.users FK temporarily)
-- ================================================================
-- Chạy script này TRƯỚC seed_leaderboard_data.sql
-- Sau khi xong, FK sẽ được bật lại
-- ================================================================

BEGIN;

-- 1. DROP FK tạm thời (profiles → auth.users)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Tạo 10 demo user trong profiles (id giả, không cần auth.users)
INSERT INTO profiles (id, email, full_name, bio)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'nguyen.tien@example.com', 'Nguyễn Tiến Minh', 'Học viên yêu thích tiếng Nhật'),
    ('00000000-0000-0000-0000-000000000002', 'tran.thi@example.com', 'Trần Thị Hà Lan', 'Chuyên gia JLPT N2'),
    ('00000000-0000-0000-0000-000000000003', 'le.hoang@example.com', 'Lê Hoàng Nam', 'Người đam mê Hán tự'),
    ('00000000-0000-0000-0000-000000000004', 'pham.thu@example.com', 'Phạm Thu Hương', 'Học mỗi ngày, không bỏ cuộc'),
    ('00000000-0000-0000-0000-000000000005', 'nguyen.dieu@example.com', 'Nguyễn Diệu Linh', 'Yêu tiếng Trung từ nhỏ'),
    ('00000000-0000-0000-0000-000000000006', 'truong.viet@example.com', 'Trương Việt Đức', 'Nghỉ học là không bỏ bình luận'),
    ('00000000-0000-0000-0000-000000000007', 'bui.thanh@example.com', 'Bùi Thanh Hà', 'Lần đầu học Kanji'),
    ('00000000-0000-0000-0000-000000000008', 'hoang.thu@example.com', 'Hoàng Thu Minh', 'Tốt nghiệp HSK4'),
    ('00000000-0000-0000-0000-000000000009', 'dinh.duc@example.com', 'Đinh Đức Anh', 'Tập trung cao độ'),
    ('00000000-0000-0000-0000-000000000010', 'ly.lan@example.com', 'Lý Lan Chi', 'Học tiếng Nhật qua anime')
ON CONFLICT (id) DO NOTHING;

-- 3. Bật lại FK
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMIT;

-- 4. Verify
SELECT id, email, full_name FROM profiles LIMIT 10;
