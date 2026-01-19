import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getLessons } from '../services/supabaseService.v2';
import type { Language } from '../services/supabaseService.v2';
import FloatingCharacters from './FloatingCharacters';
import '../App.css';

const AllCourses = () => {
  const [japaneseCourses, setJapaneseCourses] = useState<any[]>([]);
  const [chineseCourses, setChineseCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllCourses();
  }, []);

  const loadAllCourses = async () => {
    setLoading(true);
    setError(null);

    // Japanese Data
    let jpCoursesData: any[] = [];
    let jpLessonsData: any[] = [];

    try {
      console.log('Fetching Japanese data...');
      const [coursesResult, lessonsResult] = await Promise.all([
        getCourses('japanese', 1, 100),
        getLessons(undefined, 'japanese', undefined, 1, 100),
      ]);

      jpCoursesData = coursesResult.data || [];
      jpLessonsData = lessonsResult.data || [];
      console.log('Japanese data loaded successfully');
    } catch (e: any) {
      console.error('Failed to load Japanese data:', e);
      if (e.message?.includes('timed out')) {
        setError('Kết nối Database bị quá tải hoặc gián đoạn. Vui lòng kiểm tra kết nối mạng.');
      }
    }

    // Chinese Data
    let cnCoursesData: any[] = [];
    let cnLessonsData: any[] = [];

    try {
      console.log('Fetching Chinese data...');
      const [coursesResult, lessonsResult] = await Promise.all([
        getCourses('chinese', 1, 100),
        getLessons(undefined, 'chinese', undefined, 1, 100),
      ]);

      cnCoursesData = coursesResult.data || [];
      cnLessonsData = lessonsResult.data || [];
      console.log('Chinese data loaded successfully');
    } catch (e: any) {
      console.error('Failed to load Chinese data:', e);
      // Don't overwrite Japanese error if it exists, but log it.
      // If we want to show error for Chinese too:
      if (!error) setError('Không thể tải dữ liệu Tiếng Trung. Vui lòng thử lại.');
    }

    try {
      // Process Japanese courses
      let japaneseGrouped = groupCoursesByLevel(
        jpCoursesData,
        jpLessonsData,
        ['N5', 'N4', 'N3', 'N2', 'N1']
      );

      // If no Japanese courses found/loaded, create placeholder courses
      if (japaneseGrouped.length === 0) {
        japaneseGrouped = ['N5', 'N4', 'N3', 'N2', 'N1'].map(level => ({
          level,
          title: level,
          lessons: [],
          totalLessons: 0,
        }));
      }

      // Process Chinese courses
      let chineseGrouped = groupCoursesByLevel(
        cnCoursesData,
        cnLessonsData,
        ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']
      );

      // If no Chinese courses found/loaded, create placeholder courses
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
      // Fallback placeholders if processing fails completely
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

  const renderCourseCard = (course: any, index: number, language: Language) => {
    // Solid colors map
    const colors = [
      'var(--success-color)',
      'var(--primary-color)',
      'var(--warning-color)',
      'var(--danger-color)',
      'var(--secondary-color)',
      '#db2777' // extra one
    ];

    const color = colors[index % colors.length];
    const hasLessons = course.totalLessons > 0;

    const CardWrapper = (hasLessons ? Link : 'div') as any;
    const wrapperProps = hasLessons
      ? { to: `/${language}/courses/${course.level}`, style: { textDecoration: 'none' } }
      : { style: { textDecoration: 'none' } };

    return (
      <CardWrapper
        key={course.level}
        {...wrapperProps}
      >
        <div style={{
          height: '100%',
          transition: 'all 0.2s',
          cursor: hasLessons ? 'pointer' : 'not-allowed',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow)',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          position: 'relative',
          opacity: hasLessons ? 1 : 0.7,
          display: 'flex',
          flexDirection: 'column'
        }}
          onMouseEnter={(e) => {
            if (hasLessons) {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              e.currentTarget.style.borderColor = color;
            }
          }}
          onMouseLeave={(e) => {
            if (hasLessons) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }
          }}>
          {/* Header */}
          <div style={{
            backgroundColor: color,
            padding: '1.5rem',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '800' }}>
              {course.level}
            </div>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              {course.lessons.length} bài học
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '0.75rem'
            }}>
              {course.title}
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9375rem',
              lineHeight: '1.5',
              marginBottom: '1.5rem',
              flex: 1
            }}>
              {course.totalLessons > 0 ? `${course.totalLessons} bài học` : 'Sắp ra mắt'}
            </p>
            <button style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '8px',
              border: `1px solid ${hasLessons ? color : 'var(--text-secondary)'}`,
              background: 'transparent',
              color: hasLessons ? color : 'var(--text-secondary)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: hasLessons ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
              onMouseEnter={(e) => {
                if (hasLessons) {
                  e.currentTarget.style.background = color;
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (hasLessons) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = color;
                }
              }}
            >
              {course.totalLessons > 0 ? 'Bắt đầu học' : 'Sắp ra mắt'}
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </CardWrapper>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
      <FloatingCharacters language="japanese" count={15} />
      <Link to="/" className="back-button">
        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Về trang chủ
      </Link>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>
          📖 Tất cả khóa học
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          Chọn ngôn ngữ và cấp độ phù hợp để bắt đầu học
        </p>
      </div>

      {/* Japanese Courses */}
      {japaneseCourses.length > 0 && (
        <div style={{ marginBottom: '4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              🇯🇵 Tiếng Nhật
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Từ N5 đến N1
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {japaneseCourses.map((course, index) => renderCourseCard(course, index, 'japanese'))}
          </div>
        </div>
      )}

      {/* Chinese Courses */}
      {chineseCourses.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              🇨🇳 Tiếng Trung
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Từ HSK1 đến HSK6
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {chineseCourses.map((course, index) => renderCourseCard(course, index, 'chinese'))}
          </div>
        </div>
      )}

      {/* Empty State / Error State */}
      {japaneseCourses.length === 0 && chineseCourses.length === 0 && (
        <div className="empty-state">
          {error ? (
            <div style={{ color: '#ef4444', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
              <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Không thể tải dữ liệu</p>
              <p style={{ marginBottom: '1rem' }}>{error}</p>
              <button onClick={() => loadAllCourses()} style={{ padding: '0.5rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Thử lại</button>
            </div>
          ) : (
            <p>Chưa có khóa học nào.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AllCourses;
