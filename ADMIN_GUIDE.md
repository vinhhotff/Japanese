# 📚 Hướng Dẫn Sử Dụng Admin Panel - Dành Cho Người Mới Bắt Đầu

## 🎯 Tổng Quan

Admin Panel là công cụ để bạn quản lý nội dung học tập cho ứng dụng học tiếng Nhật và tiếng Trung. Bạn có thể thêm, sửa, xóa các khóa học, bài học, từ vựng, kanji/hán tự, ngữ pháp, bài nghe, game và roleplay.

## 🚀 Bắt Đầu Nhanh

### Bước 1: Đăng nhập
- Đăng nhập vào hệ thống với tài khoản admin
- Truy cập trang Admin Panel

### Bước 2: Tạo Khóa Học
1. Click tab **"Khóa học"**
2. Click nút **"➕ Thêm mới"**
3. Chọn ngôn ngữ (Tiếng Nhật hoặc Tiếng Trung)
4. Chọn cấp độ (N5-N1 cho tiếng Nhật, HSK1-HSK6 cho tiếng Trung)
5. Nhập tiêu đề và mô tả
6. Click **"Lưu"**

### Bước 3: Tạo Bài Học
1. Click tab **"Bài học"**
2. Click nút **"➕ Thêm mới"**
3. Chọn ngôn ngữ (phải khớp với ngôn ngữ của khóa học)
4. Chọn khóa học
5. Nhập tiêu đề, số bài học, cấp độ
6. Click **"Lưu"**

### Bước 4: Thêm Từ Vựng
1. Click tab **"Từ vựng"**
2. Click nút **"➕ Thêm mới"**
3. Chọn **"➕ Thêm từng từ"** (dễ cho người mới) hoặc **"📋 Import hàng loạt"** (nhanh hơn)
4. Điền thông tin và lưu

## 📖 Hướng Dẫn Chi Tiết Từng Phần

### 1. Khóa Học (Courses)

**Mục đích:** Tạo các khóa học theo cấp độ

**Các trường:**
- **Ngôn ngữ** (bắt buộc): Chọn Tiếng Nhật hoặc Tiếng Trung
- **Cấp độ** (bắt buộc): 
  - Tiếng Nhật: N5 (dễ nhất) → N1 (khó nhất)
  - Tiếng Trung: HSK1 (dễ nhất) → HSK6 (khó nhất)
- **Tiêu đề** (bắt buộc): Tên khóa học
- **Mô tả** (tùy chọn): Mô tả về khóa học

**Ví dụ:**
- Tiêu đề: "Tiếng Nhật N5 - Cơ bản"
- Mô tả: "Khóa học dành cho người mới bắt đầu, bao gồm các bài học về chào hỏi, giới thiệu bản thân, số đếm..."

---

### 2. Bài Học (Lessons)

**Mục đích:** Tạo các bài học trong khóa học

**Các trường:**
- **Ngôn ngữ** (bắt buộc): Phải khớp với ngôn ngữ của khóa học
- **Khóa học** (bắt buộc): Chọn khóa học mà bài học này thuộc về
- **Tiêu đề** (bắt buộc): Tên bài học
- **Số bài** (bắt buộc): Số thứ tự trong khóa học (bắt đầu từ 1)
- **Cấp độ** (bắt buộc): Thường giống với cấp độ của khóa học
- **Mô tả** (tùy chọn): Mô tả về bài học

**Lưu ý:** Phải tạo khóa học trước khi tạo bài học!

---

### 3. Từ Vựng (Vocabulary)

**Mục đích:** Thêm từ vựng vào bài học

**Có 2 cách thêm:**

#### Cách 1: Thêm Từng Từ (Dễ cho người mới)

**Cho Tiếng Nhật:**
- **Từ (Hiragana)** (bắt buộc): Ví dụ: こんにちは
- **Kanji** (tùy chọn): Ví dụ: 今日は
- **Hiragana** (bắt buộc): Giống với "Từ" nếu không có Kanji
- **Nghĩa** (bắt buộc): Nghĩa tiếng Việt
- **Ví dụ** (tùy chọn): Câu ví dụ
- **Dịch ví dụ** (tùy chọn): Dịch câu ví dụ

**Cho Tiếng Trung:**
- **Hán tự giản thể** (bắt buộc): Ví dụ: 你好
- **Hán tự phồn thể** (tùy chọn): Để trống nếu giống giản thể
- **Pinyin** (bắt buộc): Ví dụ: nǐ hǎo
- **Nghĩa** (bắt buộc): Nghĩa tiếng Việt

#### Cách 2: Import Hàng Loạt (Nhanh hơn)

**Format cho Tiếng Nhật:**
```
kanji=hiragana=nghĩa
hoặc
hiragana=nghĩa
```

**Ví dụ:**
```
私=わたし=Tôi
学生=がくせい=Học sinh
こんにちは=Xin chào
```

