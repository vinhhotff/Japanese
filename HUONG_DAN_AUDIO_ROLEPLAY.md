# 🎧 Hướng Dẫn Sử Dụng Audio và Roleplay

## 📋 Tổng quan

Đã thêm các tính năng mới:
1. **Audio với ảnh và đáp án**: Listening exercises có thể có ảnh và hiển thị đáp án
2. **Upload file**: Có thể upload audio và image files
3. **Roleplay**: Chức năng nhập vai để luyện tập giao tiếp

## 🗄️ Database Migration

### Bước 1: Chạy Migration

Vào Supabase Dashboard → SQL Editor và chạy file `supabase/migration_add_listening_image_roleplay.sql`:

```sql
-- Add image_url to listening_exercises
ALTER TABLE listening_exercises 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create roleplay_scenarios table
CREATE TABLE IF NOT EXISTS roleplay_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scenario TEXT NOT NULL,
  character_a VARCHAR(255) NOT NULL,
  character_b VARCHAR(255) NOT NULL,
  character_a_script TEXT[],
  character_b_script TEXT[],
  vocabulary_hints TEXT[],
  grammar_points TEXT[],
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎧 Listening Exercises - Cải thiện

### Tính năng mới:
- ✅ Thêm ảnh cho listening exercise
- ✅ Hiển thị đáp án (có thể ẩn/hiện)
- ✅ Đánh dấu đáp án đúng/sai
- ✅ Upload audio file
- ✅ Upload image file

### Cách sử dụng trong Admin:
1. Vào Admin Panel → Tab "🎧 Nghe"
2. Click "➕ Thêm mới"
3. Điền thông tin:
   - **Title**: Tiêu đề bài nghe
   - **Audio URL**: URL của file audio (hoặc upload file)
   - **Image URL**: URL của ảnh (hoặc upload file)
   - **Transcript**: Nội dung transcript
   - **Questions**: Thêm câu hỏi với đáp án

## 🎭 Roleplay - Nhập vai

### Tính năng:
- ✅ Tạo kịch bản roleplay với 2 nhân vật
- ✅ Script cho từng nhân vật
- ✅ Gợi ý từ vựng và ngữ pháp
- ✅ Luyện tập từng câu một
- ✅ Phát âm và nghe lại
- ✅ Upload ảnh cho kịch bản

### Cách tạo Roleplay trong Admin:
1. Vào Admin Panel → Tab "🎭 Roleplay" (sẽ được thêm)
2. Click "➕ Thêm mới"
3. Điền thông tin:
   - **Title**: Tên kịch bản
   - **Description**: Mô tả tình huống
   - **Scenario**: Mô tả tình huống chi tiết
   - **Character A**: Tên nhân vật A (ví dụ: "Bạn", "Khách hàng")
   - **Character B**: Tên nhân vật B (ví dụ: "Nhân viên", "Bạn bè")
   - **Character A Script**: Mảng các câu của nhân vật A
   - **Character B Script**: Mảng các câu của nhân vật B
   - **Vocabulary Hints**: Gợi ý từ vựng
   - **Grammar Points**: Điểm ngữ pháp
   - **Difficulty**: Độ khó
   - **Image URL**: Ảnh minh họa

### Ví dụ kịch bản:
- **Title**: "Đặt bàn tại nhà hàng"
- **Character A**: "Khách hàng"
- **Character B**: "Nhân viên"
- **Character A Script**: ["Xin chào", "Tôi muốn đặt bàn cho 2 người", "Cảm ơn"]
- **Character B Script**: ["Xin chào, chào mừng đến nhà hàng", "Vâng, để tôi kiểm tra", "Đã đặt xong"]

## 📤 Upload Files

### Cách upload file lên Supabase Storage:

1. Vào Supabase Dashboard → **Storage**
2. Tạo bucket mới (nếu chưa có):
   - Tên: `audio-files` (cho audio)
   - Tên: `images` (cho images)
   - Public: ✅ Bật ON
3. Upload file vào bucket
4. Copy URL của file
5. Dán URL vào form trong Admin Panel

### Hoặc sử dụng Supabase Storage API:
```javascript
// Upload file example (cần implement trong code)
const file = event.target.files[0];
const fileExt = file.name.split('.').pop();
const fileName = `${Math.random()}.${fileExt}`;
const filePath = `${fileName}`;

const { error: uploadError } = await supabase.storage
  .from('audio-files')
  .upload(filePath, file);

if (uploadError) {
  alert(uploadError.message);
} else {
  const { data } = supabase.storage
    .from('audio-files')
    .getPublicUrl(filePath);
  // Use data.publicUrl
}
```

## 🎯 Sử dụng trong Lesson

### Listening:
- Hiển thị ảnh (nếu có)
- Phát audio
- Hiển thị transcript
- Làm bài tập với đáp án

### Roleplay:
- Chọn kịch bản
- Đóng vai nhân vật A hoặc B
- Đọc từng câu
- Nhập câu trả lời
- Xem gợi ý từ vựng/ngữ pháp
- Nghe phát âm

## 📝 Lưu ý

1. **File size**: Giới hạn kích thước file (audio: ~10MB, image: ~5MB)
2. **File format**: 
   - Audio: MP3, WAV, OGG
   - Image: JPG, PNG, WebP
3. **Storage**: Đảm bảo Supabase Storage đã được setup
4. **Permissions**: Bucket phải public để có thể truy cập từ frontend

## ✅ Đã hoàn thành

- [x] Upload file component trong AdminPanel (audio và image)
- [x] Thêm tab Roleplay vào AdminPanel
- [x] Tích hợp Roleplay vào LessonDetail
- [x] CSS styling cho các component mới
- [x] Form quản lý roleplay scenarios
- [x] Form listening với upload file và questions

