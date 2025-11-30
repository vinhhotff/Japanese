# Dashboard V2 - Hướng Dẫn Xem

## ✅ Đã Cập Nhật

Tôi đã cập nhật App.tsx để sử dụng Dashboard V2 mới với:
- ✅ Import `DashboardNew.v2.tsx`
- ✅ Import CSS: `dashboard-v2.css`, `assignments.css`, `grading.css`
- ✅ Thêm routes cho Assignments

## 🎨 Tính Năng Dashboard V2

### 1. Chữ Bay Lơ Lửng
- **12 chữ Nhật/Trung** bay lơ lửng trên background
- Animation mượt mà 20-29s
- Tự động đổi theo ngôn ngữ được chọn

### 2. Language Selector
- 🇯🇵 **Tiếng Nhật** - Hiển thị N5-N1
- 🇨🇳 **Tiếng Trung** - Hiển thị HSK1-HSK6
- Click để chuyển đổi

### 3. Quick Stats
- 📚 1000+ Từ vựng
- ✍️ 500+ Chữ viết
- 🤖 AI Trợ giảng
- 🎯 100% Miễn phí

### 4. Courses Grid
- Hiển thị courses theo level
- Màu sắc khác nhau cho mỗi level
- Hover effect đẹp mắt
- Progress bar

### 5. Features Grid
- Từ điển
- Luyện từ vựng
- Luyện viết
- Chat AI
- Roleplay
- Ôn tập

## 🚀 Cách Xem

### Bước 1: Refresh Trình Duyệt
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Bước 2: Mở Trang Chủ
```
http://localhost:5173/
```

### Bước 3: Xem Tính Năng
1. **Chữ bay lơ lửng** - Nhìn background, bạn sẽ thấy chữ Nhật bay nhẹ nhàng
2. **Language selector** - Click vào 🇯🇵 hoặc 🇨🇳 để đổi
3. **Courses** - Scroll xuống xem danh sách khóa học
4. **Features** - Scroll tiếp để xem các tính năng

## 🐛 Nếu Không Thấy Thay Đổi

### 1. Clear Cache
```bash
# Xóa cache trình duyệt
Ctrl + Shift + Delete
```

### 2. Hard Reload
```bash
# Reload lại dev server
npm run dev
```

### 3. Check Console
```
F12 → Console tab
Xem có lỗi gì không
```

## 📊 Dữ Liệu Hiện Tại

**Lưu ý:** Dashboard V2 sử dụng `supabaseService.v2` với phân trang.

Nếu chưa có dữ liệu:
1. Chạy migrations trong Supabase
2. Thêm sample courses với `language` field
3. Refresh lại trang

## 🎯 Routes Mới

```
/                           → Dashboard V2 (với chữ bay)
/japanese/courses           → Khóa học Tiếng Nhật
/chinese/courses            → Khóa học Tiếng Trung
/assignments                → Danh sách bài tập
/assignments/:id            → Chi tiết bài tập
/my-assignments             → Bài tập của tôi
/admin/grading/:id          → Chấm điểm (Admin)
```

## 🎨 CSS Classes Chính

```css
.floating-characters        → Container chữ bay
.float-char                 → Mỗi chữ bay
.language-selector          → Nút chọn ngôn ngữ
.lang-btn                   → Button Japanese/Chinese
.levels-grid                → Grid courses
.level-card                 → Card mỗi level
```

## 💡 Tips

### Customize Chữ Bay
Sửa trong `dashboard-v2.css`:
```css
.float-char {
  font-size: 3rem;        /* Kích thước chữ */
  opacity: 0.08;          /* Độ mờ */
  animation-duration: 20s; /* Tốc độ bay */
}
```

### Thay Đổi Màu Level
Sửa trong `DashboardNew.v2.tsx`:
```typescript
const levelColors: Record<string, string> = {
  'N5': '#10b981',  // Green
  'N4': '#3b82f6',  // Blue
  // ...
};
```

### Thêm Chữ Bay
Thêm trong JSX:
```tsx
<span className="float-char char-13">新</span>
```

Và CSS:
```css
.float-char.char-13 { 
  top: 30%; 
  left: 70%; 
  animation-delay: 6s; 
}
```

## 📸 Screenshot Checklist

Khi xem Dashboard V2, bạn nên thấy:
- ✅ Chữ Nhật/Trung bay lơ lửng mờ mờ
- ✅ 2 nút lớn: 🇯🇵 Tiếng Nhật | 🇨🇳 Tiếng Trung
- ✅ 4 stat cards (1000+ từ vựng, etc.)
- ✅ Grid courses với màu sắc khác nhau
- ✅ Grid features (6 cards)
- ✅ Hover effects mượt mà

## 🔧 Troubleshooting

### Lỗi: "getCourses is not a function"
→ Service v2 chưa được import đúng
→ Check: `import { getCourses } from '../services/supabaseService.v2'`

### Lỗi: "Cannot read property 'data'"
→ API trả về null/undefined
→ Check: Database có courses chưa?

### Chữ không bay
→ CSS chưa load
→ Check: `import '../styles/dashboard-v2.css'` trong component

### Không thấy courses
→ Chưa có data hoặc language filter sai
→ Check: Courses trong DB có field `language` chưa?

---

**Tóm tắt:** Dashboard V2 đã sẵn sàng! Refresh trình duyệt và xem chữ bay lơ lửng đẹp mắt! 🎉
