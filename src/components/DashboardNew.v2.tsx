import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCourses } from '../services/supabaseService.v2';
import { getProgressStats } from '../services/progressService';
import '../styles/dashboard-v2.css';

type Language = 'japanese' | 'chinese';

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
  const levelColors: Record<string, string> = {
    'N5': '#10b981', 'N4': '#3b82f6', 'N3': '#f59e0b', 'N2': '#ef4444', 'N1': '#8b5cf6',
    'HSK1': '#10b981', 'HSK2': '#3b82f6', 'HSK3': '#f59e0b', 'HSK4': '#ef4444', 'HSK5': '#8b5cf6', 'HSK6': '#ec4899',
  };

  return (
    <div className="dashboard-v2-container">
      {/* Floating Characters Background */}
      <div className="floating-characters">
        {selectedLanguage === 'japanese' ? (
          <>
            <span className="float-char char-1">あ</span>
            <span className="float-char char-2">か</span>
            <span className="float-char char-3">さ</span>
            <span className="float-char char-4">た</span>
            <span className="float-char char-5">な</span>
            <span className="float-char char-6">は</span>
            <span className="float-char char-7">ま</span>
            <span className="float-char char-8">や</span>
            <span className="float-char char-9">ら</span>
            <span className="float-char char-10">わ</span>
            <span className="float-char char-11">学</span>
            <span className="float-char char-12">日</span>
          </>
        ) : (
          <>
            <span className="float-char char-1">你</span>
            <span className="float-char char-2">好</span>
            <span className="float-char char-3">学</span>
            <span className="float-char char-4">习</span>
            <span className="float-char char-5">中</span>
            <span className="float-char char-6">文</span>
            <span className="float-char char-7">汉</span>
            <span className="float-char char-8">字</span>
            <span className="float-char char-9">语</span>
            <span className="float-char char-10">言</span>
            <span className="float-char char-11">书</span>
            <span className="float-char char-12">写</span>
          </>
        )}
      </div>

      {/* Compact Header */}
      <div className="compact-header">
        <h1 className="main-title">
          <span className="gradient-text">Học Ngôn Ngữ</span> Cùng AI
        </h1>
        
        {/* Language Tabs */}
        <div className="language-tabs">
          <button
            className={`lang-tab ${selectedLanguage === 'japanese' ? 'active' : ''}`}
            onClick={() => setSelectedLanguage('japanese')}
          >
            <span className="tab-flag">🇯🇵</span>
            <span className="tab-name">Tiếng Nhật</span>
            <span className="tab-count">{japaneseCourses.reduce((sum, g) => sum + g.count, 0)}</span>
          </button>
          <button
            className={`lang-tab ${selectedLanguage === 'chinese' ? 'active' : ''}`}
            onClick={() => setSelectedLanguage('chinese')}
          >
            <span className="tab-flag">🇨🇳</span>
            <span className="tab-name">Tiếng Trung</span>
            <span className="tab-count">{chineseCourses.reduce((sum, g) => sum + g.count, 0)}</span>
          </button>
        </div>
      </div>

      {/* Courses Section */}
      <div className="courses-section">

        <div className="levels-grid">
          {currentCourses.map((group, index) => (
            <Link
              key={group.level}
              to={`/${selectedLanguage}/courses/${group.level}`}
              className="level-card"
              style={{
                '--card-color': levelColors[group.level],
                '--delay': `${index * 0.1}s`,
              } as React.CSSProperties}
            >
              <div className="level-badge" style={{ background: levelColors[group.level] }}>
                {group.level}
              </div>
              <div className="level-content">
                <h3 className="level-title">{group.level}</h3>
                <p className="level-description">
                  {group.count} khóa học
                </p>
                <div className="level-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '0%' }}></div>
                  </div>
                  <span className="progress-text">Bắt đầu học</span>
                </div>
              </div>
              <div className="level-icon">
                {selectedLanguage === 'japanese' ? '🗾' : '🏮'}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Features Bar */}
      <div className="quick-features">
        <Link to={`/${selectedLanguage}/dictionary`} className="quick-feature">
          <span className="qf-icon">📖</span>
          <span className="qf-label">Từ điển</span>
        </Link>
        <Link to={`/${selectedLanguage}/vocabulary-practice`} className="quick-feature">
          <span className="qf-icon">🎯</span>
          <span className="qf-label">Luyện từ</span>
        </Link>
        <Link to={`/${selectedLanguage}/${selectedLanguage === 'japanese' ? 'kanji' : 'hanzi'}-writing`} className="quick-feature">
          <span className="qf-icon">✍️</span>
          <span className="qf-label">Luyện viết</span>
        </Link>
        <Link to="/ai-conversation" className="quick-feature">
          <span className="qf-icon">💬</span>
          <span className="qf-label">Chat AI</span>
        </Link>
        <Link to="/ai-roleplay" className="quick-feature">
          <span className="qf-icon">🎭</span>
          <span className="qf-label">Roleplay</span>
        </Link>
      </div>
    </div>
  );
};

export default DashboardNew;
