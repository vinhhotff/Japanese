# 🎤 Thông tin về Voice Recognition

## Cách hoạt động hiện tại

Ứng dụng sử dụng **Web Speech API** của trình duyệt (không phải AI):

### 1. **Text-to-Speech (TTS)** - Phát âm
- Sử dụng `window.speechSynthesis` (có sẵn trong trình duyệt)
- Tự động chọn giọng tiếng Nhật tốt nhất
- Có thể chỉnh tốc độ, cao độ, âm lượng trong `src/utils/speech.ts`

### 2. **Speech Recognition** - Nhận diện giọng nói
- Sử dụng `SpeechRecognition` hoặc `webkitSpeechRecognition` API
- Chỉ hoạt động trên Chrome, Edge, Safari
- So sánh bằng thuật toán Levenshtein (so sánh ký tự)
- **KHÔNG phải AI**, chỉ so sánh chuỗi ký tự đơn giản

### Hạn chế:
- Độ chính xác phụ thuộc vào microphone và môi trường
- Không hiểu ngữ cảnh
- Chỉ so sánh chuỗi ký tự, không hiểu ý nghĩa

### Cải thiện có thể:
- Tích hợp AI voice recognition (Google Cloud Speech-to-Text, Azure Speech)
- Sử dụng machine learning để cải thiện độ chính xác
- Thêm phoneme comparison (so sánh âm vị)

