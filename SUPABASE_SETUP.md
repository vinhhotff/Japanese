# Hướng dẫn Fix lỗi Supabase 403 - No API Key

## Vấn đề
Lỗi: `Failed to load resource: the server responded with a status of 403 ()`
Message: `"No API key found in request"`

## Nguyên nhân
1. Dev server chưa restart sau khi cập nhật `.env`
2. Supabase project bị tắt hoặc paused
3. API key không đúng hoặc đã expired

## Giải pháp

### Bước 1: Restart Dev Server
```bash
# Dừng server hiện tại (Ctrl + C)
# Sau đó chạy lại:
npm run dev
```

### Bước 2: Kiểm tra Supabase Project
1. Truy cập: https://supabase.com/dashboard
2. Chọn project: `pthcahjwttyaecejtplr`
3. Kiểm tra xem project có đang **Active** không
4. Nếu project bị **Paused**, click **Resume** để kích hoạt lại

### Bước 3: Kiểm tra API Keys
1. Vào **Settings** → **API**
2. Copy lại:
   - **Project URL**: `https://pthcahjwttyaecejtplr.supabase.co`
   - **anon/public key**: Key JWT dài
3. Cập nhật vào file `.env`:
```env
VITE_SUPABASE_URL=https://pthcahjwttyaecejtplr.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Bước 4: Clear Cache và Restart
```bash
# Xóa cache
rm -rf node_modules/.vite
# Hoặc trên Windows:
rmdir /s /q node_modules\.vite

# Restart dev server
npm run dev
```

## Kiểm tra kết nối
Mở Console trong Browser (F12) và chạy:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has API Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

Nếu thấy:
- `Supabase URL: https://pthcahjwttyaecejtplr.supabase.co`
- `Has API Key: true`

Thì config đã đúng!

## Lưu ý quan trọng
- **KHÔNG** commit file `.env` lên Git
- File `.env` phải ở thư mục gốc của project (cùng cấp với `package.json`)
- Sau khi thay đổi `.env`, **BẮT BUỘC** phải restart dev server
- Supabase free tier có thể tự động pause sau 1 tuần không hoạt động

## Nếu vẫn lỗi
1. Kiểm tra Network tab trong DevTools (F12)
2. Xem request nào bị 403
3. Check xem có header `apikey` trong request không
4. Nếu không có, nghĩa là env variables chưa được load

## Contact Support
Nếu vẫn không fix được, liên hệ Supabase support hoặc check:
- https://supabase.com/docs/guides/api
- https://supabase.com/docs/guides/getting-started
