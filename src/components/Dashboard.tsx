import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getLessons } from '../services/supabaseService';
import { transformCourseFromDB } from '../utils/dataTransform';
import DailyChallenge from './DailyChallenge';
import '../App.css';

const Dashboard = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const [coursesData, lessonsData] = await Promise.all([
        getCourses(),
        getLessons(),
      ]);

      // Group courses by level
      const coursesByLevel: Record<string, any[]> = {};
      const levelOrder = ['N5', 'N4', 'N3', 'N2', 'N1'];

      coursesData.forEach(course => {
        if (!coursesByLevel[course.level]) {
          coursesByLevel[course.level] = [];
        }
        coursesByLevel[course.level].push(course);
      });

      // Transform and combine all courses of the same level
      const groupedCourses = levelOrder
        .filter(level => coursesByLevel[level] && coursesByLevel[level].length > 0)
        .map(level => {
          // Get all lessons from all courses of this level
          const allLessons = lessonsData.filter(l => {
            const courseId = l.course_id || l.course?.id;
            return coursesByLevel[level].some(c => c.id === courseId);
          });

          // Combine all courses into one display object
          const firstCourse = coursesByLevel[level][0];
          const totalLessons = allLessons.length;
          const courseTitles = coursesByLevel[level].map(c => c.title).join(', ');

          return {
            level,
            title: coursesByLevel[level].length === 1 
              ? firstCourse.title 
              : `${level} - ${coursesByLevel[level].length} khóa học`,
            description: coursesByLevel[level].length === 1
              ? firstCourse.description || ''
              : `Bao gồm: ${courseTitles}`,
            lessons: allLessons.map((l: any) => ({
              id: l.id,
              title: l.title,
              level: l.level || level,
              lessonNumber: l.lesson_number,
              description: l.description || '',
              vocabulary: [],
              kanji: [],
              grammar: [],
              listening: [],
              speaking: [],
              difficultVocabulary: [],
            })),
            courseCount: coursesByLevel[level].length,
          };
        });

      setCourses(groupedCourses);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          ⚠️ {error}
        </div>
        <button className="btn btn-primary" onClick={loadCourses}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>
          <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Học Tiếng Nhật
        </h1>
        <p>Hệ thống học tiếng Nhật toàn diện - Từ N5 đến N1</p>
      </div>

      <DailyChallenge />

      {courses.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có khóa học nào. Vui lòng thêm khóa học trong trang Admin.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Đăng nhập Admin
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {courses.map((course) => (
            <Link key={course.level} to={`/courses/${course.level}`}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                    {course.level}
                  </h2>
                  <span className={`badge badge-${course.level.toLowerCase()}`}>
                    {course.lessons.length} bài
                  </span>
                </div>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.125rem' }}>
                  {course.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.6' }}>
                  {course.description}
                </p>
                <div style={{ marginTop: '1.25rem' }}>
                  <button className="btn btn-primary" style={{ width: '100%' }}>
                    <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    Bắt đầu học
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700' }}>Tính năng học tập</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem' }}>
            <svg style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem', color: '#3b82f6' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Từ vựng</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <svg style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem', color: '#8b5cf6' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Kanji</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <svg style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem', color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Ngữ pháp</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <svg style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem', color: '#f59e0b' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Nghe</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <svg style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem', color: '#ef4444' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Nói</h3>
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: '2rem' }}>
        <Link to="/dictionary">
          <div className="card">
            <svg style={{ width: '56px', height: '56px', margin: '0 0 1rem', color: '#3b82f6' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Từ điển</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1rem' }}>Tra từ vựng và kanji từ Jisho.org</p>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              Mở từ điển
            </button>
          </div>
        </Link>
        <Link to="/vocabulary-practice">
          <div className="card">
            <svg style={{ width: '56px', height: '56px', margin: '0 0 1rem', color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Luyện Từ Vựng</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1rem' }}>Nhập danh sách từ và luyện gõ hiragana</p>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              Bắt đầu luyện tập
            </button>
          </div>
        </Link>
        <Link to="/spaced-repetition">
          <div className="card">
            <svg style={{ width: '56px', height: '56px', margin: '0 0 1rem', color: '#f59e0b' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Ôn Tập SRS</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1rem' }}>Hệ thống ôn tập khoa học</p>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              Bắt đầu ôn tập
            </button>
          </div>
        </Link>
        <Link to="/kanji-writing">
          <div className="card">
            <svg style={{ width: '56px', height: '56px', margin: '0 0 1rem', color: '#8b5cf6' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Luyện Viết Kanji</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1rem' }}>Luyện viết và nhớ kanji</p>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              Bắt đầu luyện tập
            </button>
          </div>
        </Link>
        <Link to="/study-progress">
          <div className="card">
            <svg style={{ width: '56px', height: '56px', margin: '0 0 1rem', color: '#ec4899' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Thống Kê</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1rem' }}>Theo dõi tiến độ học tập</p>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              Xem thống kê
            </button>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

