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

  useEffect(() => {
    loadAllCourses();
  }, []);

  const loadAllCourses = async () => {
    try {
      setLoading(true);
      
      // Load Japanese courses
      const [japaneseCoursesResult, japaneseLessonsResult] = await Promise.all([
        getCourses('japanese', 1, 100),
        getLessons(undefined, 'japanese', 1, 100),
      ]);

      // Load Chinese courses
      const [chineseCoursesResult, chineseLessonsResult] = await Promise.all([
        getCourses('chinese', 1, 100),
        getLessons(undefined, 'chinese', 1, 100),
      ]);

      // Process Japanese courses
      const japaneseGrouped = groupCoursesByLevel(
        japaneseCoursesResult.data,
        japaneseLessonsResult.data,
        ['N5', 'N4', 'N3', 'N2', 'N1']
      );

      // Process Chinese courses
      let chineseGrouped = groupCoursesByLevel(
        chineseCoursesResult.data,
        chineseLessonsResult.data,
        ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']
      );

      // If no Chinese courses in database, create placeholder courses
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
      console.error('Error loading courses:', err);
      // Even on error, show placeholder Chinese courses
      const chinesePlaceholder = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map(level => ({
        level,
        title: level,
        lessons: [],
        totalLessons: 0,
      }));
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
    const colors = [
      { gradient: '#10b981, #059669', border: '#10b981' },
      { gradient: '#3b82f6, #2563eb', border: '#3b82f6' },
      { gradient: '#f59e0b, #d97706', border: '#f59e0b' },
      { gradient: '#ef4444, #dc2626', border: '#ef4444' },
      { gradient: '#8b5cf6, #7c3aed', border: '#8b5cf6' },
      { gradient: '#ec4899, #db2777', border: '#ec4899' },
    ];

    const color = colors[index % colors.length];
    const hasLessons = course.totalLessons > 0;

    const CardWrapper = hasLessons ? Link : 'div';
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
          transition: 'all 0.3s',
          cursor: hasLessons ? 'pointer' : 'not-allowed',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          background: 'var(--card-bg)',
          border: '3px solid transparent',
          position: 'relative',
          opacity: hasLessons ? 1 : 0.7
        }}
        onMouseEnter={(e) => {
          if (hasLessons) {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
            e.currentTarget.style.borderColor = color.border;
          }
        }}
        onMouseLeave={(e) => {
          if (hasLessons) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}>
          {/* Gradient Header */}
          <div style={{
            background: `linear-gradient(135deg, ${color.gradient})`,
            padding: '2rem',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              {course.level}
            </div>
            <div style={{ 
              background: 'rgba(255,255,255,0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '50px',
              display: 'inline-block',
              backdropFilter: 'blur(10px)',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              {course.lessons.length} bài học
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '2rem', position: 'relative' }}>
            {/* Map Icon */}
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              opacity: 0.15,
              pointerEvents: 'none'
            }}>
              {language === 'japanese' ? (
                // Japan Map
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M75 25C75 25 70 20 65 22C60 24 58 28 55 30C52 32 48 30 45 32C42 34 40 38 38 40C36 42 32 42 30 45C28 48 28 52 30 55C32 58 35 58 38 60C41 62 42 65 45 67C48 69 52 68 55 70C58 72 60 75 63 77C66 79 70 78 73 75C76 72 78 68 80 65C82 62 82 58 80 55C78 52 75 50 75 47C75 44 77 40 75 37C73 34 70 32 70 29C70 26 72 23 70 20C68 17 65 18 63 20C61 22 60 25 58 27C56 29 52 28 50 30C48 32 48 35 50 37C52 39 55 38 57 40C59 42 58 45 60 47C62 49 65 48 67 50C69 52 68 55 70 57C72 59 75 58 75 55C75 52 73 50 73 47C73 44 75 42 75 39C75 36 73 34 73 31C73 28 75 26 75 25Z" 
                    fill={color.border}
                  />
                </svg>
              ) : (
                // China Map
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 30L25 25L30 20L35 22L40 25L45 23L50 20L55 22L60 25L65 28L70 30L75 35L78 40L80 45L82 50L80 55L78 60L75 65L70 68L65 70L60 72L55 70L50 68L45 70L40 72L35 70L30 68L25 65L22 60L20 55L18 50L20 45L22 40L20 35L20 30Z" 
                    fill={color.border}
                  />
                </svg>
              )}
            </div>
            
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)',
              marginBottom: '1rem'
            }}>
              {course.title}
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '1rem', 
              lineHeight: '1.6', 
              marginBottom: '1.5rem',
              minHeight: '3rem'
            }}>
              {course.totalLessons > 0 ? `${course.totalLessons} bài học` : 'Sắp ra mắt'}
            </p>
            <button style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              border: 'none',
              background: course.totalLessons > 0 
                ? `linear-gradient(135deg, ${color.gradient})`
                : 'linear-gradient(135deg, #6b7280, #4b5563)',
              color: 'white',
              fontSize: '1.125rem',
              fontWeight: '700',
              cursor: course.totalLessons > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              opacity: course.totalLessons > 0 ? 1 : 0.6
            }}>
              {course.totalLessons > 0 ? 'Bắt đầu học' : 'Sắp ra mắt'}
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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

      {/* Empty State */}
      {japaneseCourses.length === 0 && chineseCourses.length === 0 && (
        <div className="empty-state">
          <p>Chưa có khóa học nào.</p>
        </div>
      )}
    </div>
  );
};

export default AllCourses;
