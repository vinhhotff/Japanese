# Remaining Fixes - Cards chưa ăn theme

## ✅ Đã fix:
1. ✅ LessonListNew - Removed wrapper div
2. ✅ AIRoleplay - Removed wrapper divs

## ⚠️ Cần fix tiếp:

### 1. Gradient backgrounds (decorative - có thể giữ):
Các cards này dùng gradient để highlight, có thể giữ lại:
- StudyProgress - Stats cards với gradient màu
- ProgressOverview - Stats cards với gradient màu
- LessonDetail - Header card với gradient tím
- Dashboard - Decorative elements
- AIConversation - Tip card với gradient vàng
- VoiceRecorder - Tip card với gradient vàng

### 2. Inline backgrounds cần fix:
Các background này NÊN dùng CSS variables:

**AdminPanel:**
- Pre tags: `background: '#f9fafb'` → `background: 'var(--bg-secondary)'`

**RoleplayAdminForm:**
- Script cards: `background: '#eff6ff'` → `background: 'var(--primary-light)'`
- Script cards: `background: '#fef3c7'` → `background: 'var(--warning-light)'`

## 🎯 Quyết định:

### Giữ lại (decorative):
- Gradient backgrounds cho stats cards (đẹp, dễ phân biệt)
- Gradient backgrounds cho header cards (highlight)
- Tip cards với gradient (thu hút attention)

### Fix (functional):
- Admin panel pre tags
- Form backgrounds
- Các background không phải decorative

## 📝 Script để fix hàng loạt:

```typescript
// Replace trong AdminPanel.tsx
background: '#f9fafb' → background: 'var(--bg-secondary)'

// Replace trong RoleplayAdminForm.tsx  
background: '#eff6ff' → background: 'var(--primary-light)'
background: '#fef3c7' → background: 'var(--warning-light)'
```

## 🎨 Kết luận:

Các gradient backgrounds cho stats và decorative elements NÊN GIỮ LẠI vì:
1. Chúng có mục đích highlight và phân biệt
2. Gradient không thay đổi theo theme (by design)
3. Chúng làm UI đẹp hơn và dễ đọc hơn

Chỉ cần fix các background FUNCTIONAL (form inputs, admin panels, etc.)
