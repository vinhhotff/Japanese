import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCourses, getLessons } from '../services/supabaseService';
import { getProgressStats } from '../services/progressService';
import '../styles/theme-variables.css';
import '../styles/dashboard-improved.css';
import '../App.css';

const DashboardNew = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesData, lessonsData] = await Promise.all([
        getCourses(),
        getLessons(),
      ]);

      const coursesByLevel: Record<string, any[]> = {};
      const levelOrder = ['N5', 'N4', 'N3', 'N2', 'N1'];

      coursesData.forEach(course => {
        if (!coursesByLevel[course.level]) {
          coursesByLevel[course.level] = [];
        }
        coursesByLevel[course.level].push(course);
      });

      const groupedCourses = levelOrder
        .filter(level => coursesByLevel[level])
        .map(level => {
          const allLessons = lessonsData.filter(l => {
            const courseId = l.course_id || l.course?.id;
            return coursesByLevel[level].some(c => c.id === courseId);
          });

          return {
            level,
            title: `${level}`,
            lessons: allLessons,
          };
        });

      setCourses(groupedCourses);
      
      // Load stats
      const progressStats = getProgressStats();
      setStats(progressStats);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const levelColors: Record<string, string> = {
    'N5': '#10b981',
    'N4': '#3b82f6',
    'N3': '#f59e0b',
    'N2': '#ef4444',
    'N1': '#8b5cf6',
  };

  return (
    <div className="dashboard-container">
      {/* Hero Section - Duolingo Style */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🎯</span>
            <span>{t('dashboard.welcome')}</span>
          </div>
          <h1 className="hero-title">
            {t('dashboard.title')}
          </h1>
          <p className="hero-subtitle">
            {t('dashboard.subtitle')}
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-icon">📖</div>
              <div className="stat-content">
                <div className="stat-value">1000+</div>
                <div className="stat-label">{t('dashboard.features.vocabulary')}</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🤖</div>
              <div className="stat-content">
                <div className="stat-value">AI</div>
                <div className="stat-label">{t('dashboard.features.aiChat')}</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">✨</div>
              <div className="stat-content">
                <div className="stat-value">100%</div>
                <div className="stat-label">{t('dashboard.features.free')}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-illustration">
          <div className="floating-card card-1">あ</div>
          <div className="floating-card card-2">か</div>
          <div className="floating-card card-3">さ</div>
          <div className="floating-card card-4">た</div>
          <div className="floating-card card-5">な</div>
          <div className="floating-card card-6">は</div>
          <div className="floating-card card-7">ま</div>
          <div className="floating-card card-8">や</div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="courses-section">
        <div className="section-header">
          <h2 className="section-title">{t('dashboard.coursesTitle')}</h2>
          <p className="section-subtitle">{t('dashboard.coursesSubtitle')}</p>
        </div>
        
        <div className="courses-grid">
          {courses.map((course, index) => (
            <Link
              key={course.level}
              to={`/courses/${course.level}`}
              className="course-card"
              style={{ '--delay': `${index * 0.1}s` } as React.CSSProperties}
            >
              <div 
                className="course-card-header"
                style={{ 
                  background: `linear-gradient(135deg, ${levelColors[course.level]} 0%, ${levelColors[course.level]}dd 100%)` 
                }}
              >
                <div className="course-level">{course.level}</div>
                <div className="course-lessons">
                  {course.lessons.length} {t('dashboard.lessons')}
                </div>
              </div>
              <div className="course-card-body">
                <div className="course-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>
                <button className="course-button">
                  {t('course.startLearning')}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tools Section */}
      <div className="tools-section">
        <div className="section-header">
          <h2 className="section-title">{t('dashboard.toolsTitle')}</h2>
          <p className="section-subtitle">{t('dashboard.toolsSubtitle')}</p>
        </div>
        
        <div className="tools-grid">
          <Link to="/ai-conversation" className="tool-card tool-card-featured">
            <div className="tool-badge">NEW</div>
            <div className="tool-icon">💬</div>
            <h3 className="tool-title">{t('dashboard.aiConversation')}</h3>
            <p className="tool-description">{t('dashboard.aiConversationDesc')}</p>
            <div className="tool-button">{t('dashboard.tryNow')} →</div>
          </Link>

          <Link to="/voice-recorder" className="tool-card tool-card-featured">
            <div className="tool-badge">NEW</div>
            <div className="tool-icon">🎤</div>
            <h3 className="tool-title">{t('dashboard.voiceRecorder')}</h3>
            <p className="tool-description">{t('dashboard.voiceRecorderDesc')}</p>
            <div className="tool-button">{t('dashboard.tryNow')} →</div>
          </Link>

          <Link to="/dictionary" className="tool-card">
            <div className="tool-icon">📖</div>
            <h3 className="tool-title">{t('common.dictionary')}</h3>
            <p className="tool-description">{t('dashboard.dictionaryDesc')}</p>
            <div className="tool-button">{t('dashboard.openDictionary')} →</div>
          </Link>
        </div>

        <div className="other-tools">
          <h3 className="other-tools-title">{t('dashboard.otherTools')}</h3>
          <div className="other-tools-grid">
            <Link to="/vocabulary-practice" className="other-tool-item">
              <div className="other-tool-icon">✍️</div>
              <div>
                <div className="other-tool-name">{t('common.vocabularyPractice')}</div>
                <div className="other-tool-desc">{t('dashboard.vocabularyPracticeDesc')}</div>
              </div>
            </Link>
            <Link to="/spaced-repetition" className="other-tool-item">
              <div className="other-tool-icon">🔄</div>
              <div>
                <div className="other-tool-name">{t('common.srsReview')}</div>
                <div className="other-tool-desc">{t('dashboard.srsReviewDesc')}</div>
              </div>
            </Link>
            <Link to="/kanji-writing" className="other-tool-item">
              <div className="other-tool-icon">🖋️</div>
              <div>
                <div className="other-tool-name">{t('common.kanjiWriting')}</div>
                <div className="other-tool-desc">{t('dashboard.kanjiWritingDesc')}</div>
              </div>
            </Link>
            <Link to="/study-progress" className="other-tool-item">
              <div className="other-tool-icon">📊</div>
              <div>
                <div className="other-tool-name">{t('common.statistics')}</div>
                <div className="other-tool-desc">{t('dashboard.statisticsDesc')}</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNew;
