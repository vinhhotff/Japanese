# 🔧 Hướng Dẫn Chạy Migration - Xóa Unique Constraint

## Vấn đề

Lỗi `duplicate key value violates unique constraint "courses_level_key"` xảy ra vì trong database có constraint `UNIQUE(level)` trên bảng `courses`, không cho phép nhiều khóa học cùng level.

## Giải pháp

Xóa unique constraint để cho phép nhiều khóa học cùng level (ví dụ: nhiều khóa học N5 với các chủ đề khác nhau).

## Cách chạy migration

### Cách 1: Qua Supabase Dashboard (Khuyến nghị)

1. Vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)
4. Copy và paste nội dung file `supabase/migration_remove_unique_level.sql`:

```sql
-- Migration: Remove unique constraint on courses.level
-- This allows multiple courses with the same level (e.g., multiple N5 courses)

-- Drop the unique constraint
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_key;

-- Also drop if it exists with different name
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_unique;
```

5. Click **Run** để thực thi
6. Kiểm tra kết quả - nếu thành công sẽ thấy "Success. No rows returned"

### Cách 2: Qua Supabase CLI

Nếu bạn đã cài đặt Supabase CLI:

```bash
# Kết nối với Supabase project
supabase db push

# Hoặc chạy migration file trực tiếp
psql -h [your-db-host] -U postgres -d postgres -f supabase/migration_remove_unique_level.sql
```

## Kiểm tra kết quả

Sau khi chạy migration, bạn có thể:

1. Tạo nhiều khóa học cùng level (ví dụ: nhiều khóa học N5)
2. Trang home sẽ tự động gom tất cả khóa học cùng level vào một card
3. Khi click vào level (ví dụ N5), sẽ hiển thị tất cả bài học từ tất cả khóa học N5

## Lưu ý

- Migration này chỉ xóa constraint, không ảnh hưởng đến dữ liệu hiện có
- Nếu có lỗi về constraint name khác, kiểm tra trong Supabase Dashboard → Database → Tables → courses → Constraints

## Sau khi migration

1. Có thể tạo nhiều khóa học cùng level trong Admin Panel
2. Trang home sẽ hiển thị:
   - Nếu 1 khóa học/level: Hiển thị tên khóa học
   - Nếu nhiều khóa học/level: Hiển thị "N5 - X khóa học" và gom tất cả bài học lại

