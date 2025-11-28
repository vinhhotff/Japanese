# 🚀 Hướng dẫn cấu hình DeepSeek AI

## 1. Tạo tài khoản DeepSeek

1. Truy cập: https://platform.deepseek.com/
2. Đăng ký tài khoản miễn phí
3. Xác thực email

## 2. Lấy API Key

1. Đăng nhập vào https://platform.deepseek.com/
2. Vào mục **API Keys**: https://platform.deepseek.com/api_keys
3. Click **Create API Key**
4. Đặt tên cho key (ví dụ: "Japanese Learning App")
5. Copy API key (bắt đầu bằng `sk-`)

## 3. Cấu hình trong ứng dụng

Mở file `.env.local` và cập nhật:

```env
# DeepSeek API Key
VITE_DEEPSEEK_API_KEY=sk-bac29538337248c981d629d6bb4ca07f

# Đặt AI Provider là deepseek
VITE_AI_PROVIDER=deepseek
```

## 4. Khởi động lại ứng dụng

```bash
npm run dev
```

## 5. Kiểm tra hoạt động

- Vào trang **AI Conversation** hoặc **AI Roleplay**
- Chọn tình huống và bắt đầu trò chuyện
- AI sẽ phản hồi bằng tiếng Nhật với bản dịch tiếng Việt

## 🎯 Ưu điểm của DeepSeek

- ✅ **Miễn phí**: Hạn mức sử dụng cao
- ✅ **Nhanh**: Phản hồi trong 1-2 giây
- ✅ **Thông minh**: Hiểu ngữ cảnh tốt
- ✅ **Ít bị chặn**: Không có safety filter nghiêm ngặt như Gemini
- ✅ **Hỗ trợ tiếng Nhật**: Rất tốt cho học ngôn ngữ

## 🔧 Troubleshooting

### Lỗi "API key không hợp lệ"
- Kiểm tra API key có đúng format `sk-...`
- Đảm bảo không có khoảng trắng thừa
- Tạo key mới nếu cần

### Lỗi "Rate limit exceeded"
- Đợi 1 phút rồi thử lại
- DeepSeek có giới hạn requests/phút

### AI không phản hồi
- Kiểm tra kết nối internet
- Xem console log để debug
- Thử refresh trang

## 📊 So sánh với các AI khác

| Tính năng | DeepSeek | Gemini | OpenAI |
|-----------|----------|---------|---------|
| Miễn phí | ✅ Cao | ✅ Thấp | ❌ Trả phí |
| Tốc độ | ⚡ Nhanh | 🐌 Chậm | ⚡ Nhanh |
| Tiếng Nhật | ✅ Tốt | ✅ Tốt | ✅ Xuất sắc |
| Safety Filter | 😊 Thoải mái | 😤 Nghiêm ngặt | 😐 Vừa phải |

**Khuyến nghị**: Sử dụng DeepSeek cho học tiếng Nhật vì miễn phí, nhanh và ít bị chặn!