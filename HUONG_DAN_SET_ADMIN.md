# 🔧 Hướng Dẫn Set Admin Role

## Vấn đề: "Bạn không có quyền truy cập trang admin"

Lỗi này xảy ra khi email của bạn không được nhận diện là admin.

## ✅ Cách 1: Sử dụng email có chứa "admin" (Đơn giản nhất)

Tạo user với email có chứa từ "admin":

1. Vào Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Nhập:
   - **Email**: `admin@japanese-learning.com` hoặc `admin@gmail.com` hoặc bất kỳ email nào có chứa "admin"
   - **Password**: Đặt mật khẩu
   - **Auto Confirm User**: ✅ Bật ON
4. Click **"Create user"**

**Lưu ý**: Email phải có chứa từ "admin" (không phân biệt hoa thường)

## ✅ Cách 2: Set role trong User Metadata (Khuyến nghị)

1. Vào Supabase Dashboard → **Authentication** → **Users**
2. Tìm và click vào user bạn muốn set làm admin
3. Scroll xuống phần **"Raw App Meta Data"** hoặc **"User Metadata"**
4. Click **"Edit"** hoặc **"Add metadata"**
5. Thêm:
```json
{
  "role": "admin"
}
```
6. Click **"Save"**

## ✅ Cách 3: Sửa code để thêm email cụ thể

Nếu bạn muốn dùng email khác, sửa file `src/contexts/AuthContext.tsx`:

```typescript
const isAdmin = user ? (
  user.email?.toLowerCase().includes('admin') || 
  user.user_metadata?.role === 'admin' ||
  user.email?.toLowerCase() === 'admin@japanese-learning.com' ||
  user.email?.toLowerCase() === 'your-email@gmail.com' // 👈 Thêm email của bạn ở đây
) : false;
```

## 🔍 Debug: Kiểm tra user hiện tại

Mở browser console (F12) và chạy:

```javascript
// Xem user hiện tại
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
console.log('Email:', user?.email);
console.log('Metadata:', user?.user_metadata);
console.log('Is admin check:', 
  user?.email?.toLowerCase().includes('admin') || 
  user?.user_metadata?.role === 'admin'
);
```

## 📝 Checklist

- [ ] Email có chứa "admin" HOẶC
- [ ] User metadata có `role: "admin"` HOẶC  
- [ ] Email được thêm vào danh sách admin trong code
- [ ] Đã đăng xuất và đăng nhập lại sau khi set role

## ⚠️ Lưu ý

- Sau khi set role trong metadata, cần **đăng xuất và đăng nhập lại**
- Email check không phân biệt hoa thường (toLowerCase)
- Có thể dùng bất kỳ email nào, chỉ cần có chứa "admin" hoặc set role trong metadata

