import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLessons } from '../services/supabaseService';
import { getLessonCompletionPercentage, isLessonCompleted } from '../services/progressService';
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

      // Load vocabulary, kanji, grammar counts for each lesson
      const { getVocabulary, getKanji, getGrammar } = await import('../services/supabaseService');
      const [allVocab, allKanji, allGrammar] = await Promise.all([
        getVocabulary(),
        getKanji(),
        getGrammar()
      ]);

      setCourse({
        level,
        title: `${level} - Tất cả bài học`,
        description: `Có ${lessonsOfLevel.length} bài học trong ${level}.`,
        lessons: lessonsOfLevel.map((l: any) => {
          const vocabCount = allVocab.filter((v: any) => v.lesson_id === l.id).length;
          const kanjiCount = allKanji.filter((k: any) => k.lesson_id === l.id).length;
          const grammarCount = allGrammar.filter((g: any) => g.lesson_id === l.id).length;

          return {
            id: l.id,
            title: l.title,
            level: l.level || level,
            lessonNumber: l.lesson_number,
            description: l.description || '',
            vocabulary: Array(vocabCount).fill(null), // Create array with correct length
            kanji: Array(kanjiCount).fill(null),
            grammar: Array(grammarCount).fill(null),
            listening: [],
            speaking: [],
            difficultVocabulary: [],
          };
        }),
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
      <Link to="/" className="back-button">
        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Về trang chủ
      </Link>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>
          📚 {course.title}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          {course.description}
        </p>
      </div>

      {course.lessons.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có bài học nào trong {level}.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {course.lessons.map((lesson: any, index: number) => {
            const progress = getLessonCompletionPercentage(lesson.id);
            const completed = isLessonCompleted(lesson.id);
            
            return (
            <Link key={lesson.id} to={`/lessons/${lesson.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                height: '100%',
                transition: 'all 0.3s',
                cursor: 'pointer',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                background: 'var(--card-bg)',
                border: '3px solid transparent',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                e.currentTarget.style.borderColor = completed ? '#10b981' : '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = 'transparent';
              }}>
                {/* Completion Badge */}
                {completed && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--success-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    zIndex: 10,
                    boxShadow: 'var(--shadow-lg)'
                  }}>
                    ✓
                  </div>
                )}

                {/* Gradient Header with Lesson Number */}
                <div style={{
                  background: completed 
                    ? 'var(--success-gradient)' 
                    : 'var(--primary-gradient)',
                  padding: '2rem',
                  color: 'white',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <div style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                    {lesson.lessonNumber || index + 1}
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
                    {completed ? '✓ Đã hoàn thành' : progress > 0 ? `${progress}% hoàn thành` : 'Bài học ' + (lesson.lessonNumber || index + 1)}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem' }}>
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '700', 
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                  }}>
                    {lesson.title}
                  </h3>
                  <p style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '1rem', 
                    lineHeight: '1.6', 
                    marginBottom: '1.5rem',
                    minHeight: '3rem'
                  }}>
                    {lesson.description}
                  </p>

                  {/* Stats */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb',
                    flexWrap: 'wrap',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg style={{ width: '18px', height: '18px', color: '#3b82f6', strokeWidth: '1.5' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                        {lesson.vocabulary.length} từ
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg style={{ width: '18px', height: '18px', color: '#8b5cf6', strokeWidth: '1.5' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                        {lesson.kanji.length} kanji
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg style={{ width: '18px', height: '18px', color: '#10b981', strokeWidth: '1.5' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                        {lesson.grammar.length} ngữ pháp
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {progress > 0 && !completed && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ 
                        height: '8px', 
                        background: 'var(--progress-bg)', 
                        borderRadius: '999px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          height: '100%',
                          width: `${progress}%`,
                          background: 'var(--primary-gradient)',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  )}

                  <button style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: completed 
                      ? 'linear-gradient(135deg, #10b981, #059669)' 
                      : progress > 0 
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white',
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}>
                    {completed ? (
                      <>
                        Ôn tập lại
                        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </>
                    ) : progress > 0 ? (
                      <>
                        Tiếp tục học
                        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Bắt đầu học
                        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Link>
          )})}
        </div>
      )}
    </div>
  );
};

export default LessonList;

