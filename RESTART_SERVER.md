# Cần Restart Dev Server

## Vấn đề
CSS đã được cập nhật nhưng browser vẫn hiển thị màu cũ do cache.

## Giải pháp

### 1. Restart Dev Server (QUAN TRỌNG!)
```bash
# Trong terminal đang chạy npm run dev:
# Nhấn Ctrl+C để dừng
# Sau đó chạy lại:
npm run dev
```

### 2. Hard Refresh Browser
Sau khi restart server, hard refresh browser:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 3. Clear Browser Cache (nếu vẫn không được)
- Mở DevTools (F12)
- Right-click vào nút Refresh
- Chọn "Empty Cache and Hard Reload"

## Lý do
- Vite dev server có thể cache CSS cũ
- Browser cũng cache CSS
- Cần restart cả 2 để thấy thay đổi

## Kết quả mong đợi
Sau khi restart và refresh:
- Light mode: Background trắng/xám nhạt, text đen
- Dark mode: Background xám đậm, text trắng
- Tất cả màu tự động thay đổi theo theme
