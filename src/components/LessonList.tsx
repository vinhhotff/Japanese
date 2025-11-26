import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLessons } from '../services/supabaseService';
import '../App.css';

const LessonList = () => {
  const { level } = useParams<{ level: string }>();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [level]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const lessonsData = await getLessons();

      // Lọc tất cả bài học theo level (N5, N4, ...)
      const lessonsOfLevel = lessonsData
        .filter((l: any) => (l.level || '').toUpperCase() === (level || '').toUpperCase())
        .sort((a: any, b: any) => (a.lesson_number || 0) - (b.lesson_number || 0));

      setCourse({
        level,
        title: `${level} - Tất cả bài học`,
        description: `Có ${lessonsOfLevel.length} bài học trong ${level}.`,
        lessons: lessonsOfLevel.map((l: any) => ({
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
      });
    } catch (err: any) {
      console.error('Error loading course:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container">
        <h1>Không tìm thấy khóa học</h1>
        <Link to="/" className="back-button">
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/courses" className="back-button">
        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Về danh sách khóa học
      </Link>
      <div className="header">
        <h1>
          <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {course.title}
        </h1>
        <p>{course.description}</p>
        {course.courses && course.courses.length > 1 && (
          <div style={{ marginTop: '1rem', padding: '1.25rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>Khóa học trong {level}:</strong>
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {course.courses.map((c: any, idx: number) => (
                <div key={idx} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg style={{ width: '16px', height: '16px', color: '#3b82f6' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <strong>{c.courseTitle}</strong> - {c.lessons.length} bài học
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {course.lessons.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có bài học nào trong {level}.</p>
        </div>
      ) : (
        <div className="card-grid">
          {course.lessons.map((lesson: any) => (
            <Link key={lesson.id} to={`/lessons/${lesson.id}`}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: '700' }}>
                      {lesson.title}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.6' }}>
                      {lesson.description}
                    </p>
                  </div>
                  <span className={`badge badge-${lesson.level.toLowerCase()}`}>
                    {lesson.level}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {lesson.vocabulary.length} từ vựng
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {lesson.kanji.length} kanji
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {lesson.grammar.length} ngữ pháp
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonList;

