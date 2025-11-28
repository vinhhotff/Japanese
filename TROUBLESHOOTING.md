# Troubleshooting - UI về như ban đầu

## Vấn đề:
UI hiển thị như ban đầu mặc dù đã fix theme.

## Nguyên nhân có thể:
1. Browser cache chưa clear
2. Dev server chưa reload đúng
3. CSS chưa được compile lại
4. React chưa re-render

## Giải pháp:

### Bước 1: Hard Refresh Browser
**Windows/Linux:**
- Chrome/Edge: `Ctrl + Shift + R` hoặc `Ctrl + F5`
- Firefox: `Ctrl + Shift + R`

**Mac:**
- Chrome/Edge: `Cmd + Shift + R`
- Firefox: `Cmd + Shift + R`
- Safari: `Cmd + Option + R`

### Bước 2: Clear Browser Cache
1. Mở DevTools (F12)
2. Right-click vào nút Reload
3. Chọn "Empty Cache and Hard Reload"

### Bước 3: Restart Dev Server
```bash
# Stop server (Ctrl + C)
# Then restart
npm run dev
# hoặc
yarn dev
```

### Bước 4: Clear Vite Cache (nếu dùng Vite)
```bash
# Delete .vite cache folder
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

### Bước 5: Kiểm tra Console
1. Mở DevTools (F12)
2. Vào tab Console
3. Xem có lỗi CSS không load không

### Bước 6: Kiểm tra Network
1. Mở DevTools (F12)
2. Vào tab Network
3. Filter "CSS"
4. Reload page
5. Xem các file CSS có load không

## Kiểm tra nhanh:

### 1. Kiểm tra CSS Variables
Mở DevTools Console và chạy:
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--bg-color')
```
Kết quả phải là: `#f8fafc` (light mode) hoặc `#0a0f1e` (dark mode)

### 2. Kiểm tra Theme Context
```javascript
localStorage.getItem('theme')
```
Kết quả: `"light"` hoặc `"dark"`

### 3. Kiểm tra data-theme attribute
```javascript
document.documentElement.getAttribute('data-theme')
```
Kết quả: `"light"` hoặc `"dark"`

## Nếu vẫn không được:

### Option 1: Force reload tất cả
```bash
# Stop dev server
# Clear all caches
rm -rf node_modules/.vite
rm -rf dist

# Restart
npm run dev
```

### Option 2: Kiểm tra file imports
Đảm bảo các file CSS được import đúng thứ tự trong main.tsx hoặc App.tsx:
```typescript
import './index.css'
import './App.css'
import './components/Header.css'
```

### Option 3: Kiểm tra ThemeProvider
Đảm bảo ThemeProvider wrap toàn bộ app trong App.tsx:
```typescript
<ThemeProvider>
  <AuthProvider>
    <Router>
      <Layout>
        {/* routes */}
      </Layout>
    </Router>
  </AuthProvider>
</ThemeProvider>
```

## Checklist:
- [ ] Hard refresh browser (Ctrl + Shift + R)
- [ ] Clear browser cache
- [ ] Restart dev server
- [ ] Check console for errors
- [ ] Check network tab for CSS files
- [ ] Verify CSS variables in DevTools
- [ ] Check theme in localStorage
- [ ] Check data-theme attribute

## Nếu tất cả đều đúng:
Có thể là do Kiro IDE format lại file và làm mất một số thay đổi. Hãy:
1. Check git diff để xem file nào bị thay đổi
2. Re-apply các thay đổi nếu cần
