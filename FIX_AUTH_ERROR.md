# 🔧 Hướng Dẫn Sửa Lỗi "Invalid API key" và 401 Unauthorized

## 🔍 Nguyên nhân lỗi

Lỗi **"Invalid API key"** và **401 Unauthorized** xảy ra khi:
1. ✅ Supabase URL hoặc Anon Key không đúng
2. ✅ API Key bị thiếu hoặc bị cắt ngắn
3. ✅ User chưa được tạo trong Supabase Auth
4. ✅ Supabase project chưa được setup đúng

## 🛠️ Cách sửa

### Bước 1: Kiểm tra Supabase Project

1. Vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Settings** → **API**

### Bước 2: Lấy đúng API Keys

Trong trang API settings, bạn sẽ thấy:

1. **Project URL**: 
   - Ví dụ: `https://xxxxx.supabase.co`
   - Copy toàn bộ URL này

2. **anon/public key**:
   - Đây là key dài (thường > 200 ký tự)
   - JWT token đầy đủ sẽ có 3 phần cách nhau bởi dấu chấm (.)
   - Ví dụ: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODI4MzgsImV4cCI6MjA3Mzg1ODgzOH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **QUAN TRỌNG**: Copy TOÀN BỘ key, không được thiếu ký tự nào

### Bước 3: Cập nhật file .env

1. Mở file `.env` trong thư mục gốc
2. Cập nhật với giá trị đúng:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODI4MzgsImV4cCI6MjA3Mzg1ODgzOH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Lưu ý:**
- Không có khoảng trắng thừa
- Không có dấu ngoặc kép
- Key phải đầy đủ, không được cắt ngắn

### Bước 4: Tạo Admin User

1. Vào Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Nhập:
   - **Email**: `admin@japanese-learning.com` (hoặc email bạn muốn)
   - **Password**: Đặt mật khẩu mạnh
   - **Auto Confirm User**: ✅ Bật ON
4. Click **"Create user"**

### Bước 5: Restart Dev Server

Sau khi cập nhật `.env`:

```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó chạy lại:
npm run dev
```

**QUAN TRỌNG**: Vite chỉ đọc `.env` khi khởi động, nên phải restart!

### Bước 6: Kiểm tra lại

1. Mở browser console (F12)
2. Kiểm tra không còn lỗi về Supabase URL/Key
3. Thử đăng nhập lại

## ⚠️ Lưu ý quan trọng

1. **API Key phải đầy đủ**: JWT token có 3 phần, thiếu một phần sẽ bị lỗi
2. **Restart server**: Sau khi sửa `.env`, bắt buộc phải restart
3. **Kiểm tra trong Console**: Xem có warning về Supabase config không
4. **User phải tồn tại**: Đảm bảo đã tạo user trong Supabase Auth

## 🐛 Debug

Nếu vẫn lỗi, kiểm tra trong browser console:

```javascript
// Chạy trong console để kiểm tra
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

Nếu thấy `undefined` hoặc giá trị không đúng → `.env` chưa được load đúng.

## ✅ Checklist

- [ ] Supabase URL đúng và đầy đủ
- [ ] Anon Key đầy đủ (không bị cắt)
- [ ] File `.env` ở thư mục gốc
- [ ] Đã restart dev server sau khi sửa `.env`
- [ ] Đã tạo admin user trong Supabase Auth
- [ ] Email user có chứa "admin" hoặc có role="admin" trong metadata

