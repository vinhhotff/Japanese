-- ============================================
-- SUPABASE STORAGE RLS POLICIES
-- ============================================
-- File này chứa các policies để cho phép upload files vào Supabase Storage
-- Chạy file này trong Supabase SQL Editor sau khi tạo buckets

-- ============================================
-- 1. POLICIES CHO BUCKET 'audio-files'
-- ============================================

-- Cho phép authenticated users (admins) upload audio files
CREATE POLICY "Allow authenticated users to upload audio files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-files' AND
  (storage.foldername(name))[1] IS NULL OR
  (storage.foldername(name))[1] = ''
);

-- Cho phép authenticated users xem danh sách files
CREATE POLICY "Allow authenticated users to list audio files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'audio-files');

-- Cho phép authenticated users xóa files
CREATE POLICY "Allow authenticated users to delete audio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'audio-files');

-- Cho phép authenticated users cập nhật files
CREATE POLICY "Allow authenticated users to update audio files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'audio-files');

-- Cho phép public (mọi người) đọc files (để có thể phát audio trên frontend)
CREATE POLICY "Allow public to read audio files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio-files');

-- ============================================
-- 2. POLICIES CHO BUCKET 'images'
-- ============================================

-- Cho phép authenticated users (admins) upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (
    (storage.foldername(name))[1] IS NULL OR
    (storage.foldername(name))[1] = '' OR
    (storage.foldername(name))[1] = 'roleplay' OR
    (storage.foldername(name))[1] = 'listening'
  )
);

-- Cho phép authenticated users xem danh sách images
CREATE POLICY "Allow authenticated users to list images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'images');

-- Cho phép authenticated users xóa images
CREATE POLICY "Allow authenticated users to delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- Cho phép authenticated users cập nhật images
CREATE POLICY "Allow authenticated users to update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

-- Cho phép public (mọi người) đọc images (để hiển thị trên frontend)
CREATE POLICY "Allow public to read images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

-- ============================================
-- LƯU Ý:
-- ============================================
-- 1. Đảm bảo buckets 'audio-files' và 'images' đã được tạo trong Supabase Dashboard
-- 2. Buckets phải được set là PUBLIC để có thể truy cập từ frontend
-- 3. Sau khi chạy file này, admins (authenticated users) sẽ có thể upload files
-- 4. Mọi người (public) sẽ có thể đọc files để hiển thị trên frontend

