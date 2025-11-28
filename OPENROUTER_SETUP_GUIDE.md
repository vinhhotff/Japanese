# 🚀 Hướng dẫn cấu hình OpenRouter AI

## 🎯 Tại sao chọn OpenRouter?

- ✅ **Miễn phí**: $1 credit miễn phí khi đăng ký
- ✅ **Nhiều AI models**: Truy cập Qwen, Claude, GPT, Llama, v.v.
- ✅ **API thống nhất**: Một API key cho tất cả models
- ✅ **Nhanh**: Phản hồi trong 1-2 giây
- ✅ **Ổn định**: Infrastructure mạnh mẽ
- ✅ **Hỗ trợ tiếng Nhật tốt**: Qwen model xuất sắc

## 📝 Hướng dẫn từng bước

### **Bước 1: Tạo tài khoản OpenRouter**

1. Truy cập: https://openrouter.ai/
2. Click **Sign Up** (Đăng ký)
3. Đăng ký bằng email hoặc GitHub
4. Xác thực email

### **Bước 2: Lấy API Key**

1. Đăng nhập vào OpenRouter
2. Vào **Keys**: https://openrouter.ai/keys
3. Click **Create Key**
4. Đặt tên cho key (ví dụ: "Japanese Learning App")
5. Copy API key (bắt đầu bằng `sk-or-v1-`)

### **Bước 3: Nhận $1 credit miễn phí**

1. Vào **Credits**: https://openrouter.ai/credits
2. Làm theo hướng dẫn để nhận $1 miễn phí
3. $1 = khoảng 1000-2000 requests (đủ dùng lâu!)

### **Bước 4: Cấu hình trong ứng dụng**

File `.env.local` đã được cấu hình sẵn:

```env
# OpenRouter API Key
VITE_OPENROUTER_API_KEY=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

# AI Provider
VITE_AI_PROVIDER=openrouter
```

### **Bước 5: Khởi động lại ứng dụng**

```bash
npm run dev
```

### **Bước 6: Kiểm tra hoạt động**

1. Vào trang **AI Conversation** hoặc **AI Roleplay**
2. Chọn tình huống và bắt đầu trò chuyện
3. AI sẽ phản hồi bằng tiếng Nhật với bản dịch tiếng Việt

## 🎯 Models được sử dụng

### **Hiện tại: Qwen 2.5 Coder 32B**
- **Model**: `qwen/qwen-2.5-coder-32b-instruct`
- **Miễn phí**: ✅ Có
- **Chất lượng**: ⭐⭐⭐⭐⭐ Xuất sắc
- **Tiếng Nhật**: ✅ Rất tốt
- **Tốc độ**: ⚡ Nhanh

### **Các models khác có thể thử:**
```javascript
// Trong aiService.ts, đổi model:
model: 'qwen/qwen-2.5-72b-instruct', // Thông minh hơn
model: 'anthropic/claude-3-haiku', // Nhanh, ngắn gọn
model: 'meta-llama/llama-3.1-8b-instruct', // Miễn phí
```

## 📊 So sánh với các AI khác

| Tính năng | OpenRouter | Gemini | DeepSeek | OpenAI |
|-----------|------------|---------|----------|---------|
| **Miễn phí** | ✅ $1 credit | ✅ Hạn chế | ❌ Trả phí | ❌ Trả phí |
| **Số models** | 🎯 100+ | 🎯 1 | 🎯 1 | 🎯 3-4 |
| **Tốc độ** | ⚡ Rất nhanh | 🐌 Chậm | ⚡ Nhanh | ⚡ Nhanh |
| **Tiếng Nhật** | ✅ Xuất sắc | ✅ Tốt | ✅ Xuất sắc | ✅ Xuất sắc |
| **Safety Filter** | 😊 Thoải mái | 😤 Nghiêm ngặt | 😊 Thoải mái | 😐 Vừa phải |
| **Ổn định** | ✅ Cao | ⚠️ Thỉnh thoảng lỗi | ✅ Cao | ✅ Cao |

## 💰 Chi phí sử dụng

### **$1 credit miễn phí có thể:**
- 🎯 **1000-2000 requests** với Qwen
- 🎯 **500-1000 requests** với Claude
- 🎯 **2000-5000 requests** với Llama

### **Ước tính sử dụng:**
- **Học 1 giờ/ngày**: ~50 requests
- **$1 credit**: Đủ dùng 20-40 ngày
- **Sau đó**: Nạp thêm $5-10 (rất rẻ)

## 🔧 Troubleshooting

### **Lỗi "Invalid API key"**
- Kiểm tra API key có đúng format `sk-or-v1-...`
- Đảm bảo không có khoảng trắng thừa
- Tạo key mới nếu cần

### **Lỗi "Insufficient credits"**
- Kiểm tra balance tại: https://openrouter.ai/credits
- Nạp thêm credits hoặc đợi reset

### **Lỗi "Model not found"**
- Kiểm tra model name trong code
- Thử model khác nếu model hiện tại không khả dụng

### **AI không phản hồi**
- Kiểm tra console log để debug
- Thử refresh trang
- Kiểm tra kết nối internet

## 🌟 Mẹo sử dụng hiệu quả

### **1. Chọn model phù hợp:**
```javascript
// Cho học tiếng Nhật
'qwen/qwen-2.5-coder-32b-instruct' // Tốt nhất

// Cho trò chuyện thông thường  
'meta-llama/llama-3.1-8b-instruct' // Rẻ nhất

// Cho phân tích phức tạp
'anthropic/claude-3-haiku' // Thông minh nhất
```

### **2. Tối ưu prompt:**
- Ngắn gọn, rõ ràng
- Tránh từ ngữ phức tạp
- Sử dụng context phù hợp

### **3. Monitor usage:**
Kiểm tra usage tại https://openrouter.ai/activity

## 🎉 Kết luận

**OpenRouter là lựa chọn tuyệt vời** cho ứng dụng học tiếng Nhật:
- ✅ Miễn phí $1 credit
- ✅ Truy cập nhiều AI models mạnh
- ✅ Nhanh, ổn định, chất lượng cao
- ✅ Hỗ trợ tiếng Nhật xuất sắc
- ✅ Auto-fallback sang Gemini nếu lỗi

**Bắt đầu ngay với OpenRouter để có trải nghiệm AI tốt nhất!** 🚀

---

## 🔗 Links hữu ích

- **OpenRouter Homepage**: https://openrouter.ai/
- **API Keys**: https://openrouter.ai/keys
- **Credits & Billing**: https://openrouter.ai/credits
- **Models List**: https://openrouter.ai/models
- **API Documentation**: https://openrouter.ai/docs