# 🇯🇵 Japanese & Chinese Learning App

Ứng dụng học tiếng Nhật và tiếng Trung với AI, được xây dựng bằng React + Supabase.

## ✨ Tính năng

- 📚 **Khóa học** - N5→N1 (Nhật), HSK1→HSK6 (Trung)
- 🎯 **Từ vựng** - Học từ vựng với flashcards
- ✍️ **Luyện viết Kanji** - Canvas vẽ và nhận diện
- 🤖 **AI Roleplay** - Hội thoại với AI (Gemini)
- 👨‍🏫 **Quản lý lớp học** - Giáo viên tạo lớp, học sinh tham gia
- 📊 **Admin Panel** - Quản lý users, khóa học, bài tập

## 🚀 Cài đặt

```bash
# Clone repo
git clone https://github.com/your-username/Japanese.git
cd Japanese

# Cài dependencies
npm install

# Tạo file .env.local
cp .env.example .env.local
# Điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY

# Chạy dev server
npm run dev
```

## 🔧 Cấu hình

Tạo file `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key
VITE_AI_PROVIDER=gemini
```

## 🏗️ Tech Stack

| Frontend | Backend | AI |
|----------|---------|-----|
| React 18 | Supabase | Gemini API |
| TypeScript | PostgreSQL | |
| React Router | Row Level Security | |

## 👥 Roles

| Role | Quyền |
|------|-------|
| **Admin** | Quản lý tất cả |
| **Teacher** | Tạo lớp, giao bài, chấm điểm |
| **Student** | Học, làm bài tập |

## 📁 Cấu trúc

```
src/
├── components/     # UI Components
├── contexts/       # React Contexts (Auth, Theme)
├── services/       # Supabase API calls
├── styles/         # CSS files
└── utils/          # Helper functions
```

## 📄 License

MIT