**Format cho Tiếng Trung:**
```
hanzi=pinyin=nghĩa
```

**Ví dụ:**
```
你好=nǐ hǎo=Xin chào
谢谢=xiè xie=Cảm ơn
再见=zài jiàn=Tạm biệt
```

**💡 Mẹo:** Bạn có thể nhờ AI (ChatGPT, Claude...) tạo danh sách từ vựng theo format trên, sau đó copy và dán vào ô "Import hàng loạt".

---

### 4. Kanji/Hán Tự

**Mục đích:** Thêm kanji (tiếng Nhật) hoặc hán tự (tiếng Trung) vào bài học

**Có 2 cách thêm:**

#### Cách 1: Thêm Từng Kanji/Hán Tự

**Cho Tiếng Nhật:**
- **Kanji** (bắt buộc): Ví dụ: 学
- **Nghĩa** (bắt buộc): Ví dụ: Học
- **Âm On** (tùy chọn): Cách đọc onyomi, cách nhau bằng dấu phẩy. Ví dụ: ガク, ガッ
- **Âm Kun** (tùy chọn): Cách đọc kunyomi, cách nhau bằng dấu phẩy. Ví dụ: まなぶ
- **Số nét** (tùy chọn): Số nét viết. Ví dụ: 8

**Cho Tiếng Trung:**
- **Hán tự** (bắt buộc): Ví dụ: 学
- **Nghĩa** (bắt buộc): Ví dụ: Học
- **Pinyin** (tùy chọn): Ví dụ: xué
- **Bộ thủ** (tùy chọn): Ví dụ: 子
- **Số nét** (tùy chọn): Số nét viết. Ví dụ: 8

#### Cách 2: Import Hàng Loạt

**Format cho Tiếng Nhật:**
```
kanji=nghĩa
hoặc
kanji=nghĩa=onyomi1|onyomi2=kunyomi1|kunyomi2=số_nét
```

**Ví dụ:**
```
学=Học
校=Trường học=コウ|=がっこう=10
```

**Format cho Tiếng Trung:**
```
hanzi=nghĩa
hoặc
hanzi=nghĩa=pinyin=bộ_thủ=số_nét
```

**Ví dụ:**
```
学=Học=xué=子=8
习=Ôn tập=xí=乙=3
```

---

### 5. Ngữ Pháp (Grammar)

**Mục đích:** Thêm các mẫu ngữ pháp vào bài học

**Các trường:**
- **Pattern** (bắt buộc): Mẫu ngữ pháp. Ví dụ: 〜たいです
- **Nghĩa** (bắt buộc): Ý nghĩa tiếng Việt. Ví dụ: Muốn làm gì đó
- **Giải thích** (tùy chọn): Cách dùng chi tiết
- **Ví dụ** (tùy chọn): Thêm các câu ví dụ

**Import hàng loạt:**
```
pattern=nghĩa
hoặc
pattern=nghĩa=giải_thích
```

**Ví dụ:**
```
〜たいです=Muốn làm gì đó
〜てください=Hãy làm gì đó=Diễn tả yêu cầu lịch sự
〜てもいいです=Có thể làm gì đó
```

---

### 6. Bài Nghe (Listening)

**Mục đích:** Tạo bài tập nghe hiểu

**Các trường:**
- **Tiêu đề** (bắt buộc): Tên bài nghe
- **Audio URL** (tùy chọn): Link file audio hoặc upload file
- **Hình ảnh** (tùy chọn): Upload hình ảnh minh họa
- **Transcript** (bắt buộc): Nội dung bài nghe bằng tiếng Nhật/Trung
- **Câu hỏi**: Thêm các câu hỏi trắc nghiệm
  - Câu hỏi
  - 4 đáp án (A, B, C, D)
  - Chọn đáp án đúng (0=A, 1=B, 2=C, 3=D)

**💡 Mẹo:** Bạn có thể nhờ AI tạo bài nghe + câu hỏi dạng JSON, sau đó dán vào ô "Dán JSON" và click "Parse JSON" để tự động điền form.

---

### 7. Game Sắp Xếp Câu

**Mục đích:** Tạo game để học sinh sắp xếp các từ thành câu đúng

**Các trường:**
- **Câu** (bắt buộc): Câu tiếng Nhật/Trung đã tách từ bằng khoảng trắng
- **Nghĩa** (bắt buộc): Nghĩa tiếng Việt
- **Từ** (bắt buộc): Các từ trong câu, cách nhau bằng dấu phẩy
- **Thứ tự đúng** (bắt buộc): Thứ tự đúng của các từ (số, cách nhau bằng dấu phẩy)

**Ví dụ:**
- Câu: `私 は 学生 です`
- Nghĩa: `Tôi là học sinh`
- Từ: `私, は, 学生, です`
- Thứ tự đúng: `0, 1, 2, 3`

**Import hàng loạt:**
```
câu_đã_tách_từ=nghĩa
```

