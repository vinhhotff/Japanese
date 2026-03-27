# 🇯🇵 Japanese & Chinese Learning App

> Ứng dụng học tiếng Nhật (JLPT N5→N1) và tiếng Trung (HSK1→HSK6) tích hợp AI, xây dựng bằng React + Supabase. Hỗ trợ đa ngôn ngữ (Tiếng Việt, English), dark/light theme, và hệ thống phân quyền Admin / Teacher / Student.

---

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Tính năng chính](#tính-năng-chính)
3. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
4. [Cấu trúc dự án](#cấu-trúc-dự-án)
5. [Cơ sở dữ liệu](#cơ-sở-dữ-liệu)
6. [API & Dịch vụ](#api--dịch-vụ)
7. [Phân quyền người dùng](#phân-quyền-người-dùng)
8. [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
9. [Hướng dẫn triển khai](#hướng-dẫn-triển-khai)

---

## Tổng quan

Dự án là một **nền tảng học ngôn ngữ trực tuyến** (e-learning platform) hỗ trợ hai ngôn ngữ Đông Á: **tiếng Nhật** và **tiếng Trung**. Ứng dụng cung cấp:

- **Hệ thống khóa học** theo chuẩn JLPT (Nhật) và HSK (Trung)
- **AI Roleplay** — hội thoại với AI Gemini để luyện nói
- **Luyện viết Kanji/Hanzi** bằng canvas với nhận diện nét vẽ
- **Spaced Repetition (SRS)** — ôn tập từ vựng theo lịch thông minh
- **Diễn đàn học viên** — thảo luận, đặt câu hỏi
- **Tìm bạn học chung** (Peer Matching) — kết nối học viên
- **Bảng xếp hạng** — thành tích và streak
- **Hệ thống lớp học** — giáo viên quản lý lớp, giao bài, chấm điểm
- **Admin Panel** — quản trị toàn bộ nội dung (khóa học, bài học, từ vựng, Kanji, ngữ pháp)

### Thông tin kỹ thuật

| Thông tin | Chi tiết |
|-----------|----------|
| **Frontend** | React 18 + TypeScript |
| **Build tool** | Vite 5 |
| **Backend / Database** | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| **AI** | Google Gemini API (Cloudflare Worker proxy) |
| **Animation** | Framer Motion 12 |
| **i18n** | i18next + react-i18next |
| **Router** | React Router DOM v6 |
| **Styling** | CSS thuần (CSS Variables, dark mode, scoped styles) |
| **Code quality** | Prettier, ESLint-compatible |

---

## Tính năng chính

### 🎓 Khóa học & Bài học

- Hệ thống khóa học N5→N1 (Nhật) và HSK1→HSK6 (Trung)
- Mỗi bài học chứa: từ vựng, Kanji/Hanzi, ngữ pháp, bài nghe, bài đọc
- Hỗ trợ bài học miễn phí / trả phí
- Giao diện premium với dark mode cho trang chi tiết lớp học

### 📚 Từ vựng & Flashcards

- Học từ vựng với flashcards có hình ảnh, ví dụ câu
- Hỗ trợ cả tiếng Nhật (kanji + hiragana) và tiếng Trung (pinyin, simplified, traditional)
- Lọc theo độ khó (Dễ / Thường / Khó)
- Đánh dấu từ quan trọng / khó
- Import hàng loạt từ vựng qua format text hoặc AI generator

### ✍️ Luyện viết Kanji / Hanzi

- Canvas vẽ từ (handwriting recognition)
- Hiển thị nét vẽ, onyomi/kunyomi (Nhật), pinyin (Trung)
- Đánh giá chất lượng nét vẽ theo thời gian thực

### 🔄 Spaced Repetition (SRS)

- Ôn tập từ vựng theo thuật toán spaced repetition
- Chọn ngôn ngữ học (JP / CN / cả hai)
- Theo dõi progress và streak

### 🤖 AI Roleplay

- Hội thoại với AI Gemini trong các kịch bản thực tế (camping, du lịch, công việc...)
- Chấm điểm phát âm tự động bằng Web Speech API
- Chế độ Shadowing — nghe và phát âm theo mẫu
- Điểm số + feedback chi tiết sau mỗi lần luyện tập

### 👨‍🏫 Hệ thống lớp học

- **Giáo viên**: tạo lớp, mời học sinh qua mã lớp, giao bài tập, chấm điểm
- **Học sinh**: tham gia lớp bằng mã, nhận và nộp bài tập, xem điểm
- Giao diện Teacher Dashboard với breadcrumb, quản lý nội dung overlay

### 📝 Bài tập & Chấm điểm

- **AssignmentForm** (Admin/Giáo viên): tạo bài tập nhiều loại
  - Từ vựng (vocabulary)
  - Kanji
  - Ngữ pháp
  - Bài nghe (listening) — hỗ trợ đính kèm hình ảnh
  - Game sắp xếp câu (sentence game)
  - Roleplay
- **GradingInterface** (Giáo viên): chấm điểm chi tiết từng câu trả lời
- Hỗ trợ nộp bài trễ, gia hạn deadline

### 💬 Diễn đàn (Forum)

- Đăng bài viết theo chủ đề (forum categories)
- Reply / bình luận bài viết
- Đánh dấu reply được chấp nhận
- Tìm kiếm bài viết
- Hệ thống RLS đảm bảo bảo mật per-user

### 👥 Tìm bạn học chung (Peer Matching)

- Tạo hồ sơ tìm bạn: ngôn ngữ học, trình độ, mục tiêu, thời gian rảnh
- Browse danh sách học viên phù hợp
- Gửi yêu cầu kết nối, chấp nhận/từ chối
- Nhắn tin trong ứng dụng

### 🏆 Bảng xếp hạng (Leaderboard)

- Top 10 học viên theo điểm XP
- Hiển thị level, streak, total points
- Highlight vị trí của user hiện tại

### 🔐 Admin Panel

- Quản lý người dùng (phân quyền Admin/Teacher/Student)
- CRUD đầy đủ: khóa học, bài học, từ vựng, Kanji, ngữ pháp, bài nghe
- Batch import từ vựng qua JSON/text
- AI prompt helper — gợi ý format để tạo nội dung bằng AI

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│  React 18 + TypeScript + Vite + Framer Motion       │
│  React Router + i18next + CSS Variables             │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────┐
│                    Supabase                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Auth     │ │ Database │ │ Storage  │            │
│  │ (JWT)    │ │(Postgres)│ │ (Files)  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────────────────────────────┐                │
│  │ Row Level Security (RLS)        │                │
│  │ - Per-table policies            │                │
│  │ - Role-based access             │                │
│  └──────────────────────────────────┘                │
└──────────────────────┬──────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
┌───────────────────┐  ┌──────────────────────────────┐
│ Gemini API        │  │ Cloudflare Worker            │
│ (AI Roleplay)     │  │ (CORS proxy cho Gemini)      │
└───────────────────┘  └──────────────────────────────┘
```

### Data Flow chính

1. **Authentication**: User đăng nhập → Supabase Auth trả JWT → lưu vào session
2. **Data Fetching**: Supabase Client dùng JWT để query PostgreSQL qua PostgREST → RLS lọc dữ liệu
3. **AI Roleplay**: Frontend → Cloudflare Worker (bypass CORS) → Gemini API → Worker trả về
4. **Content Creation**: Admin tạo nội dung → Supabase insert → RLS kiểm tra quyền → lưu DB

---

## Cấu trúc dự án

```
Japanese/
├── public/                     # Static assets
├── src/
│   ├── components/              # React UI components
│   │   ├── AdminPanel.tsx       # Admin quản lý nội dung
│   │   ├── AdminForm.tsx       # Form tạo/sửa nội dung (vocab, kanji, grammar...)
│   │   ├── AIConversation.tsx  # AI Roleplay
│   │   ├── AssignmentDetail.tsx
│   │   ├── AssignmentForm.tsx  # Form tạo bài tập (Admin/GV)
│   │   ├── AllCourses.tsx      # Danh sách tất cả khóa học
│   │   ├── AllDictionary.tsx   # Từ điển tra cứu
│   │   ├── AllClasses.tsx      # Danh sách lớp học
│   │   ├── ClassDetail.tsx     # Chi tiết lớp học (redesign premium)
│   │   ├── CourseList.tsx      # Trang khóa học
│   │   ├── DashboardNew.v2.tsx # Dashboard chính
│   │   ├── Dictionary.tsx
│   │   ├── Forum.tsx           # Diễn đàn
│   │   ├── ForumPost.tsx       # Chi tiết bài viết diễn đàn
│   │   ├── GradingInterface.tsx # Chấm điểm
│   │   ├── Header.tsx          # Header / Navigation
│   │   ├── KanjiWritingPractice.tsx # Luyện viết Kanji
│   │   ├── Leaderboard.tsx     # Bảng xếp hạng
│   │   ├── LessonListNew.tsx   # Danh sách bài học
│   │   ├── LessonDetail.tsx    # Chi tiết bài học
│   │   ├── PeerMatching.tsx    # Tìm bạn học chung
│   │   ├── Pronunciation.tsx   # Luyện phát âm
│   │   ├── Shadowing.tsx       # Shadowing exercise
│   │   ├── SpacedRepetition.tsx # SRS ôn tập
│   │   ├── SubmissionList.tsx  # Danh sách bài nộp
│   │   ├── TeacherDashboard.tsx # Dashboard giáo viên
│   │   ├── VocabularyPractice.tsx # Luyện từ vựng
│   │   ├── VoiceRecorder.tsx   # Ghi âm phát âm
│   │   ├── challenges/         # Mini challenges (speaking, listening)
│   │   └── common/              # Shared components (Pagination)
│   │
│   ├── contexts/               # React Contexts
│   │   ├── AuthContext.tsx     # Authentication & user state
│   │   └── ThemeContext.tsx   # Dark/light theme
│   │
│   ├── services/               # API / Business logic layer
│   │   ├── adminService.ts     # Admin CRUD operations
│   │   ├── aiService.ts        # Gemini AI calls
│   │   ├── assignmentService.ts # Bài tập
│   │   ├── badgeService.ts     # Badge/achievement
│   │   ├── classService.ts     # Lớp học
│   │   ├── forumService.ts     # Diễn đàn
│   │   ├── homeworkService.ts   # Bài tập về nhà
│   │   ├── notebookService.ts   # Sổ tay từ vựng
│   │   ├── peerMatchingService.ts # Peer matching
│   │   ├── profileService.ts   # User profiles
│   │   ├── statsService.ts      # Stats & XP
│   │   ├── supabaseService.ts  # Generic Supabase queries
│   │   ├── translateService.ts # Translation API
│   │   └── (others)
│   │
│   ├── styles/                 # CSS files (20+ files)
│   │   ├── admin-panel-complete.css # Admin Panel styling
│   │   ├── admin-panel.css
│   │   ├── ai-roleplay-css.css # AI roleplay styling
│   │   ├── assignment-form.css
│   │   ├── assignment-premium.css
│   │   ├── assignments.css
│   │   ├── class-detail-premium.css # ClassDetail redesign
│   │   ├── core.css
│   │   ├── custom-theme.css
│   │   ├── dashboard-modern.css
│   │   ├── dashboard-v2.css
│   │   ├── dark-mode-fixes.css
│   │   ├── forum.css           # Forum + category picker styling
│   │   ├── grading.css
│   │   ├── language-themes.css # JP/CN theme variables
│   │   ├── lesson-detail-premium.css
│   │   ├── lesson-list-premium.css
│   │   ├── lesson-shared.css
│   │   ├── modern-effects.css
│   │   ├── notebook.css
│   │   ├── peer-matching.css
│   │   ├── premium-features.css
│   │   ├── skeleton.css
│   │   ├── spaced-repetition.css # SRS + Kanji writing
│   │   ├── teacher-dashboard-premium.css # Teacher Dashboard styling
│   │   └── theme-variables.css  # CSS variable definitions
│   │
│   ├── utils/                 # Utility functions
│   │   ├── corsProxy.ts        # CORS proxy utilities
│   │   ├── fileUpload.ts      # Supabase storage upload
│   │   ├── grammarParser.ts   # Grammar parsing
│   │   ├── logger.ts          # Logging
│   │   ├── searchCache.ts     # Cache layer
│   │   ├── sentenceGameParser.ts # Sentence game logic
│   │   ├── storage.ts         # Local storage helpers
│   │   └── (others)
│   │
│   ├── i18n/
│   │   ├── config.ts          # i18next setup
│   │   └── locales/
│   │       ├── vi.json        # Tiếng Việt
│   │       └── en.json        # English
│   │
│   ├── config/
│   │   └── supabase.ts        # Supabase client config
│   │
│   ├── App.tsx                # Main app + routing
│   ├── main.tsx               # Entry point
│   ├── index.css              # Global styles + theme variables
│   └── data/
│       ├── games.ts           # Game data
│       └── lessons.ts         # Static lesson data
│
├── supabase/
│   ├── schema.sql             # FULL database schema (836 dòng)
│   ├── migrations/
│   │   ├── 20260325000001_community_features.sql # Forum + Peer
│   │   ├── migration_add_assignments.sql
│   │   ├── migration_add_assignments_rls.sql
│   │   ├── migration_add_chinese_support.sql
│   │   ├── migration_add_courses_premium.sql
│   │   ├── migration_add_delete_policies.sql
│   │   ├── migration_add_listening_image_roleplay.sql
│   │   ├── migration_add_missing_assignment_columns.sql
│   │   ├── migration_forum_profiles_fk.sql
│   │   ├── migration_optimize_user_roles.sql
│   │   └── upgrade_system_v1.sql
│   │
│   ├── forum_categories_rls.sql          # RLS fix for forum categories
│   ├── forum_categories_rls.sql
│   ├── seed_forum_categories.sql         # Seed data: forum categories
│   ├── seed_demo_users.sql              # Seed: 10 demo profiles (bypass FK)
│   ├── seed_leaderboard_data.sql        # Seed: user_stats top 10
│   ├── user_stats_leaderboard_rls.sql   # RLS fix: public read for leaderboard
│   ├── storage_policies.sql             # Storage bucket policies
│   ├── fix_policies.sql                 # Fix broken RLS policies
│   ├── fix_schema.sql
│   ├── check_schema.sql
│   ├── add_kanji_column.sql
│   ├── add_missing_columns.sql
│   ├── quick_insert_data.sql            # Seed: courses, lessons, vocab
│   └── migration_complete.sql
│
├── cloudflare-worker/
│   └── worker.js              # CORS proxy cho Gemini AI
│
├── roleplay_camping.json      # AI roleplay scenario data
├── roleplay_camping_examples.json
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── README.md
```

---

## Cơ sở dữ liệu

### Bảng chính

| Bảng | Mô tả |
|------|-------|
| `profiles` | Thông tin user (name, avatar, bio, ngôn ngữ học) |
| `user_roles` | Phân quyền (admin / teacher / student) |
| `courses` | Khóa học (N5, N4, N3, N2, N1, HSK1-6) |
| `lessons` | Bài học thuộc khóa học |
| `vocabulary` | Từ vựng (word, kanji, hiragana, meaning, difficulty) |
| `kanji` | Kanji (character, onyomi, kunyomi, strokes, radical) |
| `kanji_examples` | Ví dụ từ cho mỗi Kanji |
| `grammar` | Ngữ pháp (pattern, meaning, usage) |
| `grammar_examples` | Ví dụ câu cho ngữ pháp |
| `listening` | Bài nghe (audio_url, questions JSON) |
| `classes` | Lớp học do giáo viên tạo |
| `enrollments` | Học sinh đăng ký lớp |
| `assignments` | Bài tập do giáo viên giao |
| `assignment_questions` | Câu hỏi trong bài tập |
| `assignment_submissions` | Bài nộp của học sinh |
| `assignment_answers` | Câu trả lời từng câu |
| `homework` | Bài tập về nhà |
| `homework_submissions` | Nộp bài tập về nhà |
| `user_courses` | Khóa học user đã mua |
| `user_stats` | Thống kê user (XP, level, streak, points) |
| `badges` | Danh hiệu / huy hiệu |
| `user_badges` | Danh hiệu đã đạt được |
| `user_notebook` | Sổ tay từ vựng cá nhân |
| `forum_categories` | Chủ đề diễn đàn |
| `forum_posts` | Bài viết diễn đàn |
| `forum_replies` | Reply bài viết |
| `peer_profiles` | Hồ sơ tìm bạn học |
| `peer_match_requests` | Yêu cầu kết nối peer |
| `peer_chat_messages` | Tin nhắn peer |

### Quan hệ chính

```
profiles (1) ─── (many) user_roles
profiles (1) ─── (many) enrollments ─── (many) classes
profiles (1) ─── (many) assignments (as teacher)
profiles (1) ─── (many) forum_posts
profiles (1) ─── (many) forum_replies
profiles (1) ─── (1) peer_profiles
profiles (1) ─── (many) user_stats

courses (1) ─── (many) lessons
lessons (1) ─── (many) vocabulary
lessons (1) ─── (many) kanji
lessons (1) ─── (many) grammar
lessons (1) ─── (many) listening

classes (1) ─── (many) enrollments
classes (1) ─── (many) assignments
assignments (1) ─── (many) assignment_questions
assignments (1) ─── (many) assignment_submissions
```

---

## API & Dịch vụ

### Service Layer

Tất cả gọi Supabase đi qua layer `services/`:

- **`supabaseService.ts`** — Generic query builder, helper functions
- **`profileService.ts`** — CRUD profiles
- **`adminService.ts`** — Admin-only operations (user management, content CRUD)
- **`classService.ts`** — Classes, enrollments
- **`assignmentService.ts`** — Assignments, submissions, grading
- **`homeworkService.ts`** — Homework
- **`statsService.ts`** — XP, level, streaks, badges
- **`forumService.ts`** — Forum posts, replies, categories
- **`peerMatchingService.ts`** — Peer profiles, matching, chat
- **`aiService.ts`** — Gemini API integration
- **`badgeService.ts`** — Badge management
- **`notebookService.ts`** — Notebook CRUD
- **`translateService.ts`** — Translation

### Foreign Key Embedding

Supabase PostgREST tự động embed dữ liệu quan hệ qua FK constraints:

```typescript
// Ví dụ: lấy posts kèm profile của tác giả
supabase.from('forum_posts').select('*, profiles(*)')
```

> ⚠️ **Lưu ý**: Nếu FK constraint bị thiếu hoặc schema cache chưa sync, embed sẽ lỗi `PGRST200`. Giải pháp: thêm FK trong schema hoặc refactor sang 2 query riêng (main data → profile IDs → profiles → merge).

---

## Phân quyền người dùng

### Vai trò

| Vai trò | Mô tả |
|---------|-------|
| **Admin** | Quản trị viên — toàn quyền quản lý nội dung và người dùng |
| **Teacher** | Giáo viên — tạo lớp, giao bài, chấm điểm |
| **Student** | Học sinh — học, làm bài, tham gia lớp |

### Row Level Security (RLS)

Supabase RLS áp dụng trên **tất cả** các bảng. Ví dụ:

```sql
-- profiles: ai cũng đọc, chỉ bản thân sửa
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- user_stats: đọc công khai (leaderboard), chỉ bản thân ghi
CREATE POLICY "user_stats_all" ON user_stats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_stats_select_leaderboard" ON user_stats FOR SELECT USING (true);

-- assignments: công khai nếu published, tác giả quản lý
CREATE POLICY "assignments_select" ON assignments FOR SELECT
  USING (is_published = true OR created_by = auth.uid());
```

---

## Luồng ứng dụng (Application Flows)

Mô tả chi tiết cách dữ liệu và trạng thái di chuyển qua toàn bộ hệ thống. Mỗi flow bao gồm: điều kiện bắt đầu, các bước xử lý, kết quả, và các điểm có thể xảy ra lỗi.

---

### Flow 1 — Đăng nhập & Xác thực

**Mục đích:** Người dùng đăng nhập, hệ thống xác minh danh tính và phân quyền.

```
Browser → Supabase Auth → AuthContext → App Router → ProtectedRoute
```

**Các bước chi tiết:**

```
Bước 1: Người dùng nhập email/password tại trang /login
    ↓
Bước 2: AuthContext.signIn() gọi supabase.auth.signInWithPassword()
    ↓
Bước 3: Supabase Auth xác thực credentials
    ├─ Thành công → trả về JWT access_token + refresh_token
    └─ Thất bại → trả lỗi, hiển thị thông báo
    ↓
Bước 4: supabase.auth.onAuthStateChange() fire event '_TOKEN_REFRESHED'
    ↓
Bước 5: AuthContext xác định vai trò user
    ├─ Đọc email từ user object
    ├─ Gọi supabase.from('user_roles').select('role').eq('email', email)
    │   (có timeout 5 giây, retry tối đa 3 lần nếu lỗi)
    ├─ Nếu không có row → vai trò mặc định là 'student'
    └─ Lưu vai trò vào sessionStorage (key: 'user_role')
    ↓
Bước 6: Fetch profile
    ├─ Gọi profileService.getProfile(user.id)
    └─ Set vào AuthContext.profile (không block loading)
    ↓
Bước 7: ProtectedRoute kiểm tra quyền truy cập
    ├─ requireAdmin? → kiểm tra isAdmin
    ├─ requireTeacher? → kiểm tra isTeacher
    ├─ requireEnrollment? → gọi hasJoinedAnyClass(user.id)
    │   └─ Chưa tham gia → hiện modal nhập mã lớp
    └─ Không đủ quyền → Navigate về trang chủ
    ↓
Bước 8: App render component phù hợp với route
```

**Điều kiện thành công:** User có session hợp lệ, vai trò được xác định, quyền truy cập route được chấp nhận.

**Điểm lỗi tiềm năng:**

| Điểm lỗi | Nguyên nhân | Xử lý |
|-----------|------------|--------|
| Auth fail | Sai password | Hiển thị lỗi từ Supabase |
| Role timeout | Mạng chậm / Supabase lag | Retry 3 lần, fallback 'student' |
| No enrollment | User chưa join lớp nào | Hiện modal nhập mã lớp |
| RLS block | Policy chặn query user_roles | Kiểm tra RLS policies |

---

### Flow 2 — Học sinh tham gia lớp học

**Mục đích:** Học sinh nhập mã lớp để truy cập nội dung học tập.

```
ProtectedRoute (requireEnrollment) → Modal nhập mã → joinClass() → enrollments table
```

**Các bước chi tiết:**

```
Bước 1: Học sinh truy cập route cần enrollment
    └─ ProtectedRoute gọi hasJoinedAnyClass(user.id)
        ├─ Query: supabase.from('enrollments').select('class_id').eq('user_id', user.id)
        ├─ Có enrollment → cho phép truy cập
        └─ Không có → hiện modal nhập mã lớp
    ↓
Bước 2: Học sinh nhập mã lớp (VD: "JP-N5-ABC123")
    └─ Format: tự động uppercase, loại bỏ khoảng trắng
    ↓
Bước 3: Học sinh bấm "Xác nhận mã"
    └─ ProtectedRoute.handleEnroll() gọi joinClass(user.id, code)
    ↓
Bước 4: classService.joinClass()
    ├─ Query: tìm class có join_code = code
    │   └─ Không tìm thấy → throw Error('Mã lớp không hợp lệ')
    ├─ Query: kiểm tra đã enroll chưa?
    │   └─ Đã enroll → throw Error('Bạn đã tham gia lớp này rồi')
    ├─ INSERT: enrollments (user_id, class_id, enrolled_at)
    └─ Thành công → RLS kiểm tra enrollments_insert policy
    ↓
Bước 5: ProtectedRoute cập nhật state
    ├─ setHasEnrollment(true)
    ├─ setJustEnrolled(true)
    └─ Đóng modal → render children
    ↓
Bước 6: Học sinh truy cập nội dung lớp học
    └─ ClassDetail load assignments, class info qua classService
```

**RLS Policies liên quan:**

```sql
-- enrollments_insert: chỉ user tự thêm chính mình
CREATE POLICY "enrollments_insert" ON enrollments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
```

---

### Flow 3 — Giáo viên tạo bài tập

**Mục đựng:** Giáo viên tạo bài tập mới và giao cho lớp.

```
TeacherDashboard → AssignmentForm → adminService → assignments + assignment_questions
```

**Các bước chi tiết:**

```
Bước 1: Giáo viên truy cập /teacher/assignments/new
    └─ ProtectedRoute.requireTeacher() → cho phép
    ↓
Bước 2: Giáo viên chọn loại bài tập
    └─ Tab types: vocabulary | kanji | grammar | listening | sentence_game | roleplay
    ↓
Bước 3: Giáo viên điền thông tin cơ bản
    ├─ Tiêu đề bài tập
    ├─ Mô tả
    ├─ Chọn lớp giao bài (dropdown từ classes của giáo viên)
    ├─ Deadline (datetime picker)
    └─ Hiển thị: công khai / chỉ giáo viên thấy
    ↓
Bước 4: Giáo viên thêm nội dung (theo loại bài tập)
    ├─ Vocabulary:
    │   ├─ Chọn lesson → tự động load vocabulary từ lesson
    │   ├─ Hoặc: nhập thủ công từng từ
    │   ├─ Hoặc: import hàng loạt (JSON/text format)
    │   └─ Hoặc: dùng AI generator để tạo từ vựng
    ├─ Kanji: chọn lesson → load kanji
    ├─ Grammar: nhập pattern + ví dụ
    ├─ Listening: upload audio + nhập câu hỏi
    ├─ Sentence Game: nhập câu gốc + shuffle words
    └─ Roleplay: chọn scenario + mô tả yêu cầu
    ↓
Bước 5: Giáo viên bấm "Lưu bài tập"
    └─ AssignmentForm xử lý submit
    ↓
Bước 6: adminService tạo bài tập
    ├─ INSERT: assignments
    │   └─ Set created_by = auth.uid(), is_published = true/false
    │   RLS: assignments_insert policy kiểm tra
    │
    ├─ Với mỗi câu hỏi → INSERT: assignment_questions
    │   └─ FK: assignment_id → assignments.id (ON DELETE CASCADE)
    │   RLS: assignment_questions_insert policy kiểm tra
    │
    └─ Nếu chọn lớp cụ thể → INSERT: assignments vào class qua class_id
    ↓
Bước 7: Redirect về danh sách bài tập
    └─ /teacher/submissions/{assignmentId} nếu là bài tập đã giao
```

**RLS Policies liên quan:**

```sql
-- assignments_insert: authenticated user được tạo
CREATE POLICY "assignments_insert" ON assignments
  FOR INSERT TO authenticated WITH CHECK (true);

-- assignments_update: chỉ người tạo được sửa
CREATE POLICY "assignments_update" ON assignments
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
```

---

### Flow 4 — Học sinh làm & nộp bài tập

**Mục đích:** Học sinh nhận, làm và nộp bài tập được giao.

```
AssignmentList → AssignmentDetail → submit answers → assignment_submissions
```

**Các bước chi tiết:**

```
Bước 1: Học sinh xem danh sách bài tập tại /assignments
    ├─ Gọi assignmentService.getStudentAssignments(user.id)
    │   ├─ Lấy enrollments của user → class_ids
    │   ├─ Lấy assignments của các class đó (is_published = true)
    │   └─ Lấy submissions đã nộp của user
    │   RLS: enrollments_select + assignments_select
    └─ Hiển thị: tiêu đề, deadline, trạng thái (chưa nộp / đã nộp)
    ↓
Bước 2: Học sinh bấm vào bài tập → /assignments/:id
    ├─ Gọi assignmentService.getAssignmentWithQuestions(id)
    ├─ Gọi assignmentService.getSubmission(user.id, id) — kiểm tra đã nộp chưa
    └─ Render AssignmentDetail với danh sách câu hỏi
    ↓
Bước 3: Học sinh trả lời từng câu hỏi
    ├─ Vocabulary: chọn đáp án đúng (radio buttons)
    ├─ Kanji: chọn kanji tương ứng
    ├─ Grammar: điền vào ô trống / chọn đáp án
    ├─ Listening: nghe audio → nhập câu trả lời
    ├─ Sentence Game: kéo thả sắp xếp từ đúng thứ tự
    └─ Roleplay: ghi âm phát âm / nhập câu trả lời
    ↓
Bước 4: Học sinh bấm "Nộp bài"
    ├─ Validate: tất cả câu hỏi đã trả lời?
    │   └─ Chưa → cảnh báo, cho phép nộp vẫn
    ├─ INSERT: assignment_submissions (user_id, assignment_id, submitted_at)
    │   RLS: assignment_submissions_insert
    │
    ├─ Với mỗi câu trả lời → INSERT: assignment_answers
    │   ├─ student_answer: nội dung câu trả lời
    │   ├─ question_id: FK → assignment_questions
    │   └─ RLS: assignment_answers_insert
    │
    └─ Nếu là bài tập online (auto-grade):
        ├─ Gọi AI evaluate từng câu trả lời (aiService.evaluateExercise)
        └─ UPDATE: assignment_answers với score + feedback
    ↓
Bước 5: Hiển thị kết quả
    ├─ Tính điểm tổng (hoặc chờ giáo viên chấm)
    ├─ Gọi addExperiencePoints(user.id, XP_PER_ASSIGNMENT)
    │   └─ Update user_stats: total_points, level, experience_points
    │   RLS: user_stats_all
    └─ Hiển thị celebration animation nếu đạt điểm cao
```

**RLS Policies liên quan:**

```sql
-- assignment_submissions: học sinh thấy và nộp bài của mình
CREATE POLICY "assignment_submissions_select" ON assignment_submissions
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM assignments WHERE assignments.id = assignment_submissions.assignment_id
            AND assignments.created_by = auth.uid())
  );
```

---

### Flow 5 — Giáo viên chấm điểm

**Mục đích:** Giáo viên xem và chấm điểm bài nộp của học sinh.

```
SubmissionList → GradingPage → grade submission → assignment_answers
```

**Các bước chi tiết:**

```
Bước 1: Giáo viên truy cập /teacher/submissions/:assignmentId
    ├─ ProtectedRoute.requireTeacher() → kiểm tra
    ├─ Gọi assignmentService.getSubmissionsForGrading(assignmentId)
    │   ├─ Query: assignment_submissions WHERE assignment_id = assignmentId
    │   ├─ Embed: user profiles (hoặc manual fetch)
    │   └─ Embed: assignment_answers
    └─ Hiển thị danh sách: học sinh, thời gian nộp, điểm
    ↓
Bước 2: Giáo viên bấm "Chấm điểm" một học sinh
    └─ Navigate → /teacher/grading/:submissionId
    ↓
Bước 3: GradingPage load dữ liệu
    ├─ Gọi assignmentService.getSubmissionWithAnswers(submissionId)
    ├─ Gọi assignmentService.getAssignmentWithQuestions(assignmentId)
    └─ Hiển thị từng câu: câu hỏi gốc + câu trả lời HS + ô nhập điểm
    ↓
Bước 4: Giáo viên chấm từng câu
    ├─ Nhập điểm (0-10) cho mỗi câu
    ├─ Nhập nhận xét (feedback) cho mỗi câu (tùy chọn)
    └─ Xem preview AI scoring nếu có (từ assignment_answers.ai_score)
    ↓
Bước 5: Giáo viên bấm "Lưu điểm"
    ├─ Với mỗi answer → UPDATE: assignment_answers
    │   ├─ Set: score, teacher_feedback, graded_at
    │   └─ RLS: assignment_answers_update
    │
    ├─ Tính điểm tổng → UPDATE: assignment_submissions
    │   ├─ Set: total_score, graded_at
    │   └─ RLS: assignment_submissions_update
    │
    └─ Thông báo gửi cho học sinh (nếu có notification system)
    ↓
Bước 6: Học sinh xem kết quả tại /assignments/:id
    └─ Hiển thị điểm chi tiết + feedback của giáo viên
```

---

### Flow 6 — Học sinh luyện từ vựng (Vocabulary Practice)

**Mục đích:** Học sinh luyện từ vựng với flashcards, được cộng XP.

```
VocabularyPractice → load vocab → flashcard loop → add XP on complete
```

**Các bước chi tiết:**

```
Bước 1: Học sinh truy cập /japanese/vocabulary-practice
    ├─ ProtectedRoute.requireEnrollment()
    ├─ Load lessons của user (qua enrollments → classes)
    └─ Hiển thị danh sách bài học để chọn
    ↓
Bước 2: Học sinh chọn bài học
    ├─ URL: /japanese/vocabulary-practice/n5
    ├─ Gọi vocabularyService.getVocabularyByLesson(lessonId)
    │   RLS: vocabulary_select (is_published = true)
    └─ Bắt đầu flashcard session
    ↓
Bước 3: Flashcard session loop
    ├─ Mỗi từ hiển thị:
    │   ├─ Mặt trước: kanji/hiragana
    │   ├─ Mặt sau: meaning + example + audio (nếu có)
    │   └─ Animation: flip card
    │
    ├─ Học sinh tự đánh giá:
    │   ├─ 🔴 Không nhớ (Again)
    │   ├─ 🟡 Khó nhớ (Hard)
    │   ├─ 🟢 Nhớ (Good)
    │   └─ 🔵 Dễ quá (Easy)
    │
    └─ Cập nhật spaced repetition schedule (local state)
    ↓
Bước 4: Hoàn thành session (> 10 từ)
    ├─ Tính accuracy: số từ nhớ / tổng số từ
    ├─ Tính XP: accuracy * XP_PER_STEP
    ├─ Gọi addExperiencePoints(user.id, xp)
    │   └─ Update user_stats → total_points, level
    │   RLS: user_stats_all (user chỉ update chính mình)
    │
    └─ Hiện Celebration animation (confetti)
    ↓
Bước 5: Cập nhật Spaced Repetition
    ├─ Tính next review date dựa trên rating (Again=1m, Hard=6h, Good=1d, Easy=4d)
    └─ Lưu vào localStorage hoặc user_learning_progress table
```

---

### Flow 7 — Luyện viết Kanji

**Mục đích:** Học sinh vẽ Kanji trên canvas, AI đánh giá nét vẽ.

```
KanjiWritingPractice → load kanji → canvas draw → evaluate → XP
```

**Các bước chi tiết:**

```
Bước 1: Học sinh truy cập /japanese/kanji-writing
    ├─ ProtectedRoute.requireEnrollment()
    ├─ Chọn ngôn ngữ: JP (Kanji) hoặc CN (Hanzi)
    └─ Chọn level → load danh sách kanji
    ↓
Bước 2: Chọn Kanji để luyện
    ├─ Gọi kanjiService.getKanjiByLesson(lessonId)
    │   RLS: kanji_select
    └─ Hiển thị: character, meaning, onyomi/kunyomi, radical, stroke count
    ↓
Bước 3: Học sinh vẽ trên Canvas
    ├─ Canvas API: theo dõi pointer events
    ├─ Hiển thị guide lines (grid 5x5) và stroke order animation
    ├─ Cho phép xóa / undo nét cuối / clear all
    └─ Submit khi hoàn thành
    ↓
Bước 4: Gửi nét vẽ để đánh giá
    ├─ Chuyển canvas → base64 PNG image
    ├─ Gọi aiService.evaluateExercise('writing', kanji.character, '', 'japanese', imageData)
    │   ├─ Provider: Gemini (ưu tiên) → Cloudflare → OpenRouter
    │   └─ System prompt: đánh giá độ chính xác nét vẽ
    │
    └─ Parse AI response → { score, feedback, tips }
    ↓
Bước 5: Hiển thị kết quả
    ├─ Hiển thị điểm (0-100) với màu sắc (đỏ/vàng/xanh)
    ├─ Hiện AI feedback + tips cải thiện
    ├─ So sánh với mẫu stroke order
    └─ Cho phép thử lại hoặc next kanji
    ↓
Bước 6: Cộng XP
    └─ addExperiencePoints(user.id, score / 10) — tối đa 10 XP mỗi từ
```

**Lưu ý:** Nếu AI không khả dụng (không có API key), vẫn hiển thị stroke order guide nhưng bỏ qua đánh giá tự động.

---

### Flow 8 — AI Roleplay (Hội thoại với AI)

**Mục đích:** Học sinh luyện nói theo kịch bản (roleplay) với AI.

```
AIConversation → load scenario → conversation loop → scoring → XP
```

**Các bước chi tiết:**

```
Bước 1: Học sinh truy cập /ai-conversation
    ├─ ProtectedRoute.requireEnrollment()
    ├─ Load danh sách scenarios từ roleplay_camping.json
    │   └─ Có thể mở rộng: load từ DB
    └─ Hiển thị grid scenario cards (restaurant, hotel, shopping...)
    ↓
Bước 2: Học sinh chọn scenario
    ├─ Đọc scenario prompt + language tag ([JP] hoặc [ZH])
    ├─ Tạo system prompt = createSystemPrompt(scenarioPrompt, language)
    │   └─ System prompt quy định:
    │       ├─ AI đóng vai nhân viên
    │       ├─ Luôn trả lời bằng JP/CN + dịch [VI]
    │       └─ Cuối mỗi response có [OP] = 3 gợi ý cho HS
    └─ Khởi tạo conversation state (messages array)
    ↓
Bước 3: Học sinh chọn gợi ý hoặc nhập câu
    ├─ Nút [OP]: bấm → tự động điền vào input
    ├─ Nhập tay: gõ câu JP/CN bằng bàn phím
    └─ Ghi âm: VoiceRecorder → Web Speech API → text → điền vào input
    ↓
Bước 4: Gửi tin nhắn cho AI
    ├─ Thêm user message vào messages array
    ├─ Gọi getAIResponse(messages, language, provider)
    │   ├─ Provider chain: OpenRouter → Gemini → Cloudflare
    │   ├─ Parse Gemini response: candidates[0].content.parts[].text
    │   └─ Format response = formatAIResponse(content, language)
    │       └─ Đảm bảo có [JP/ZH], [VI], [OP]
    │
    ├─ Thêm AI response vào messages array
    └─ Cập nhật conversation history (localStorage)
    ↓
Bước 5: Lặp lại bước 3-4
    ├─ Giới hạn: tối đa 20 lượt hội thoại
    ├─ Mỗi lượt HS: cộng 5 XP
    └─ Khi kết thúc (HS bấm "Kết thúc" hoặc đạt giới hạn)
    ↓
Bước 6: Tính điểm & hiển thị kết quả
    ├─ Đếm số lượt hội thoại
    ├─ Tính điểm: base XP + bonus (nhiều lượt hơn → bonus cao hơn)
    ├─ addExperiencePoints(user.id, totalXP)
    └─ Hiện summary: số lượt, tổng XP, câu hay dùng
```

**AI Provider Priority:**

```
1. OpenRouter (qwen/qwen-2.5-7b-instruct) — nếu VITE_OPENROUTER_API_KEY
2. Gemini (gemini-2.0-flash) — nếu VITE_GEMINI_API_KEY
3. Cloudflare Worker — nếu VITE_CLOUDFLARE_WORKER_URL
4. Fallback → thông báo lỗi
```

---

### Flow 9 — Diễn đàn (Forum)

**Mục đựng:** Học sinh đăng bài, reply, thảo luận theo chủ đề.

```
Forum → load categories → create post → reply → search
```

**Các bước chi tiết:**

```
Bước 1: Load forum categories
    ├─ Gọi forumService.getForumCategories()
    │   ├─ Query: supabase.from('forum_categories').select('*').order('order_index')
    │   └─ RLS: forum_categories_select (public read)
    └─ Cache vào state (refetch khi mở modal create)
    ↓
Bước 2: Load danh sách bài viết
    ├─ Gọi forumService.getForumPosts(categoryId?)
    │   ├─ Query: forum_posts (filtered by category if selected)
    │   ├─ Fetch profiles riêng (2-step: posts → user_ids → profiles → merge)
    │   │   └─ Nguyên nhân: tránh lỗi PGRST200 khi FK schema cache chưa sync
    │   ├─ Embed: reply count (COUNT query riêng)
    │   └─ RLS: forum_posts_select
    │
    └─ Pagination: limit 20, offset theo page
    ↓
Bước 3: Học sinh tạo bài viết mới
    ├─ Bấm "Tạo bài viết" → mở modal
    ├─ Fetch categories lại (đảm bảo mới nhất)
    ├─ Chọn category từ grid chips (giao diện mới, thay select cũ)
    ├─ Nhập tiêu đề + nội dung
    └─ Bấm "Đăng"
        ├─ Gọi forumService.createForumPost({ category_id, title, content, user_id })
        │   ├─ INSERT: forum_posts
        │   └─ RLS: forum_posts_insert
        │
        └─ Thêm bài viết mới vào danh sách (optimistic update)
    ↓
Bước 4: Xem chi tiết bài viết → ForumPost
    ├─ Gọi forumService.getForumPostById(postId)
    │   └─ Fetch post + author profile (2-step)
    ├─ Gọi forumService.getForumReplies(postId)
    │   └─ Fetch replies + author profiles (2-step)
    └─ Hiển thị: bài viết gốc + replies + form trả lời
    ↓
Bước 5: Reply bài viết
    ├─ Nhập nội dung reply → bấm "Gửi"
    ├─ Gọi forumService.createForumReply({ post_id, content, user_id })
    │   └─ INSERT: forum_replies
    └─ Thêm reply mới vào danh sách
    ↓
Bước 6: Tìm kiếm bài viết
    ├─ Nhập từ khóa → debounce 300ms
    ├─ Gọi forumService.searchForumPosts(query)
    │   ├─ Query: forum_posts (title OR content LIKE %query%)
    │   └─ Fetch profiles 2-step
    └─ Hiển thị kết quả
```

**2-Step Profile Fetch Pattern:**

```typescript
// Thay vì supabase.from('posts').select('*, profiles(*)')
// (sẽ lỗi PGRST200 nếu FK không được PostgREST nhận diện)

const { data: posts } = await supabase.from('forum_posts').select('*').eq('category_id', id);
const userIds = [...new Set(posts.map(p => p.user_id))];
const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
const merged = posts.map(post => ({ ...post, profiles: profileMap[post.user_id] }));
```

---

### Flow 10 — Tìm bạn học chung (Peer Matching)

**Mục đích:** Kết nối học viên có cùng mục tiêu để học cùng nhau.

```
PeerMatching → create profile → browse peers → send request → match → chat
```

**Các bước chi tiết:**

```
Bước 1: Thiết lập hồ sơ tìm bạn (lần đầu)
    ├─ Gọi peerMatchingService.getPeerProfile(user.id)
    │   ├─ Query: peer_profiles WHERE user_id = user.id
    │   └─ Nếu chưa có → hiện form tạo profile
    │
    ├─ Học sinh điền form:
    │   ├─ Ngôn ngữ học: tiếng Nhật / tiếng Trung / cả hai
    │   ├─ Trình độ hiện tại: N5, N4, N3...
    │   ├─ Mục tiêu học tập: gì?
    │   ├─ Thời gian rảnh: ngày nào, mấy giờ
    │   └─ Giới thiệu bản thân
    │
    └─ Bấm "Lưu hồ sơ"
        ├─ Gọi peerMatchingService.updatePeerProfile(profileData)
        │   ├─ INSERT hoặc UPDATE: peer_profiles
        │   └─ RLS: peer_profiles_insert/update
        │
        └─ Error handling: hiện .peer-error-banner nếu lỗi FK
    ↓
Bước 2: Browse danh sách peer
    ├─ Gọi peerMatchingService.browsePeers(user.id, filters)
    │   ├─ Query: peer_profiles WHERE user_id != currentUser
    │   ├─ Filter: ngôn ngữ, trình độ, thời gian rảnh
    │   ├─ Fetch profiles 2-step (tránh PGRST200)
    │   └─ RLS: peer_profiles_select
    └─ Hiển thị cards: avatar, name, ngôn ngữ, level, thời gian
    ↓
Bước 3: Gửi yêu cầu kết nối
    ├─ Bấm "Kết nối" trên peer card
    ├─ Gọi peerMatchingService.sendMatchRequest(senderId, receiverId)
    │   ├─ Kiểm tra: đã gửi chưa? → đã nhận chưa?
    │   ├─ INSERT: peer_match_requests (sender_id, receiver_id, status='pending')
    │   └─ RLS: peer_match_requests_insert
    └─ UI: disable nút "Kết nối" → hiện "Đã gửi"
    ↓
Bước 4: Người nhận xem và xử lý yêu cầu
    ├─ Gọi peerMatchingService.getReceivedMatchRequests(user.id)
    │   └─ Hiển thị notification badge
    ├─ Bấm "Chấp nhận" hoặc "Từ chối"
    │   └─ UPDATE: peer_match_requests SET status = 'accepted' | 'rejected'
    └─ Nếu accepted → cả hai vào trạng thái "matched"
    ↓
Bước 5: Nhắn tin peer
    ├─ Vào chat room với matched peer
    ├─ Gửi tin nhắn:
    │   ├─ INSERT: peer_chat_messages (sender_id, receiver_id, content)
    │   └─ RLS: peer_chat_messages_insert
    │
    └─ Load tin nhắn:
        ├─ Gọi peerMatchingService.getPeerChatMessages(userId, peerId)
        ├─ Query: peer_chat_messages
        │   WHERE (sender_id = user AND receiver_id = peer)
        │   OR (sender_id = peer AND receiver_id = user)
        └─ RLS: peer_chat_messages_select
```

---

### Flow 11 — Bảng xếp hạng (Leaderboard)

**Mục đích:** Hiển thị top 10 học viên có điểm cao nhất.

```
Leaderboard → query top 10 → fetch profiles → render ranked list
```

**Các bước chi tiết:**

```
Bước 1: Load leaderboard
    ├─ Gọi Leaderboard.fetchLeaderboard()
    │
    ├─ Bước 1a: Query user_stats (top 10)
    │   ├─ Query: supabase.from('user_stats')
    │   │   .select('user_id, total_points, level, current_streak')
    │   │   .order('total_points', ascending: false)
    │   │   .limit(10)
    │   └─ RLS: user_stats_select_leaderboard (FOR SELECT USING (true))
    │       ⚠️ Nếu thiếu policy này → chỉ trả về 1 dòng (của user đang login)
    │
    └─ Bước 1b: Fetch profiles
        ├─ Collect user_ids từ bước 1a
        ├─ Query: supabase.from('profiles')
        │   .select('id, full_name, avatar_url')
        │   .in('id', userIds)
        └─ Merge: stats + profile data
    ↓
Bước 2: Render leaderboard
    ├─ Top 3: gold/silver/bronze medals + gradient background
    ├─ 4-10: standard card layout
    ├─ Current user: highlight card với border đỏ
    └─ Nếu current user không trong top 10:
        ├─ Hiện section riêng phía dưới
        ├─ Gọi getUserStats(user.id) → vị trí cá nhân
        └─ Hiện "Vị trí của bạn"
    ↓
Bước 3: Cập nhật XP realtime
    ├─ Mỗi khi user hoàn thành activity → addExperiencePoints()
    └─ Leaderboard không auto-refresh → user reload trang để cập nhật
```

---

### Flow 12 — Admin tạo nội dung (Vocabulary CRUD)

**Mục đích:** Admin thêm/sửa từ vựng, Kanji, ngữ pháp vào hệ thống.

```
AdminPanel → AdminForm → adminService → vocabulary/kanji/grammar tables
```

**Các bước chi tiết:**

```
Bước 1: Admin truy cập /admin
    ├─ ProtectedRoute.requireAdmin()
    └─ Hiển thị dashboard với tabs: Khóa học | Bài học | Từ vựng | Kanji | Ngữ pháp
    ↓
Bước 2: Admin chọn tab "Từ vựng"
    ├─ Load vocabulary list: adminService.getVocabularyAdmin()
    │   ├─ Join: vocabulary + lessons + courses
    │   └─ Phân trang
    └─ Hiển thị table: từ, kanji, hiragana, nghĩa, bài học, độ khó
    ↓
Bước 3: Admin bấm "Thêm mới"
    ├─ Mở AdminForm modal
    ├─ Chọn loại: Từ vựng / Kanji / Ngữ pháp
    │
    └─ Điền form từ vựng:
        ├─ Chọn Bài học (dropdown lessons)
        ├─ Nhập Từ (word)
        ├─ Nhập Kanji (character)
        ├─ Nhập Hiragana/Pinyin
        ├─ Nhập Nghĩa (meaning)
        ├─ Nhập Ví dụ + dịch
        ├─ Chọn Ngôn ngữ: Tiếng Nhật / Tiếng Trung
        ├─ Chọn Độ khó: Dễ / Thường / Khó (difficulty-selector UI)
        ├─ Toggle: "Từ quan trọng" (is_difficult)
        ├─ Nút "▶ Mở rộng" → hiện JSON hint (gợi ý format cho AI)
        │   └─ Toggle hiện/ẩn: format-hint box
        │
        └─ Batch mode (thêm nhiều):
            ├─ Tab "Thêm từng từ" — 1 form
            ├─ Tab "Import hàng loạt" — textarea JSON
            │   └─ Parse JSON → tạo nhiều INSERT
            └─ Tab "AI Generator" — gọi AI tạo từ vựng
    ↓
Bước 4: Admin bấm "Lưu"
    ├─ Validate form: required fields
    │
    ├─ INSERT vocabulary
    │   ├─ INSERT: vocabulary
    │   └─ RLS: vocabulary_insert
    │
    ├─ Nếu batch mode:
    │   ├─ Parse JSON array
    │   ├─ Batch INSERT (transaction)
    │   └─ Trả về số lượng thêm thành công
    │
    └─ Thông báo thành công → đóng modal
    ↓
Bước 5: Vocabulary list tự động cập nhật
    └─ Refetch list sau khi đóng modal
```

---

### Flow 13 — Theme Switching (Dark/Light Mode)

**Mục đích:** User chuyển đổi giao diện sáng/tối toàn ứng dụng.

```
ThemeContext → CSS Variables → [data-theme] → all components
```

**Các bước chi tiết:**

```
Bước 1: App mount
    ├─ ThemeProvider đọc localStorage.getItem('theme')
    ├─ Mặc định: 'light'
    └─ Set: document.documentElement.setAttribute('data-theme', theme)
    ↓
Bước 2: CSS Variables cascade
    ├─ theme-variables.css: define :root variables (light defaults)
    ├─ [data-theme="dark"]: override dark mode variables
    ├─ Tất cả component CSS định nghĩa fallback values
    │   VD: background: var(--admin-bg, #f8fafc)
    └─ Kết quả: component tự động thay đổi màu khi theme đổi
    ↓
Bước 3: User bấm nút toggle theme (Header)
    ├─ Toggle state: 'light' ↔ 'dark'
    ├─ Cập nhật localStorage
    ├─ Set document.documentElement.setAttribute('data-theme', newTheme)
    └─ Animation: framer-motion transition (nếu có)
    ↓
Bước 4: Component re-render (không re-mount)
    └─ CSS tự động áp dụng biến màu mới → UI chuyển màu
```

---

### Flow 14 — Thanh toán (Payment)

**Mục đựng:** Học sinh mua khóa học qua PayOS.

```
CourseList → Payment → PayOS → Callback → user_courses
```

**Các bước chi tiết:**

```
Bước 1: Học sinh xem khóa học tại /courses
    ├─ Load courses: adminService.getAllCourses()
    │   RLS: courses_select (public read)
    └─ Hiển thị: khóa học + giá + nút "Mua ngay"
    ↓
Bước 2: Học sinh bấm "Mua"
    ├─ Kiểm tra: đã mua chưa? → user_courses
    ├─ Tạo payment link:
    │   ├─ POST /api/create-payment-link (Supabase Edge Function)
    │   │   ├─ Tạo order với PayOS
    │   │   └─ Trả về paymentUrl
    │   └─ Redirect đến paymentUrl của PayOS
    ↓
Bước 3: Học sinh thanh toán trên PayOS
    └─ Sau khi thanh toán thành công → PayOS redirect về:
        /payment/success?orderCode=XXX
        HOẶC /payment/cancel (nếu hủy)
    ↓
Bước 4: PaymentSuccess xử lý callback
    ├─ Verify: gọi PayOS API kiểm tra payment status
    ├─ Nếu thành công:
    │   ├─ INSERT: user_courses (user_id, course_id)
    │   └─ INSERT: payments (ghi nhận transaction)
    │
    ├─ Hiển thị thông báo thành công
    └─ Học sinh có thể truy cập khóa học
    ↓
Bước 5: PaymentCancel xử lý hủy
    ├─ Không làm gì, chỉ hiển thị thông báo
    └─ Redirect về /courses
```

---

## Hướng dẫn cài đặt

### Yêu cầu

- Node.js 18+
- npm 9+
- Tài khoản Supabase (free tier đủ dùng)
- API Key Gemini (optional, cho AI roleplay)

### Các bước

```bash
# 1. Clone repo
git clone https://github.com/your-username/Japanese.git
cd Japanese

# 2. Cài dependencies
npm install

# 3. Tạo file .env.local
cp .env.example .env.local
```

### Cấu hình `.env.local`

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI (optional - cho AI Roleplay)
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_AI_PROVIDER=gemini
```

### Thiết lập Supabase Database

1. Tạo project mới tại [supabase.com](https://supabase.com)
2. Mở **SQL Editor** và chạy lần lượt:

```sql
-- Bước 1: Chạy schema đầy đủ
supabase/schema.sql

-- Bước 2: Fix RLS diễn đàn (nếu cần)
supabase/forum_categories_rls.sql

-- Bước 3: Fix RLS leaderboard (nếu cần)
supabase/user_stats_leaderboard_rls.sql

-- Bước 4: Seed dữ liệu demo
supabase/quick_insert_data.sql

-- Bước 5: Seed demo users (cho leaderboard)
supabase/seed_demo_users.sql

-- Bước 6: Seed leaderboard stats
supabase/seed_leaderboard_data.sql
```

### Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

---

## Hướng dẫn triển khai

### Deploy lên Vercel

```bash
# Build production
npm run build

# Deploy lên Vercel (nếu dùng Vercel CLI)
npx vercel --prod
```

### Các biến môi trường production

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `VITE_GEMINI_API_KEY` | Tùy chọn | Gemini API key |
| `VITE_AI_PROVIDER` | Tùy chọn | `gemini` hoặc `openai` |

### Supabase Edge Functions (AI Roleplay)

Nếu dùng Cloudflare Worker làm proxy cho Gemini:

```bash
# Deploy Cloudflare Worker
cd cloudflare-worker
npx wrangler deploy
```

Cập nhật `VITE_AI_PROXY_URL` trong `.env` với URL của Worker.

---

## Các lưu ý quan trọng

### RLS và Foreign Key

- **Luôn kiểm tra RLS** khi query không trả về dữ liệu — Supabase trả về `[]` (không lỗi) nếu không có policy SELECT
- **PostgREST FK embedding** yêu cầu FK constraint trong schema. Nếu lỗi `PGRST200`, thêm FK hoặc refactor sang manual join
- Chạy `supabase.db.reset()` để reset schema cache khi thay đổi cấu trúc bảng

### Seed Data

- `seed_demo_users.sql` sử dụng trick **tạm thời drop FK constraint** để insert vào `profiles` mà không cần `auth.users`
- Chạy `seed_demo_users.sql` **TRƯỚC** `seed_leaderboard_data.sql`

### Code Formatting

```bash
# Format code
npm run format

# Check format
npm run format:check
```
