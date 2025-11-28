# Jisho API CORS Fix

## Vấn đề
Jisho API bị chặn bởi CORS policy khi gọi trực tiếp từ browser.

## Giải pháp
Đã thêm Vite proxy để bypass CORS trong development mode.

## Cách sử dụng

### 1. Restart Dev Server
Bạn cần **RESTART** dev server để Vite proxy hoạt động:

```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó chạy lại:
npm run dev
```

### 2. Kiểm tra
- Trong development: API sẽ gọi qua `/api/jisho/words` (proxy local)
- Trong production: API sẽ gọi trực tiếp hoặc qua public proxy

## Cấu hình

### vite.config.ts
```typescript
server: {
  proxy: {
    '/api/jisho': {
      target: 'https://jisho.org',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/jisho/, '/api/v1/search'),
      secure: false,
    }
  }
}
```

### jishoService.ts
- Tự động detect development/production mode
- Development: dùng proxy local
- Production: dùng public proxy (allorigins, thingproxy, codetabs)

## Lưu ý
- **Phải restart server** sau khi thay đổi vite.config.ts
- Proxy chỉ hoạt động trong development mode
- Production build cần deploy với proxy backend hoặc dùng public proxy
