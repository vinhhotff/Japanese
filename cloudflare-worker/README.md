# Cloudflare Worker - AI Proxy

Worker này giải quyết vấn đề CORS khi gọi Workers AI API từ browser.

## Cách deploy

### 1. Cài đặt Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login vào Cloudflare

```bash
wrangler login
```

### 3. Deploy worker

```bash
cd cloudflare-worker
wrangler deploy
```

### 4. Lấy Worker URL

Sau khi deploy, bạn sẽ nhận được URL dạng:
```
https://japanese-ai-proxy.your-subdomain.workers.dev
```

### 5. Cập nhật frontend

Mở file `src/services/aiService.ts`, tìm function `callCloudflare()` và thay đổi URL:

```typescript
// Thay vì gọi trực tiếp API
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
  ...
);

// Gọi qua Worker proxy
const response = await fetch(
  'https://japanese-ai-proxy.your-subdomain.workers.dev',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    })
  }
);
```

### 6. Không cần API Token nữa!

Khi dùng Worker, bạn không cần:
- ❌ VITE_CLOUDFLARE_ACCOUNT_ID
- ❌ VITE_CLOUDFLARE_API_TOKEN

Chỉ cần:
- ✅ Worker URL

## Ưu điểm

✅ Không bị CORS
✅ Không expose API token ra frontend
✅ Bảo mật hơn
✅ Hoạt động cả localhost và production

## Lưu ý

- Worker miễn phí: 100,000 requests/ngày
- Workers AI miễn phí: 10,000 requests/ngày
- Tổng cộng đủ dùng cho app học tiếng Nhật!
