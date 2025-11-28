# ✅ Quick Fix Checklist - Làm ngay để thấy kết quả!

## 🚀 Bước 1: Hard Refresh Browser (BẮT BUỘC!)

**Windows/Linux:**
```
Ctrl + Shift + R
```
hoặc
```
Ctrl + F5
```

**Mac:**
```
Cmd + Shift + R
```

## 🔍 Bước 2: Kiểm tra Theme

1. Mở trang bất kỳ (ví dụ: Luyện Viết Kanji)
2. Click nút theme toggle ở header (icon mặt trời/mặt trăng)
3. Background phải thay đổi:
   - Light mode: Xám nhạt
   - Dark mode: Xanh đen đậm

## ✨ Bước 3: Kiểm tra các trang

Mở từng trang và verify:

- [ ] Trang chủ - Background đúng theme
- [ ] Khóa học - Background đúng theme
- [ ] Từ điển - Background đúng theme
- [ ] Luyện viết Kanji - Background đúng theme
- [ ] Ôn tập SRS - Background đúng theme
- [ ] Luyện tập từ vựng - Background đúng theme

## 🐛 Nếu vẫn thấy background tối:

### Option 1: Clear Cache Hoàn Toàn
1. Mở DevTools (F12)
2. Right-click nút Reload
3. Chọn "Empty Cache and Hard Reload"

### Option 2: Restart Dev Server
```bash
# Stop server (Ctrl + C)
npm run dev
# hoặc
yarn dev
```

### Option 3: Clear Vite Cache
```bash
rm -rf node_modules/.vite
npm run dev
```

## 🎯 Kết quả mong đợi:

### Light Mode:
- ✅ Background: Xám nhạt (#f8fafc)
- ✅ Cards: Trắng (#ffffff)
- ✅ Text: Đen đậm (#111827)
- ✅ Header: Trắng với shadow nhẹ

### Dark Mode:
- ✅ Background: Xanh đen đậm (#0a0f1e)
- ✅ Cards: Xanh xám (#1e293b)
- ✅ Text: Trắng sáng (#f8fafc)
- ✅ Header: Xanh xám với shadow

## 📸 So sánh:

### Trước (Sai):
- ❌ Background tối cứng (#111827 hoặc #1f2937)
- ❌ Không thay đổi khi toggle theme
- ❌ Khó đọc chữ

### Sau (Đúng):
- ✅ Background theo theme
- ✅ Thay đổi mượt mà khi toggle
- ✅ Dễ đọc, đẹp mắt

## 🎊 Done!

Nếu đã làm đúng các bước trên, theme sẽ hoạt động 100%!
