# 🔐 Hướng Dẫn Setup Authentication

## Bước 1: Tạo Admin User trong Supabase

1. Vào Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Nhập thông tin:
   - **Email**: `admin@japanese-learning.com` (hoặc email bạn muốn)
   - **Password**: Đặt mật khẩu mạnh
   - **Auto Confirm User**: Bật ON
4. Click "Create user"

## Bước 2: Cấu hình Admin Role (Tùy chọn)

### Cách 1: Sử dụng Email Pattern (Đơn giản)
Mặc định, hệ thống sẽ coi user có email chứa "admin" là admin.

### Cách 2: Sử dụng User Metadata (Khuyến nghị)
1. Vào Supabase Dashboard → Authentication → Users
2. Click vào user admin
3. Vào tab "Raw App Meta Data"
4. Thêm:
```json
{
  "role": "admin"
}
```

Hoặc chỉnh sửa trong code `src/contexts/AuthContext.tsx`:
```typescript
const isAdmin = user ? (
  user.email?.includes('admin') || 
  user.user_metadata?.role === 'admin' ||
  user.email === 'admin@japanese-learning.com'
) : false;
```

## Bước 3: Test Login

1. Chạy ứng dụng: `npm run dev`
2. Vào `/login`
3. Đăng nhập với email và password đã tạo
4. Nếu đúng admin, sẽ được chuyển đến `/admin`

## 🔒 Bảo mật

### Row Level Security (RLS)
Để bảo mật dữ liệu, bạn nên bật RLS cho các tables:

1. Vào Supabase Dashboard → Table Editor
2. Chọn từng table → Settings → Enable RLS
3. Tạo policies:

**Policy cho SELECT (đọc công khai):**
```sql
CREATE POLICY "Public read access" ON courses
FOR SELECT USING (true);
```

**Policy cho INSERT/UPDATE/DELETE (chỉ admin):**
```sql
CREATE POLICY "Admin write access" ON courses
FOR ALL USING (
  auth.jwt() ->> 'email' LIKE '%admin%'
  OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);
```

## 📝 Lưu ý

- User thường không cần đăng nhập để sử dụng app
- Chỉ admin mới cần đăng nhập để vào trang quản lý
- Session được lưu tự động, không cần đăng nhập lại mỗi lần
- Có thể đăng xuất bằng nút "Đăng xuất" trong trang admin

## 🛠️ Troubleshooting

**Lỗi: "Bạn không có quyền truy cập trang admin"**
- Kiểm tra email có chứa "admin" hoặc user_metadata.role = "admin"
- Hoặc chỉnh logic trong `AuthContext.tsx`

**Lỗi: "Invalid login credentials"**
- Kiểm tra email và password
- Đảm bảo user đã được tạo trong Supabase Auth

**Session không lưu:**
- Kiểm tra `persistSession: true` trong `supabase.ts`
- Xóa cache trình duyệt và thử lại

