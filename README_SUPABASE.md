# 🗄️ Hướng Dẫn Setup Supabase

## Bước 1: Tạo Supabase Project

1. Truy cập [https://supabase.com](https://supabase.com)
2. Đăng ký/Đăng nhập
3. Tạo project mới
4. Lưu lại:
   - **Project URL** (ví dụ: `https://xxxxx.supabase.co`)
   - **Anon Key** (API Key công khai)

## Bước 2: Chạy SQL Schema

1. Mở Supabase Dashboard → SQL Editor
2. Copy toàn bộ nội dung file `supabase/schema.sql`
3. Paste vào SQL Editor và chạy (Run)

## Bước 3: Cấu hình Environment Variables

1. Tạo file `.env` trong thư mục gốc (copy từ `.env.example`)
2. Thêm các biến sau:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Bước 4: Cài đặt Dependencies

```bash
npm install
```

## Bước 5: Chạy ứng dụng

```bash
npm run dev
```

## 📋 Cấu trúc Database

### Tables chính:
- **courses**: Khóa học (N5-N1)
- **lessons**: Bài học
- **vocabulary**: Từ vựng
- **kanji**: Kanji
- **grammar**: Ngữ pháp
- **listening_exercises**: Bài tập nghe
- **speaking_exercises**: Bài tập nói
- **sentence_games**: Game sắp xếp câu
- **user_progress**: Tiến độ học tập (tùy chọn)

## 🔐 Bảo mật

Supabase sử dụng Row Level Security (RLS). Để cho phép đọc/ghi công khai (cho demo), bạn có thể:

1. Vào Supabase Dashboard → Authentication → Policies
2. Tạo policies cho phép SELECT, INSERT, UPDATE, DELETE cho tất cả tables

Hoặc tạm thời disable RLS cho development (không khuyến nghị cho production).

## 📝 Lưu ý

- File `.env` không được commit lên Git (đã có trong `.gitignore`)
- Anon Key là công khai, nhưng vẫn nên bảo mật
- Production nên sử dụng Service Role Key cho backend operations