**Ví dụ:**
```
私 は 学生 です=Tôi là học sinh
これは 本 です=Đây là quyển sách
```

---

### 8. Roleplay

**Mục đích:** Tạo kịch bản hội thoại để học sinh luyện tập

**Các trường:**
- **Tiêu đề** (bắt buộc): Tên kịch bản
- **Mô tả** (tùy chọn): Mô tả ngắn
- **Tình huống** (bắt buộc): Mô tả tình huống roleplay
- **Nhân vật A** (bắt buộc): Tên nhân vật thứ nhất
- **Nhân vật B** (bắt buộc): Tên nhân vật thứ hai
- **Lời thoại A** (bắt buộc): Các câu nói của nhân vật A, mỗi câu một dòng
- **Lời thoại B** (bắt buộc): Các câu nói của nhân vật B, mỗi câu một dòng
- **Từ vựng gợi ý** (tùy chọn): Các từ vựng cần dùng, cách nhau bằng dấu phẩy
- **Điểm ngữ pháp** (tùy chọn): Các mẫu ngữ pháp, cách nhau bằng dấu phẩy
- **Độ khó**: Dễ, Trung bình, Khó
- **Hình ảnh** (tùy chọn): Upload hình ảnh minh họa

**💡 Mẹo:** Bạn có thể nhờ AI tạo kịch bản roleplay dạng JSON, sau đó dán vào ô "Dán JSON" và click "Parse JSON" để tự động điền form.

---

## 🎯 Quy Trình Làm Việc Khuyến Nghị

1. **Tạo Khóa Học** → Chọn ngôn ngữ và cấp độ
2. **Tạo Bài Học** → Thêm các bài học vào khóa học
3. **Thêm Từ Vựng** → Thêm từ vựng cho từng bài học
4. **Thêm Kanji/Hán Tự** → Thêm các ký tự cho bài học
5. **Thêm Ngữ Pháp** → Thêm các mẫu ngữ pháp
6. **Thêm Bài Nghe** → Tạo bài tập nghe (tùy chọn)
7. **Thêm Game** → Tạo game sắp xếp câu (tùy chọn)
8. **Thêm Roleplay** → Tạo kịch bản hội thoại (tùy chọn)

---

## 💡 Mẹo Và Lưu Ý

### Mẹo Chung:
- ✅ Luôn chọn đúng ngôn ngữ (Tiếng Nhật hoặc Tiếng Trung)
- ✅ Tạo khóa học và bài học trước khi thêm từ vựng, kanji, ngữ pháp
- ✅ Dùng "Import hàng loạt" để thêm nhiều mục cùng lúc (nhanh hơn)
- ✅ Xem preview trước khi lưu để kiểm tra
- ✅ Dùng AI để tạo nội dung nhanh hơn (xem hướng dẫn trong form)

### Lưu Ý:
- ⚠️ Ngôn ngữ phải khớp giữa khóa học, bài học và nội dung
- ⚠️ Phải chọn bài học trước khi thêm từ vựng, kanji, ngữ pháp
- ⚠️ Nếu có lỗi, đọc thông báo lỗi và sửa theo hướng dẫn
- ⚠️ Format import phải đúng, nếu sai sẽ có thông báo lỗi

### Sử Dụng AI:
1. Click nút **"Hướng dẫn"** ở đầu trang Admin
2. Xem hướng dẫn cho từng loại nội dung
3. Copy prompt mẫu và gửi cho AI (ChatGPT, Claude, etc.)
4. Copy kết quả và dán vào form
5. Kiểm tra và chỉnh sửa nếu cần

---

## ❓ Câu Hỏi Thường Gặp

**Q: Tôi không thấy bài học trong danh sách khi thêm từ vựng?**
A: Kiểm tra xem bạn đã chọn đúng ngôn ngữ chưa. Danh sách chỉ hiển thị bài học cùng ngôn ngữ.

**Q: Làm sao để thêm nhiều từ vựng nhanh?**
A: Dùng chức năng "Import hàng loạt", nhập theo format và xem preview trước khi lưu.

**Q: Tôi có thể dùng AI để tạo nội dung không?**
A: Có! Xem hướng dẫn trong form hoặc click nút "Hướng dẫn" để xem prompt mẫu cho AI.

**Q: Format import bị sai, làm sao sửa?**
A: Xem thông báo lỗi, nó sẽ chỉ ra dòng nào bị sai. Sửa theo format đúng và thử lại.

**Q: Tôi muốn xem lại hướng dẫn?**
A: Click nút **"Hướng dẫn"** ở đầu trang Admin Panel, chọn loại nội dung bạn cần.

---

## 📞 Hỗ Trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi:
1. Xem lại hướng dẫn trong form (click nút "Hướng dẫn")
2. Đọc thông báo lỗi cẩn thận
3. Kiểm tra format import có đúng không
4. Đảm bảo đã tạo khóa học và bài học trước

---

**Chúc bạn sử dụng Admin Panel thành công! 🎉**


