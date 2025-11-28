# 🤖 Hướng dẫn cấu hình AI cho ứng dụng học tiếng Nhật

## 🎯 Tình huống hiện tại
DeepSeek đã hết credit miễn phí. Chúng ta có các lựa chọn sau:

## 🔥 **Khuyến nghị: Sử dụng Gemini (Đã cấu hình sẵn)**

### ✅ Ưu điểm:
- **Miễn phí** với hạn mức cao
- **Đã có API key** trong dự án
- **Hỗ trợ tiếng Nhật tốt**
- **Đã được tối ưu** để tránh bị chặn

### 🚀 Cách sử dụng:
Gemini đã được cấu hình sẵn trong `.env.local`:
```env
VITE_AI_PROVIDER=gemini
VITE_GEMINI_API_KEY=AIzaSyBNajZ3f3X9DzY6hFIMw0D_BbkMLUnLQK0
```

**Không cần làm gì thêm!** Khởi động lại ứng dụng:
```bash
npm run dev
```

---

## 🆓 **Lựa chọn 2: Hugging Face (Hoàn toàn miễn phí)**

### ✅ Ưu điểm:
- **Hoàn toàn miễn phí**
- **Không giới hạn requests**
- **Nhiều model để chọn**

### 📝 Cách cấu hình:

1. **Tạo tài khoản**: https://huggingface.co/join
2. **Lấy token**: https://huggingface.co/settings/tokens
3. **Cập nhật .env.local**:
```env
VITE_HUGGINGFACE_API_KEY=hf_your_token_here
VITE_AI_PROVIDER=huggingface
```

---

## 💰 **Lựa chọn 3: Nạp tiền DeepSeek**

### 💳 Cách nạp tiền:
1. Vào https://platform.deepseek.com/console/billing
2. Click **Add Credits**
3. Nạp tối thiểu $5 (khoảng 120k VND)
4. Đổi lại provider:
```env
VITE_AI_PROVIDER=deepseek
```

---

## 🔧 **Cấu hình tự động fallback**

Ứng dụng đã được cấu hình để:
1. **Thử DeepSeek** trước (nếu có credit)
2. **Tự động chuyển sang Gemini** nếu DeepSeek lỗi
3. **Hiển thị thông báo** rõ ràng cho người dùng

---

## 📊 **So sánh các AI Provider**

| Provider | Miễn phí | Chất lượng | Tốc độ | Tiếng Nhật | Khuyến nghị |
|----------|----------|------------|---------|------------|-------------|
| **Gemini** | ✅ Cao | ⭐⭐⭐⭐ | ⚡ Nhanh | ✅ Tốt | 🏆 **Tốt nhất** |
| Hugging Face | ✅ Không giới hạn | ⭐⭐⭐ | 🐌 Chậm | ⚠️ Trung bình | 🆓 Backup |
| DeepSeek | ❌ Trả phí | ⭐⭐⭐⭐⭐ | ⚡ Rất nhanh | ✅ Xuất sắc | 💰 Nếu có tiền |
| OpenAI | ❌ Trả phí | ⭐⭐⭐⭐⭐ | ⚡ Nhanh | ✅ Xuất sắc | 💰 Đắt nhất |

---

## 🎯 **Khuyến nghị cuối cùng**

### 🥇 **Cho người dùng thông thường:**
Sử dụng **Gemini** (đã cấu hình sẵn) - Miễn phí, tốt, đủ dùng!

### 🥈 **Cho người muốn hoàn toàn miễn phí:**
Thêm **Hugging Face** làm backup

### 🥉 **Cho người có ngân sách:**
Nạp tiền **DeepSeek** ($5) để có trải nghiệm tốt nhất

---

## 🚀 **Bắt đầu ngay**

1. **Khởi động lại ứng dụng**: `npm run dev`
2. **Vào AI Roleplay** hoặc **AI Conversation**
3. **Chọn tình huống** và bắt đầu trò chuyện
4. **AI sẽ phản hồi** bằng tiếng Nhật với bản dịch

**Gemini đã sẵn sàng hoạt động!** 🎉