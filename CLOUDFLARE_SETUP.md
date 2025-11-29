# Hướng dẫn cấu hình Cloudflare Workers AI

Cloudflare Workers AI là dịch vụ AI **MIỄN PHÍ** và mạnh mẽ, hỗ trợ nhiều model như Llama, Qwen, v.v.

## Bước 1: Tạo tài khoản Cloudflare

1. Truy cập: https://dash.cloudflare.com/sign-up
2. Đăng ký tài khoản miễn phí (chỉ cần email)
3. Xác nhận email

## Bước 2: Lấy Account ID

1. Đăng nhập vào https://dash.cloudflare.com/
2. Chọn **Workers & Pages** từ menu bên trái
3. Chọn tab **AI**
4. Copy **Account ID** (dạng: `abc123def456...`)

## Bước 3: Tạo API Token

1. Vẫn ở trang Workers AI, click **Create API Token**
2. Hoặc vào: https://dash.cloudflare.com/profile/api-tokens
3. Click **Create Token**
4. Chọn template **Edit Cloudflare Workers**
5. Hoặc tạo Custom Token với quyền:
   - Account > Workers AI > Read
   - Account > Workers AI > Edit
6. Click **Continue to summary** > **Create Token**
7. Copy token (chỉ hiện 1 lần, lưu lại!)

## Bước 4: Cấu hình trong project

Mở file `.env.local` và thêm:

```env
VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id_here
VITE_CLOUDFLARE_API_TOKEN=your_api_token_here
VITE_AI_PROVIDER=cloudflare
```

## Bước 5: Khởi động lại dev server

```bash
npm run dev
```

## Models có sẵn (miễn phí)

- `@cf/meta/llama-3.1-8b-instruct` - Llama 3.1 (mặc định)
- `@cf/qwen/qwen1.5-14b-chat` - Qwen 1.5 (tốt cho tiếng Nhật)
- `@cf/mistral/mistral-7b-instruct-v0.1` - Mistral 7B
- Và nhiều model khác...

## Ưu điểm

✅ **Hoàn toàn miễn phí** (10,000 requests/day)
✅ Không cần thẻ tín dụng
✅ Tốc độ nhanh (edge network toàn cầu)
✅ Nhiều model AI mạnh mẽ
✅ Hỗ trợ tiếng Nhật tốt

## Lưu ý

- Giới hạn: 10,000 requests/ngày (đủ dùng)
- Nếu vượt quota, app sẽ tự động fallback sang Gemini
- Token cần quyền Workers AI Read + Edit

## Tài liệu

- Docs: https://developers.cloudflare.com/workers-ai/
- Models: https://developers.cloudflare.com/workers-ai/models/
- Dashboard: https://dash.cloudflare.com/
