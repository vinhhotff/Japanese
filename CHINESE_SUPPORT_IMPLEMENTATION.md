# Hỗ trợ Tiếng Trung - Tài liệu Triển khai

## ✅ Đã Hoàn Thành

### 1. Database Migration
**File:** `supabase/migration_add_chinese_support.sql`

- ✅ Thêm cột `language` (japanese/chinese) vào tất cả bảng
- ✅ Hỗ trợ level HSK1-HSK6 cho tiếng Trung
- ✅ Thêm cột `pinyin`, `simplified`, `traditional` cho từ vựng
- ✅ Đổi tên cột `kanji` → `character` (tổng quát hơn)
- ✅ Tạo indexes cho language và level

**Cách chạy migration:**
```sql
-- Chạy trong Supabase SQL Editor
-- Copy nội dung từ file migration_add_chinese_support.sql và execute
```

### 2. Service Layer với Phân Trang
**File:** `src/services/supabaseService.v2.ts`

- ✅ Tất cả hàm GET đều có phân trang
- ✅ Trả về `{ data, total, page, pageSize, totalPages }`
- ✅ Hỗ trợ filter theo `language`
- ✅ Hỗ trợ cả Japanese (N5-N1) và Chinese (HSK1-HSK6)

**API mới:**
```typescript
// Ví dụ sử dụng
const result = await getCourses('japanese', 1, 20);
// result = { data: [...], total: 100, page: 1, pageSize: 20, totalPages: 5 }

const vocab = await getVocabulary(lessonId, 'chinese', 1, 50);
```

### 3. Routes Tách Biệt
**File:** `src/App.tsx`

- ✅ Routes riêng cho tiếng Nhật: `/japanese/*`
- ✅ Routes riêng cho tiếng Trung: `/chinese/*`
- ✅ Legacy routes redirect về Japanese (backward compatibility)

**Cấu trúc routes:**
```
/japanese/courses          → Khóa học tiếng Nhật
/japanese/lessons/:id      → Bài học tiếng Nhật
/japanese/dictionary       → Từ điển tiếng Nhật
/japanese/kanji-writing    → Luyện viết Kanji

/chinese/courses           → Khóa học tiếng Trung
/chinese/lessons/:id       → Bài học tiếng Trung
/chinese/dictionary        → Từ điển tiếng Trung
/chinese/hanzi-writing     → Luyện viết Hanzi
```

## 📝 Cần Làm Tiếp

### 4. Cập Nhật Components

#### A. DashboardNew.tsx
**Cần thay đổi:**
```typescript
// Thay vì:
import { getCourses } from '../services/supabaseService';

// Dùng:
import { getCourses } from '../services/supabaseService.v2';

// Thêm language selector
const [language, setLanguage] = useState<'japanese' | 'chinese'>('japanese');

// Load data theo language
const result = await getCourses(language, 1, 20);
```

**UI cần thêm:**
- Toggle/Tabs để chọn Japanese hoặc Chinese
- Hiển thị 2 sections riêng biệt cho mỗi ngôn ngữ
- Icon/emoji khác nhau (🇯🇵 vs 🇨🇳)

#### B. CourseList.tsx
**Props mới:**
```typescript
interface CourseListProps {
  language: 'japanese' | 'chinese';
}
```

**Cần thay đổi:**
- Nhận prop `language`
- Filter courses theo language
- Hiển thị level phù hợp (N5-N1 hoặc HSK1-HSK6)
- Text khác nhau cho mỗi ngôn ngữ

#### C. LessonListNew.tsx
**Tương tự CourseList:**
- Nhận prop `language`
- Load lessons theo language
- UI text phù hợp

#### D. LessonDetail.tsx
**Cần thay đổi:**
- Nhận prop `language`
- Hiển thị vocabulary khác nhau:
  - Japanese: kanji, hiragana, meaning
  - Chinese: hanzi, pinyin, simplified/traditional, meaning
- Hiển thị character khác nhau:
  - Japanese: Kanji với onyomi/kunyomi
  - Chinese: Hanzi với pinyin, radical

#### E. Dictionary.tsx
**Cần thay đổi:**
- Nhận prop `language`
- Search API khác nhau:
  - Japanese: Jisho API
  - Chinese: CC-CEDICT hoặc Chinese API
- Hiển thị kết quả khác nhau

#### F. KanjiWritingPractice.tsx
**Cần đổi tên và logic:**
- Đổi tên thành `CharacterWritingPractice.tsx`
- Nhận prop `language`
- Japanese: Kanji writing
- Chinese: Hanzi writing (simplified/traditional)

#### G. AdminPanel.tsx
**Cần thêm:**
- Dropdown chọn language khi tạo/sửa
- Pagination controls (Previous/Next, Page numbers)
- Form fields khác nhau cho Japanese vs Chinese:
  - Japanese: kanji, hiragana, onyomi, kunyomi
  - Chinese: hanzi, pinyin, simplified, traditional

### 5. Tạo Components Mới

