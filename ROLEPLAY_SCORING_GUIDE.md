# 🎭 Hướng dẫn sử dụng Roleplay với hệ thống đánh giá

## 📋 Tổng quan

Hệ thống Roleplay 3D cho phép học viên:
- Chọn vai diễn (Nhân vật A hoặc B)
- Tương tác với avatar 3D
- Được đánh giá tự động dựa trên câu trả lời mẫu do admin cấu hình

## 🗄️ Cài đặt Database

### Bước 1: Chạy Migration
Vào Supabase SQL Editor và chạy file:
```
database/migrations/add_roleplay_scoring.sql
```

### Bước 2: Kiểm tra cấu trúc bảng
Bảng `roleplay_scenarios` cần có các cột:
- `character_a_correct_answers` (jsonb): Mảng các câu trả lời đúng cho nhân vật A
- `character_b_correct_answers` (jsonb): Mảng các câu trả lời đúng cho nhân vật B
- `enable_scoring` (boolean): Bật/tắt chế độ đánh giá

## 👨‍💼 Hướng dẫn cho Admin

### Tạo Roleplay Scenario mới

1. Vào **Admin Panel** → Tab **Roleplay**
2. Click **➕ Thêm mới**
3. Điền thông tin cơ bản:
   - Tiêu đề
   - Mô tả
   - Tình huống
   - Độ khó (Dễ/Trung bình/Khó)

4. **Bật chế độ đánh giá** (checkbox):
   - ✅ Bật: Học viên sẽ được đánh giá tự động
   - ❌ Tắt: Chỉ luyện tập tự do

5. **Cấu hình Nhân vật A**:
   - Tên nhân vật (VD: Tanaka)
   - Thêm các câu thoại
   - Với mỗi câu, thêm **câu trả lời đúng**:
     - Có thể thêm nhiều đáp án cho 1 câu
     - VD: "こんにちは", "こんにちわ", "おはよう"

6. **Cấu hình Nhân vật B**: Tương tự nhân vật A

7. **Thêm gợi ý** (tùy chọn):
   - Từ vựng gợi ý
   - Ngữ pháp gợi ý

### Ví dụ cấu hình

**Nhân vật A - Câu 1:**
- Câu thoại: `こんにちは、田中です。`
- Đáp án đúng:
  - `こんにちは、田中です。`
  - `こんにちは、田中さんです。`
  - `こんにちわ、田中です。`

**Nhân vật B - Câu 1:**
- Câu thoại: `はじめまして、山田です。`
- Đáp án đúng:
  - `はじめまして、山田です。`
  - `初めまして、山田です。`

## 👨‍🎓 Hướng dẫn cho Học viên

### Chế độ 3D

1. **Chọn vai diễn**:
   - Click vào nhân vật A hoặc B
   - Avatar sẽ thay đổi theo nhân vật được chọn

2. **Xem câu thoại**:
   - Câu thoại hiện trên avatar (phụ đề)
   - Click 🔊 để nghe phát âm

3. **Nhập câu trả lời**:
   - Gõ câu trả lời bằng tiếng Nhật
   - Hoặc dùng 🎤 ghi âm (đang phát triển)

4. **Kiểm tra đáp án** (nếu bật scoring):
   - Click **✓ Kiểm tra đáp án**
   - Nhận feedback:
     - 🎉 **Chính xác**: +20 điểm
     - 👍 **Gần đúng**: +10 điểm
     - ❌ **Chưa đúng**: Xem câu trả lời mẫu

5. **Tiếp tục**:
   - Click **Tiếp →** để chuyển câu tiếp theo
   - Streak tăng khi trả lời đúng liên tiếp

### Các tính năng khác

- **💬 Phụ đề**: Bật/tắt hiển thị câu thoại
- **💡 Gợi ý**: Xem từ vựng và ngữ pháp gợi ý
- **😊 Cảm xúc**: Đổi biểu cảm avatar
- **📜 Lịch sử**: Xem các câu đã nói

## 🎯 Hệ thống điểm

- **Chính xác 100%**: +20 điểm, Streak +1
- **Gần đúng**: +10 điểm
- **Sai**: Streak reset về 0
- **Bonus**: Streak × 5 điểm khi hoàn thành

## 🔧 Troubleshooting

### Không thấy nút "Kiểm tra đáp án"
- Admin chưa bật `enable_scoring` cho scenario này
- Hoặc chưa cấu hình câu trả lời đúng

### Luôn báo sai dù đã đúng
- Kiểm tra lại câu trả lời mẫu trong Admin
- Đảm bảo có ít nhất 1 đáp án cho mỗi câu
- Hệ thống so sánh không phân biệt hoa thường

### Avatar không hiển thị
- Kiểm tra trình duyệt hỗ trợ Canvas
- Thử refresh trang

## 📊 Cấu trúc dữ liệu

### character_a_correct_answers / character_b_correct_answers
```json
[
  ["こんにちは", "こんにちわ"],  // Câu 1: 2 đáp án
  ["ありがとう"],                 // Câu 2: 1 đáp án
  ["はい", "ええ", "うん"]        // Câu 3: 3 đáp án
]
```

Mỗi phần tử là một mảng chứa các câu trả lời đúng cho câu thoại tương ứng.

## 🚀 Tính năng sắp tới

- [ ] Nhận diện giọng nói (Speech Recognition)
- [ ] Đánh giá phát âm
- [ ] Nhiều avatar 3D hơn
- [ ] Chế độ multiplayer
- [ ] Xuất báo cáo tiến độ

## 💡 Tips

1. **Cho Admin**:
   - Thêm nhiều đáp án để linh hoạt hơn
   - Bao gồm cả viết Hiragana và Kanji
   - Thêm các biến thể phổ biến

2. **Cho Học viên**:
   - Luyện tập nhiều lần để tăng streak
   - Sử dụng gợi ý khi cần
   - Nghe phát âm trước khi trả lời
