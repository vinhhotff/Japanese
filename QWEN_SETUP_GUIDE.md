# 🚀 Hướng dẫn cấu hình Qwen AI (Alibaba Cloud)

## 🎯 Tại sao chọn Qwen?

- ✅ **Miễn phí**: Hạn mức cao, đủ dùng cho học tập
- ✅ **Nhanh**: Phản hồi trong 1-2 giây
- ✅ **Thông minh**: Model mới nhất của Alibaba
- ✅ **Hỗ trợ tiếng Nhật tốt**: Được train trên dữ liệu đa ngôn ngữ
- ✅ **Ít bị chặn**: Safety filter thoải mái hơn Gemini
- ✅ **Ổn định**: Ít downtime, server mạnh

## 📝 Hướng dẫn từng bước

### **Bước 1: Tạo tài khoản Alibaba Cloud**

1. Truy cập: https://www.aliyun.com/
2. Click **Free Account** (Tài khoản miễn phí)
3. Đăng ký bằng email hoặc số điện thoại
4. Xác thực tài khoản

### **Bước 2: Kích hoạt DashScope (Qwen API)**

1. Đăng nhập vào Alibaba Cloud Console
2. Truy cập: https://dashscope.aliyun.com/
3. Click **开通服务** (Kích hoạt dịch vụ)
4. Chọn gói **免费试用** (Dùng thử miễn phí)

### **Bước 3: Lấy API Key**

1. Vào **API-KEY管理**: https://dashscope.console.aliyun.com/apiKey
2. Click **创建新的API-KEY** (Tạo API Key mới)
3. Đặt tên cho key (ví dụ: "Japanese Learning App")
4. Copy API key (bắt đầu bằng `sk-`)

### **Bước 4: Cấu hình trong ứng dụng**

Mở file `.env.local` và thêm:

```env
# Qwen API Key
VITE_QWEN_API_KEY=sk-your-actual-qwen-api-key-here

# Đặt AI Provider là qwen
VITE_AI_PROVIDER=qwen
```

### **Bước 5: Khởi động lại ứng dụng**

```bash
npm run dev
```

### **Bước 6: Kiểm tra hoạt động**

1. Vào trang **AI Conversation** hoặc **AI Roleplay**
2. Chọn tình huống và bắt đầu trò chuyện
3. AI sẽ phản hồi bằng tiếng Nhật với bản dịch tiếng Việt

## 🎯 Ưu điểm của Qwen so với các AI khác

| Tính năng | Qwen | Gemini | DeepSeek | OpenAI |
|-----------|------|---------|----------|---------|
| **Miễn phí** | ✅ Cao | ✅ Thấp | ❌ Trả phí | ❌ Trả phí |
| **Tốc độ** | ⚡ Rất nhanh | 🐌 Chậm | ⚡ Nhanh | ⚡ Nhanh |
| **Tiếng Nhật** | ✅ Tốt | ✅ Tốt | ✅ Xuất sắc | ✅ Xuất sắc |
| **Safety Filter** | 😊 Thoải mái | 😤 Nghiêm ngặt | 😊 Thoải mái | 😐 Vừa phải |
| **Ổn định** | ✅ Cao | ⚠️ Thỉnh thoảng lỗi | ✅ Cao | ✅ Cao |
| **Hạn mức miễn phí** | 🎯 1M tokens/tháng | 🎯 60 requests/phút | ❌ Không | ❌ Không |

## 🔧 Troubleshooting

### **Lỗi "Invalid API key"**
- Kiểm tra API key có đúng format `sk-...`
- Đảm bảo không có khoảng trắng thừa
- Kiểm tra key có được kích hoạt chưa

### **Lỗi "Service not activated"**
- Vào https://dashscope.aliyun.com/ 
- Click **开通服务** để kích hoạt
- Chọn gói miễn phí

### **Lỗi "Quota exceeded"**
- Kiểm tra usage tại: https://dashscope.console.aliyun.com/usage
- Đợi reset hàng tháng hoặc nâng cấp

### **AI không phản hồi**
- Kiểm tra console log để debug
- Thử refresh trang
- Kiểm tra kết nối internet

## 🌟 Mẹo sử dụng hiệu quả

### **1. Tối ưu prompt:**
```javascript
// Tốt
"Nhân viên nhà hàng Nhật. Trả lời ngắn gọn."

// Không tốt  
"Bạn là một nhân viên phục vụ tại nhà hàng Nhật Bản rất thân thiện và lịch sự..."
```

### **2. Sử dụng fallback:**
Ứng dụng đã cấu hình tự động chuyển sang Gemini nếu Qwen lỗi.

### **3. Monitor usage:**
Kiểm tra usage định kỳ để không bị vượt hạn mức.

## 🎉 Kết luận

**Qwen là lựa chọn tuyệt vời** cho ứng dụng học tiếng Nhật:
- Miễn phí với hạn mức cao
- Nhanh và ổn định  
- Hỗ trợ tiếng Nhật tốt
- Ít bị chặn bởi safety filter

**Bắt đầu ngay với Qwen để có trải nghiệm học tập tốt nhất!** 🚀