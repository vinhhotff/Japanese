-- ============================================================
-- Community Features: Forum + Peer Matching
-- Run this migration to create the required tables
-- ============================================================

-- Enable UUID extension (already present but safe to re-run)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FORUM TABLES
-- ============================================================

-- Forum Categories
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) NOT NULL DEFAULT '💬',
  color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Posts
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Replies
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Forum
CREATE INDEX IF NOT EXISTS idx_forum_posts_category_id ON forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_last_reply_at ON forum_posts(last_reply_at);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_user_id ON forum_replies(user_id);

-- Trigger for forum_posts updated_at
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for forum_replies updated_at
CREATE TRIGGER update_forum_replies_updated_at BEFORE UPDATE ON forum_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PEER MATCHING TABLES
-- ============================================================

-- Peer Profiles (study partner profiles)
CREATE TABLE IF NOT EXISTS peer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  language VARCHAR(20) DEFAULT 'japanese' CHECK (language IN ('japanese', 'chinese', 'both')),
  study_level VARCHAR(20) DEFAULT 'N5',
  study_goal VARCHAR(50) DEFAULT 'jlpt',
  available_days TEXT[] DEFAULT '{}',
  available_hours VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
  avatar_url TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE,
  total_matches INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Peer Match Requests
CREATE TABLE IF NOT EXISTS peer_match_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peer Chat Messages
CREATE TABLE IF NOT EXISTS peer_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES peer_match_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Peer Matching
CREATE INDEX IF NOT EXISTS idx_peer_profiles_user_id ON peer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_profiles_language ON peer_profiles(language);
CREATE INDEX IF NOT EXISTS idx_peer_profiles_level ON peer_profiles(study_level);
CREATE INDEX IF NOT EXISTS idx_peer_match_requests_from ON peer_match_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_match_requests_to ON peer_match_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_match_requests_status ON peer_match_requests(status);
CREATE INDEX IF NOT EXISTS idx_peer_chat_messages_match_id ON peer_chat_messages(match_id);

-- Trigger for peer_profiles updated_at
CREATE TRIGGER update_peer_profiles_updated_at BEFORE UPDATE ON peer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for peer_match_requests updated_at
CREATE TRIGGER update_peer_match_requests_updated_at BEFORE UPDATE ON peer_match_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DEFAULT FORUM CATEGORIES
-- ============================================================

INSERT INTO forum_categories (name, description, icon, color, order_index) VALUES
  ('Hỏi đáp Tiếng Nhật', 'Đặt câu hỏi về ngữ pháp, từ vựng, và cách sử dụng tiếng Nhật', '🇯🇵', '#ef4444', 1),
  ('Hỏi đáp Tiếng Trung', 'Thắc mắc về Hanzi, Pinyin, ngữ pháp tiếng Trung', '🇨🇳', '#f59e0b', 2),
  ('Chia sẻ tài liệu', 'Chia sẻ sách, video, website học tiếng hữu ích', '📚', '#10b981', 3),
  ('Kinh nghiệm học tập', 'Chia sẻ phương pháp và kinh nghiệm học hiệu quả', '💡', '#6366f1', 4),
  ('Luyện thi JLPT / HSK', 'Thảo luận về lộ trình và tài liệu luyện thi', '📝', '#8b5cf6', 5),
  ('Góc giải trí', 'Nghỉ ngơi, giao lưu, chia sẻ văn hóa Nhật Bản / Trung Quốc', '🎌', '#ec4899', 6)
ON CONFLICT DO NOTHING;
