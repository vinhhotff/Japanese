# Hướng dẫn Format Code

## Cài đặt

Chạy lệnh sau để cài đặt Prettier:

```bash
npm install
```

## Sử dụng

### Format tất cả file

```bash
npm run format
```

### Kiểm tra format (không thay đổi file)

```bash
npm run format:check
```

## Tự động format khi save (VS Code)

1. Cài đặt extension "Prettier - Code formatter"
2. Thêm vào `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[css]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Các thay đổi đã thực hiện

### CSS Improvements

1. **lesson-detail-premium.css**: Thêm CSS cho các button, tab, và section
2. **lesson-list-premium.css**: Tạo mới file CSS cho danh sách bài học
3. **learning-sections-premium.css**: Cải thiện CSS cho các section học tập

### Component Updates

1. **LessonDetail.tsx**: Cập nhật để sử dụng CSS classes thay vì inline styles
2. **LessonListNew.tsx**: Import CSS mới

### Features

- Tự động format code với Prettier
- Animation mượt mà hơn
- Responsive design tốt hơn
- Dark mode support
- Hover effects và transitions
