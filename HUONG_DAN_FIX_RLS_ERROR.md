# 🔒 Hướng dẫn sửa lỗi "new row violates row-level security policy"

## ❌ Lỗi gặp phải:
```
Lỗi upload: new row violates row-level security policy
```

## 🔍 Nguyên nhân:
Lỗi này xảy ra khi Supabase Storage buckets có Row Level Security (RLS) được bật nhưng chưa có policies cho phép upload files.

## ✅ Giải pháp:

### Bước 1: Tạo Storage Buckets (nếu chưa có)

1. Vào **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Tạo 2 buckets:

   **Bucket 1: `audio-files`**
   - Name: `audio-files`
   - Public: ✅ **Bật ON** (quan trọng!)
   - File size limit: 50MB (hoặc tùy chỉnh)
   - Allowed MIME types: `audio/*` (hoặc để trống)

   **Bucket 2: `images`**
   - Name: `images`
   - Public: ✅ **Bật ON** (quan trọng!)
   - File size limit: 10MB (hoặc tùy chỉnh)
   - Allowed MIME types: `image/*` (hoặc để trống)

### Bước 2: Tạo RLS Policies

1. Vào **Supabase Dashboard** → **SQL Editor**
2. Copy toàn bộ nội dung từ file `supabase/storage_policies.sql`
3. Paste vào SQL Editor
4. Click **"Run"** để chạy

### Bước 3: Kiểm tra Policies đã được tạo

1. Vào **Supabase Dashboard** → **Storage** → Chọn bucket `audio-files`
2. Click tab **"Policies"**
3. Bạn sẽ thấy các policies:
   - ✅ Allow authenticated users to upload audio files
   - ✅ Allow authenticated users to list audio files
   - ✅ Allow authenticated users to delete audio files
   - ✅ Allow authenticated users to update audio files
   - ✅ Allow public to read audio files

4. Làm tương tự cho bucket `images`

### Bước 4: Test Upload

1. Đăng nhập vào Admin Panel
2. Thử upload một file audio hoặc image
3. Nếu vẫn còn lỗi, kiểm tra:
   - ✅ Bạn đã đăng nhập chưa? (phải là authenticated user)
   - ✅ Buckets đã được set là Public chưa?
   - ✅ Policies đã được tạo chưa?

## 🔧 Nếu vẫn còn lỗi:

### Kiểm tra lại Policies:

Chạy query sau trong SQL Editor để xem các policies hiện tại:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

### Xóa và tạo lại Policies (nếu cần):

Nếu policies bị lỗi, bạn có thể xóa và tạo lại:

```sql
-- Xóa tất cả policies của storage.objects
DROP POLICY IF EXISTS "Allow authenticated users to upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to list audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read audio files" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to list images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read images" ON storage.objects;
```

Sau đó chạy lại file `supabase/storage_policies.sql`.

## 📝 Lưu ý quan trọng:

1. **Buckets phải là PUBLIC**: Nếu buckets không public, frontend không thể truy cập files
2. **Phải đăng nhập**: Chỉ authenticated users (admins) mới có thể upload files
3. **File size limits**: Kiểm tra giới hạn kích thước file trong bucket settings
4. **MIME types**: Đảm bảo file types được phép upload

## ✅ Sau khi hoàn thành:

- ✅ Admins có thể upload audio và images
- ✅ Public users có thể xem/nghe files trên frontend
- ✅ Không còn lỗi RLS khi upload

