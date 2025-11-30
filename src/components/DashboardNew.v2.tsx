import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCourses } from '../services/supabaseService.v2';
import { getProgressStats } from '../services/progressService';
import '../styles/dashboard-v2.css';

type Language = 'japanese' | 'chinese';

interface LevelInfo {
  level: string;
  name: string;
  description: string;
  icon: string;
}

const DashboardNew = () => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('japanese');
  const [japaneseCourses, setJapaneseCourses] = useState<any[]>([]);
  const [chineseCourses, setChineseCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [japaneseData, chineseData] = await Promise.all([
        getCourses('japanese', 1, 100),
        getCourses('chinese', 1, 100),
      ]);

      // Group by level
      const groupJapanese = groupCoursesByLevel(japaneseData.data, ['N5', 'N4', 'N3', 'N2', 'N1']);
      const groupChinese = groupCoursesByLevel(chineseData.data, ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']);

      setJapaneseCourses(groupJapanese);
      setChineseCourses(groupChinese);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupCoursesByLevel = (courses: any[], levels: string[]) => {
    const grouped: Record<string, any[]> = {};
    levels.forEach(level => {
      grouped[level] = courses.filter(c => c.level === level);
    });
    return levels.map(level => ({
      level,
      courses: grouped[level] || [],
      count: grouped[level]?.length || 0,
    }));
  };

  if (loading) {
    return (
      <div className="dashboard-v2-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  const currentCourses = selectedLanguage === 'japanese' ? japaneseCourses : chineseCourses;
  
  const levelInfo: Record<string, LevelInfo> = {
    'N5': { level: 'N5', name: 'Sơ cấp', description: 'Nền tảng cơ bản', icon: '🌸' },
    'N4': { level: 'N4', name: 'Tiền trung cấp', description: 'Giao tiếp hàng ngày', icon: '🎋' },
    'N3': { level: 'N3', name: 'Trung cấp', description: 'Văn bản thông thường', icon: '🏯' },
    'N2': { level: 'N2', name: 'Trung cao cấp', description: 'Báo chí & công việc', icon: '⛩️' },
    'N1': { level: 'N1', name: 'Cao cấp', description: 'Chuyên môn & học thuật', icon: '🗾' },
    'HSK1': { level: 'HSK1', name: '初级', description: '基础汉语', icon: '🏮' },
    'HSK2': { level: 'HSK2', name: '初中级', description: '日常交流', icon: '🎐' },
    'HSK3': { level: 'HSK3', name: '中级', description: '生活应用', icon: '🐉' },
    'HSK4': { level: 'HSK4', name: '中高级', description: '广泛话题', icon: '🏛️' },
    'HSK5': { level: 'HSK5', name: '高级', description: '报刊阅读', icon: '📜' },
    'HSK6': { level: 'HSK6', name: '精通', description: '专业表达', icon: '🎎' },
  };

  const levelColors: Record<string, string> = {
    'N5': '#10b981', 'N4': '#3b82f6', 'N3': '#f59e0b', 'N2': '#ef4444', 'N1': '#8b5cf6',
    'HSK1': '#10b981', 'HSK2': '#3b82f6', 'HSK3': '#f59e0b', 'HSK4': '#ef4444', 'HSK5': '#8b5cf6', 'HSK6': '#ec4899',
  };

  return (
    <div 
      className="dashboard-v2-container"
      data-language={selectedLanguage}
    >
      {/* Cultural SVG Background Pattern */}
      <svg className="cultural-pattern" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          {selectedLanguage === 'japanese' ? (
            <>
              <pattern id="sakura-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="3" fill="#ffc0cb" opacity="0.15"/>
                <circle cx="150" cy="100" r="2" fill="#ffb6c1" opacity="0.12"/>
                <circle cx="100" cy="150" r="2.5" fill="#ffc0cb" opacity="0.1"/>
                <path d="M 30 30 Q 35 25 40 30 T 50 30" stroke="#c41e3a" strokeWidth="0.5" fill="none" opacity="0.08"/>
              </pattern>
              <radialGradient id="jp-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c41e3a" stopOpacity="0.05"/>
                <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
              </radialGradient>
            </>
          ) : (
            <>
              <pattern id="chinese-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="3" fill="#dc143c" opacity="0.12"/>
                <circle cx="150" cy="100" r="2" fill="#ffd700" opacity="0.1"/>
                <rect x="80" y="80" width="40" height="40" fill="none" stroke="#dc143c" strokeWidth="0.5" opacity="0.08"/>
              </pattern>
              <radialGradient id="cn-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#dc143c" stopOpacity="0.05"/>
                <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
              </radialGradient>
            </>
          )}
        </defs>
        <rect width="100%" height="100%" fill={`url(#${selectedLanguage === 'japanese' ? 'sakura' : 'chinese'}-pattern)`}/>
        <rect width="100%" height="100%" fill={`url(#${selectedLanguage === 'japanese' ? 'jp' : 'cn'}-glow)`}/>
      </svg>

      {/* Floating Characters Background */}
      <div className="floating-characters">
        {selectedLanguage === 'japanese' ? (
          <>
            <span className="float-char jp-char char-1">あ</span>
            <span className="float-char jp-char char-2">か</span>
            <span className="float-char jp-char char-3">さ</span>
            <span className="float-char jp-char char-4">た</span>
            <span className="float-char jp-char char-5">な</span>
            <span className="float-char jp-char char-6">は</span>
            <span className="float-char jp-char char-7">ま</span>
            <span className="float-char jp-char char-8">や</span>
            <span className="float-char jp-char char-9">ら</span>
            <span className="float-char jp-char char-10">わ</span>
            <span className="float-char jp-char char-11">学</span>
            <span className="float-char jp-char char-12">日</span>
          </>
        ) : (
          <>
            <span className="float-char cn-char char-1">你</span>
            <span className="float-char cn-char char-2">好</span>
            <span className="float-char cn-char char-3">学</span>
            <span className="float-char cn-char char-4">习</span>
            <span className="float-char cn-char char-5">中</span>
            <span className="float-char cn-char char-6">文</span>
            <span className="float-char cn-char char-7">汉</span>
            <span className="float-char cn-char char-8">字</span>
            <span className="float-char cn-char char-9">语</span>
            <span className="float-char cn-char char-10">言</span>
            <span className="float-char cn-char char-11">书</span>
            <span className="float-char cn-char char-12">写</span>
          </>
        )}
      </div>

      {/* Hero Header */}
      <div className="hero-header">
        <div className="hero-content">
          <div className="hero-badge">
            {selectedLanguage === 'japanese' ? '🌸 JLPT' : '🏮 HSK'}
          </div>
          <h1 className="hero-title">
            {selectedLanguage === 'japanese' ? (
              <>
                <span className="title-main">日本語を学ぼう</span>
                <span className="title-sub">
                  <span className="title-text">Học Tiếng Nhật </span>
                  <span className="title-highlight">Cùng AI</span>
                </span>
              </>
            ) : (
              <>
                <span className="title-main">学习中文</span>
                <span className="title-sub">
                  <span className="title-text">Học Tiếng Trung </span>
                  <span className="title-highlight">Cùng AI</span>
                </span>
              </>
            )}
          </h1>
          <p className="hero-description">
            {selectedLanguage === 'japanese' 
              ? 'Khám phá vẻ đẹp của tiếng Nhật qua hệ thống học tập thông minh với AI'
              : '通过智能AI系统探索中文之美 - Khám phá vẻ đẹp tiếng Trung với AI thông minh'
            }
          </p>
        </div>
        
        {/* Language Switcher */}
        <div className="language-switcher">
          <button
            className={`lang-switch-btn ${selectedLanguage === 'japanese' ? 'active' : ''}`}
            onClick={() => setSelectedLanguage('japanese')}
          >
            <div className="switch-flag">JP</div>
            <div className="switch-info">
              <span className="switch-name">日本語</span>
              <span className="switch-label">Tiếng Nhật</span>
              <span className="switch-count">{japaneseCourses.reduce((sum, g) => sum + g.count, 0)} khóa học</span>
            </div>
          </button>
          <button
            className={`lang-switch-btn ${selectedLanguage === 'chinese' ? 'active' : ''}`}
            onClick={() => setSelectedLanguage('chinese')}
          >
            <div className="switch-flag">CN</div>
            <div className="switch-info">
              <span className="switch-name">中文</span>
              <span className="switch-label">Tiếng Trung</span>
              <span className="switch-count">{chineseCourses.reduce((sum, g) => sum + g.count, 0)} khóa học</span>
            </div>
          </button>
        </div>
      </div>

      {/* Courses Section */}
      <div className="courses-section">
        <div className="section-title">
          <h2>{selectedLanguage === 'japanese' ? 'レベル別コース' : '等级课程'}</h2>
          <p>{selectedLanguage === 'japanese' ? 'Chọn cấp độ phù hợp với bạn' : '选择适合你的级别'}</p>
        </div>

        <div className="levels-grid">
          {currentCourses.map((group, index) => {
            const info = levelInfo[group.level];
            return (
              <Link
                key={group.level}
                to={`/${selectedLanguage}/courses/${group.level}`}
                className={`level-card ${selectedLanguage === 'japanese' ? 'jp-style' : 'cn-style'}`}
                style={{
                  '--card-color': levelColors[group.level],
                  '--delay': `${index * 0.1}s`,
                } as React.CSSProperties}
              >
                <div className="card-header">
                  <div className="card-flag">{selectedLanguage === 'japanese' ? '🇯🇵' : '🇨🇳'}</div>
                  <div className="level-badge" style={{ background: levelColors[group.level] }}>
                    <span className="badge-level">{group.level}</span>
                  </div>
                </div>
                
                <div className="card-body">
                  <h3 className="level-name">{info?.name || group.level}</h3>
                  <p className="level-desc">{info?.description || 'Khóa học'}</p>
                  
                  <div className="level-stats">
                    <div className="stat-item">
                      <svg className="stat-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                      <div className="stat-info">
                        <span className="stat-value">{group.count}</span>
                        <span className="stat-label">khóa học</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <svg className="stat-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <div className="stat-info">
                        <span className="stat-value">{group.count * 8}</span>
                        <span className="stat-label">giờ</span>
                      </div>
                    </div>
                  </div>

                  <div className="level-progress">
                    <div className="progress-info">
                      <span className="progress-label">Tiến độ</span>
                      <span className="progress-percent">0%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '0%', background: levelColors[group.level] }}></div>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <span className="start-btn">
                    Bắt đầu học
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* AI Features Section */}
      <div className="ai-features-section">
        <div className="section-title">
          <h2>🤖 Tính năng AI độc quyền</h2>
          <p>Học thông minh hơn với công nghệ AI tiên tiến</p>
        </div>
        
        <div className="features-grid">
          <Link to={`/${selectedLanguage}/dictionary`} className="feature-card">
            <svg className="feature-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <h3 className="feature-title">Từ điển thông minh</h3>
            <p className="feature-desc">Tra cứu nhanh với AI phân tích ngữ cảnh</p>
          </Link>
          
          <Link to={`/${selectedLanguage}/vocabulary-practice`} className="feature-card">
            <svg className="feature-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            <h3 className="feature-title">Luyện từ vựng</h3>
            <p className="feature-desc">Hệ thống ôn tập thông minh SRS</p>
          </Link>
          
          <Link to={`/${selectedLanguage}/${selectedLanguage === 'japanese' ? 'kanji' : 'hanzi'}-writing`} className="feature-card">
            <svg className="feature-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
            <h3 className="feature-title">Luyện viết chữ</h3>
            <p className="feature-desc">Nhận diện nét viết bằng AI</p>
          </Link>
          
          <Link to="/ai-conversation" className="feature-card feature-highlight">
            <svg className="feature-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h3 className="feature-title">Chat với AI</h3>
            <p className="feature-desc">Trò chuyện tự nhiên, học thực tế</p>
            <span className="feature-badge">HOT</span>
          </Link>
          
          <Link to="/ai-roleplay" className="feature-card feature-highlight">
            <svg className="feature-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
            <h3 className="feature-title">Roleplay AI</h3>
            <p className="feature-desc">Tình huống thực tế, phản hồi tức thì</p>
            <span className="feature-badge">NEW</span>
          </Link>
          
          <Link to="/study-progress" className="feature-card">
            <svg className="feature-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <h3 className="feature-title">Theo dõi tiến độ</h3>
            <p className="feature-desc">Phân tích chi tiết quá trình học</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardNew;
