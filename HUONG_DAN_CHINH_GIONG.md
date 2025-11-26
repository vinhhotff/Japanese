# 🎤 Hướng Dẫn Chỉnh Giọng Nói

## 📍 File cần chỉnh

**File:** `src/utils/speech.ts`

## 🔧 Cách chỉnh

1. Mở file `src/utils/speech.ts`
2. Tìm dòng có `const DEFAULT_SPEECH_CONFIG`
3. Thay đổi các giá trị sau:

### ⚙️ Các tham số có thể chỉnh:

#### 1. **rate** (Tốc độ nói)
- **Giá trị:** 0.1 - 10
- **Khuyến nghị cho người mới học:** 0.7 - 0.8
- **Ví dụ:**
  - `0.6` = Rất chậm, dễ nghe
  - `0.75` = Chậm vừa phải (KHUYẾN NGHỊ)
  - `0.9` = Hơi chậm
  - `1.0` = Tốc độ bình thường
  - `1.2` = Nhanh

#### 2. **pitch** (Cao độ giọng)
- **Giá trị:** 0 - 2
- **Ví dụ:**
  - `0.8` = Giọng trầm (nam)
  - `1.0` = Bình thường
  - `1.2` = Giọng cao (nữ)
  - `1.5` = Rất cao

#### 3. **volume** (Âm lượng)
- **Giá trị:** 0 - 1
- **Ví dụ:**
  - `0.7` = Nhỏ
  - `0.9` = Vừa
  - `1.0` = To nhất (KHUYẾN NGHỊ)

#### 4. **voiceName** (Tên giọng cụ thể)
- Để `undefined` = Tự động chọn giọng tốt nhất
- Hoặc đặt tên giọng cụ thể nếu muốn

## 📝 Ví dụ cấu hình

### Giọng chậm, rõ, dễ nghe (KHUYẾN NGHỊ cho người mới học):
```typescript
rate: 0.7,
pitch: 1.0,
volume: 1.0,
```

### Giọng nữ, cao, chậm:
```typescript
rate: 0.75,
pitch: 1.3,
volume: 1.0,
```

### Giọng nam, trầm, chậm:
```typescript
rate: 0.75,
pitch: 0.8,
volume: 1.0,
```

### Giọng nhanh, bình thường:
```typescript
rate: 1.0,
pitch: 1.0,
volume: 1.0,
```

## 🔍 Xem danh sách giọng có sẵn

1. Mở ứng dụng trong trình duyệt
2. Mở Console (F12 → Console)
3. Chạy lệnh:
```javascript
speechSynthesis.getVoices().forEach(v => console.log(v.name, v.lang))
```

Sau đó bạn có thể copy tên giọng và đặt vào `voiceName`.

## 💡 Mẹo

- **Nếu giọng khó nghe:** Giảm `rate` xuống 0.6-0.7
- **Nếu giọng quá nhanh:** Giảm `rate` xuống 0.7-0.8
- **Nếu muốn giọng rõ hơn:** Tăng `volume` lên 1.0
- **Nếu muốn giọng nữ:** Tăng `pitch` lên 1.2-1.3
- **Nếu muốn giọng nam:** Giảm `pitch` xuống 0.8-0.9

## ⚠️ Lưu ý

- Sau khi chỉnh, cần **refresh lại trang** (F5) để áp dụng thay đổi
- Một số trình duyệt có thể có giọng khác nhau
- Chrome thường có giọng tiếng Nhật tốt nhất