#### A. LanguageSelector.tsx
```typescript
interface LanguageSelectorProps {
  value: 'japanese' | 'chinese';
  onChange: (lang: 'japanese' | 'chinese') => void;
}

// UI: Toggle hoặc Tabs đẹp
```

#### B. ChineseVocabularyCard.tsx
```typescript
// Hiển thị từ vựng tiếng Trung với:
// - Hanzi (simplified/traditional)
// - Pinyin
// - Meaning
// - Example sentences
```

#### C. HanziDetail.tsx
```typescript
// Hiển thị chi tiết Hanzi:
// - Character
// - Pinyin
// - Radical
// - Stroke order
// - Examples
```

### 6. Cập Nhật Types

**File:** `src/types/index.ts`

```typescript
export type Language = 'japanese' | 'chinese';
export type JapaneseLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type ChineseLevel = 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5' | 'HSK6';
export type Level = JapaneseLevel | ChineseLevel;

export interface Vocabulary {
  id: string;
  lesson_id: string;
  word: string;
  character?: string; // Kanji or Hanzi
  hiragana?: string; // For Japanese
  pinyin?: string; // For Chinese
  simplified?: string; // For Chinese
  traditional?: string; // For Chinese
  meaning: string;
  example?: string;
  example_translation?: string;
  language: Language;
  difficulty?: 'easy' | 'medium' | 'hard';
  is_difficult?: boolean;
}

export interface Character {
  id: string;
  lesson_id: string;
  character: string;
  meaning: string;
  // Japanese specific
  onyomi?: string[];
  kunyomi?: string[];
  // Chinese specific
  pinyin?: string;
  simplified?: string;
  traditional?: string;
  radical?: string;
  stroke_count?: number;
  language: Language;
  examples?: CharacterExample[];
}
```

### 7. i18n Updates

**File:** `src/i18n/locales/vi.json`

```json
{
  "languages": {
    "japanese": "Tiếng Nhật",
    "chinese": "Tiếng Trung",
    "selectLanguage": "Chọn ngôn ngữ"
  },
  "levels": {
    "japanese": {
      "N5": "N5 - Sơ cấp",
      "N4": "N4 - Trung cấp thấp",
      "N3": "N3 - Trung cấp",
      "N2": "N2 - Trung cấp cao",
      "N1": "N1 - Cao cấp"
    },
    "chinese": {
      "HSK1": "HSK 1 - Sơ cấp",
      "HSK2": "HSK 2 - Sơ cấp cao",
      "HSK3": "HSK 3 - Trung cấp thấp",
      "HSK4": "HSK 4 - Trung cấp",
      "HSK5": "HSK 5 - Trung cấp cao",
      "HSK6": "HSK 6 - Cao cấp"
    }
  },
  "vocabulary": {
    "japanese": {
      "kanji": "Kanji",
      "hiragana": "Hiragana",
      "onyomi": "Âm Onyomi",
      "kunyomi": "Âm Kunyomi"
    },
    "chinese": {
      "hanzi": "Hán tự",
      "pinyin": "Pinyin",
      "simplified": "Giản thể",
      "traditional": "Phồn thể",
      "radical": "Bộ thủ"
    }
  }
}
```

## 🎯 Kế Hoạch Triển Khai

### Phase 1: Core Setup (Đã xong)
- ✅ Database migration
- ✅ Service layer với pagination
- ✅ Routes setup

### Phase 2: Dashboard & Navigation (Đang làm)
- [ ] Cập nhật DashboardNew với language selector
- [ ] Tạo LanguageSelector component
- [ ] Update navigation/header với language context

### Phase 3: Course & Lesson Components
- [ ] Update CourseList
- [ ] Update LessonListNew
- [ ] Update LessonDetail

### Phase 4: Learning Components
- [ ] Update Dictionary
- [ ] Create ChineseVocabularyCard
- [ ] Create HanziDetail
- [ ] Update CharacterWritingPractice

### Phase 5: Admin Panel
- [ ] Add language selector
- [ ] Add pagination controls
- [ ] Update forms for Chinese support

### Phase 6: Testing & Polish
- [ ] Test all Japanese routes
- [ ] Test all Chinese routes
- [ ] Add sample Chinese data
- [ ] UI/UX improvements

## 📚 Tài Liệu Tham Khảo

### Chinese APIs
- **CC-CEDICT**: Free Chinese-English dictionary
- **Hanzi Writer**: Stroke order animations
- **Pinyin Converter**: Convert Hanzi to Pinyin

### HSK Levels
- HSK 1: 150 words
- HSK 2: 300 words (cumulative)
- HSK 3: 600 words
- HSK 4: 1200 words
- HSK 5: 2500 words
- HSK 6: 5000+ words

## 🚀 Bước Tiếp Theo

1. **Chạy migration SQL** trong Supabase
2. **Thay thế import** từ `supabaseService` sang `supabaseService.v2`
3. **Cập nhật DashboardNew** với language selector
4. **Test pagination** với dữ liệu mẫu
5. **Tạo sample data** cho tiếng Trung

Bạn muốn tôi tiếp tục với phần nào?
