# Hướng dẫn thay thế Emoji bằng SVG Icons

## ✅ Đã hoàn thành:
- [x] Tạo Icons Library (`src/components/icons/Icons.tsx`)
- [x] Cập nhật SpacedRepetition component

## 📋 Danh sách thay thế:

### Flags:
- `🇯🇵` → `<JapanFlag size={24} />`
- `🇨🇳` → `<ChinaFlag size={24} />`

### Education:
- `📚` → `<BookIcon size={24} />`
- `📖` → `<DictionaryIcon size={24} />`
- `📝` → `<NotebookIcon size={24} />`
- `🎓` → `<GraduationIcon size={24} />`
- `🏫` → `<SchoolIcon size={24} />`

### People:
- `👥` → `<UsersIcon size={24} />`

### AI & Tech:
- `🤖` → `<RobotIcon size={24} />`
- `💬` → `<MessageIcon size={24} />`
- `🎭` → `<TheaterIcon size={24} />`

### Status:
- `✅` → `<CheckIcon size={24} />`
- `❌` → `<XIcon size={24} />`
- `⚠️` → `<AlertIcon size={24} />`
- `🎉` → `<CelebrationIcon size={24} />`
- `🔒` → `<LockIcon size={24} />`

### Actions:
- `➕` → `<PlusIcon size={24} />`
- `🚪` → `<LogoutIcon size={24} />`
- `🔗` → `<LinkIcon size={24} />`
- `⭐` → `<StarIcon size={24} />`
- `🔊` → `<VolumeIcon size={24} />`
- `📊` → `<ChartIcon size={24} />`

## 🔧 Cách sử dụng:

### 1. Import icons vào component:
```tsx
import { JapanFlag, ChinaFlag, BookIcon, CheckIcon } from './icons/Icons';
```

### 2. Thay thế emoji:
```tsx
// Trước:
<div>🇯🇵 Tiếng Nhật</div>

// Sau:
<div><JapanFlag size={24} /> Tiếng Nhật</div>
```

### 3. Tùy chỉnh:
```tsx
// Thay đổi size
<BookIcon size={32} />

// Thay đổi màu
<CheckIcon color="#10b981" />

// Thêm className
<AlertIcon className="my-custom-class" />
```

## 📁 Files cần cập nhật:

### Priority 1 (Quan trọng):
- [ ] `src/components/DashboardNew.v2.tsx`
- [ ] `src/components/CourseCatalog.tsx`
- [ ] `src/components/dashboards/StudentDashboard.tsx`
- [ ] `src/components/dashboards/TeacherDashboard.tsx`
- [ ] `src/components/AdminPanel.tsx`

### Priority 2:
- [ ] `src/components/AllCourses.tsx`
- [ ] `src/components/LessonDetail.tsx`
- [ ] `src/components/AIConversation.tsx`
- [ ] `src/components/DictionaryResult.tsx`
- [ ] `src/components/GradingInterface.tsx`

### Priority 3:
- [ ] Các components còn lại

## 💡 Tips:

1. **Inline styles**: Nếu emoji có fontSize, chuyển thành size prop
   ```tsx
   // Trước: <span style={{ fontSize: '2rem' }}>🇯🇵</span>
   // Sau: <JapanFlag size={32} />
   ```

2. **Flexbox alignment**: Icons tự động align với text
   ```tsx
   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
     <BookIcon size={20} />
     <span>Khóa học</span>
   </div>
   ```

3. **Color inheritance**: Icons sử dụng `currentColor` nên sẽ kế thừa màu text
   ```tsx
   <div style={{ color: '#ef4444' }}>
     <AlertIcon size={24} /> {/* Sẽ có màu đỏ */}
   </div>
   ```

## 🎨 Lợi ích:

- ✅ Consistent design across all platforms
- ✅ Scalable without quality loss
- ✅ Easy to customize (size, color)
- ✅ Better accessibility
- ✅ Smaller bundle size
- ✅ Professional appearance
