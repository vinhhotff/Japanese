import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getLessons } from '../services/supabaseService.v2';
import type { Language } from '../services/supabaseService.v2';
import '../App.css';

const AllCourses = () => {
  const [japaneseCourses, setJapaneseCourses] = useState<any[]>([]);
  const [chineseCourses, setChineseCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<'japanese' | 'chinese'>('japanese');

  useEffect(() => {
    loadAllCourses();
  }, []);

  const loadAllCourses = async () => {
    setLoading(true);
    setError(null);

    let jpCoursesData: any[] = [];
    let jpLessonsData: any[] = [];

    try {
      const [coursesResult, lessonsResult] = await Promise.all([
        getCourses('japanese', 1, 100),
        getLessons(undefined, 'japanese', undefined, 1, 100),
      ]);

      jpCoursesData = coursesResult.data || [];
      jpLessonsData = lessonsResult.data || [];
    } catch (e: any) {
      console.error('Failed to load Japanese data:', e);
      if (e.message?.includes('timed out')) {
        setError('Kết nối Database bị quá tải hoặc gián đoạn. Vui lòng kiểm tra kết nối mạng.');
      }
    }

    let cnCoursesData: any[] = [];
    let cnLessonsData: any[] = [];

    try {
      const [coursesResult, lessonsResult] = await Promise.all([
        getCourses('chinese', 1, 100),
        getLessons(undefined, 'chinese', undefined, 1, 100),
      ]);

      cnCoursesData = coursesResult.data || [];
      cnLessonsData = lessonsResult.data || [];
    } catch (e: any) {
      console.error('Failed to load Chinese data:', e);
      if (!error) setError('Không thể tải dữ liệu Tiếng Trung. Vui lòng thử lại.');
    }

    try {
      let japaneseGrouped = groupCoursesByLevel(
        jpCoursesData,
        jpLessonsData,
        ['N5', 'N4', 'N3', 'N2', 'N1']
      );

      if (japaneseGrouped.length === 0) {
        japaneseGrouped = ['N5', 'N4', 'N3', 'N2', 'N1'].map(level => ({
          level,
          title: level,
          lessons: [],
          totalLessons: 0,
        }));
      }

      let chineseGrouped = groupCoursesByLevel(
        cnCoursesData,
        cnLessonsData,
        ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']
      );

      if (chineseGrouped.length === 0) {
        chineseGrouped = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map(level => ({
          level,
          title: level,
          lessons: [],
          totalLessons: 0,
        }));
      }

      setJapaneseCourses(japaneseGrouped);
      setChineseCourses(chineseGrouped);
    } catch (err: any) {
      console.error('Error processing courses:', err);
      const japanesePlaceholder = ['N5', 'N4', 'N3', 'N2', 'N1'].map(level => ({
        level,
        title: level,
        lessons: [],
        totalLessons: 0,
      }));
      const chinesePlaceholder = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map(level => ({
        level,
        title: level,
        lessons: [],
        totalLessons: 0,
      }));
      setJapaneseCourses(japanesePlaceholder);
      setChineseCourses(chinesePlaceholder);
    } finally {
      setLoading(false);
    }
  };

  const groupCoursesByLevel = (coursesData: any[], lessonsData: any[], levelOrder: string[]) => {
    const coursesByLevel: Record<string, any[]> = {};

    coursesData.forEach(course => {
      if (!coursesByLevel[course.level]) {
        coursesByLevel[course.level] = [];
      }
      coursesByLevel[course.level].push(course);
    });

    return levelOrder
      .filter(level => coursesByLevel[level] && coursesByLevel[level].length > 0)
      .map(level => {
        const allLessons = lessonsData.filter(l => {
          const courseId = l.course_id || l.course?.id;
          return coursesByLevel[level].some(c => c.id === courseId);
        });

        const totalLessons = allLessons.length;

        return {
          level,
          title: `${level}`,
          lessons: allLessons,
          totalLessons,
        };
      });
  };

  const currentCourses = activeLanguage === 'japanese' ? japaneseCourses : chineseCourses;
  const levelInfo = {
    japanese: {
      title: 'Tiếng Nhật',
      subtitle: 'Từ N5 đến N1',
      levels: ['N5', 'N4', 'N3', 'N2', 'N1']
    },
    chinese: {
      title: 'Tiếng Trung',
      subtitle: 'Từ HSK1 đến HSK6',
      levels: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'N5': '#10b981',
      'N4': '#3b82f6',
      'N3': '#8b5cf6',
      'N2': '#f59e0b',
      'N1': '#ef4444',
      'HSK1': '#10b981',
      'HSK2': '#06b6d4',
      'HSK3': '#3b82f6',
      'HSK4': '#8b5cf6',
      'HSK5': '#f59e0b',
      'HSK6': '#ef4444',
    };
    return colors[level] || '#6366f1';
  };

  const getLevelDescription = (level: string, language: string) => {
    const descriptions: Record<string, Record<string, string>> = {
      japanese: {
        'N5': 'Cơ bản nhất, học bảng chữ cái và mẫu câu đơn giản',
        'N4': 'Nền tảng vững chắc, từ vựng và ngữ pháp cơ bản',
        'N3': 'Trung cấp, giao tiếp hàng ngày và văn bản đơn giản',
        'N2': 'Tiền trung cấp, đọc hiểu và nghe nói fluently',
        'N1': 'Cao cấp, thành thạo tiếng Nhật chuyên sâu',
      },
      chinese: {
        'HSK1': '150 từ vựng cơ bản nhất',
        'HSK2': '300 từ vựng, giao tiếp đơn giản',
        'HSK3': '600 từ vựng, cuộc sống hàng ngày',
        'HSK4': '1200 từ vựng, thảo luận các chủ đề phức tạp',
        'HSK5': '2500 từ vựng, đọc báo và viết bài luận',
        'HSK6': '5000 từ vựng, thành thạo ngôn ngữ',
      }
    };
    return descriptions[language]?.[level] || '';
  };

  if (loading) {
    return (
      <div className="courses-page">
        <div className="courses-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <style>{`
        .courses-page {
          min-height: 100vh;
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .courses-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .courses-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .courses-header p {
          font-size: 1.125rem;
          color: var(--text-secondary);
        }

        .language-tabs {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 3rem;
        }

        .lang-tab {
          padding: 0.875rem 2rem;
          border-radius: 12px;
          border: 2px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lang-tab:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .lang-tab.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .course-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }

        .course-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        }

        .course-card.locked {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .course-card.locked:hover {
          transform: none;
          box-shadow: none;
        }

        .course-header {
          padding: 1.5rem;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .course-level {
          font-size: 2rem;
          font-weight: 800;
        }

        .course-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .course-body {
          padding: 1.25rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .course-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .course-description {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 1rem;
          flex: 1;
        }

        .course-progress {
          margin-bottom: 1rem;
        }

        .progress-bar {
          height: 6px;
          background: var(--border-color);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        .progress-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .course-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .course-lessons {
          font-size: 0.875rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .course-btn {
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .course-btn.primary {
          background: var(--primary-color);
          color: white;
        }

        .course-btn.primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .course-btn.outline {
          background: transparent;
          border: 1.5px solid var(--border-color);
          color: var(--text-secondary);
        }

        .courses-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 1rem;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid var(--border-color);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 2rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--primary-color);
        }

        @media (max-width: 768px) {
          .courses-page {
            padding: 1rem;
          }

          .courses-header h1 {
            font-size: 1.75rem;
          }

          .language-tabs {
            flex-direction: column;
            align-items: stretch;
          }

          .lang-tab {
            justify-content: center;
          }

          .courses-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <Link to="/" className="back-link">
        <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Về trang chủ
      </Link>

      <div className="courses-header">
        <h1>
          <svg style={{ width: '36px', height: '36px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Khóa học
        </h1>
        <p>Chọn ngôn ngữ và cấp độ phù hợp để bắt đầu hành trình học tập</p>
      </div>

      <div className="language-tabs">
        <button
          className={`lang-tab ${activeLanguage === 'japanese' ? 'active' : ''}`}
          onClick={() => setActiveLanguage('japanese')}
        >
          🇯🇵 {levelInfo.japanese.title}
        </button>
        <button
          className={`lang-tab ${activeLanguage === 'chinese' ? 'active' : ''}`}
          onClick={() => setActiveLanguage('chinese')}
        >
          🇨🇳 {levelInfo.chinese.title}
        </button>
      </div>

      {currentCourses.length === 0 ? (
        <div className="empty-state">
          {error ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <p style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Không thể tải dữ liệu</p>
              <p style={{ marginBottom: '1rem' }}>{error}</p>
              <button
                onClick={() => loadAllCourses()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Thử lại
              </button>
            </>
          ) : (
            <p>Chưa có khóa học nào.</p>
          )}
        </div>
      ) : (
        <div className="courses-grid">
          {currentCourses.map((course) => {
            const hasLessons = course.totalLessons > 0;
            const color = getLevelColor(course.level);
            const description = getLevelDescription(course.level, activeLanguage);

            const CardWrapper = hasLessons ? Link : 'div';
            const wrapperProps = hasLessons
              ? { to: `/${activeLanguage}/courses/${course.level}`, style: { textDecoration: 'none' } }
              : { style: { textDecoration: 'none' } };

            return (
              <CardWrapper key={course.level} {...wrapperProps}>
                <div className={`course-card ${!hasLessons ? 'locked' : ''}`}>
                  <div className="course-header" style={{ backgroundColor: color }}>
                    <span className="course-level">{course.level}</span>
                    <span className="course-badge">
                      {course.totalLessons > 0 ? `${course.totalLessons} bài` : 'Sắp ra mắt'}
                    </span>
                  </div>
                  <div className="course-body">
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-description">
                      {hasLessons ? description : 'Nội dung đang được phát triển'}
                    </p>
                    <div className="course-footer">
                      <span className="course-lessons">
                        <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {course.totalLessons} bài học
                      </span>
                      <button className={`course-btn ${hasLessons ? 'primary' : 'outline'}`}>
                        {hasLessons ? (
                          <>
                            Bắt đầu
                            <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        ) : (
                          'Sắp ra mắt'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </CardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllCourses;
