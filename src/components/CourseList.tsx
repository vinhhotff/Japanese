import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getLessons } from '../services/supabaseService.v2';
import { transformCourseFromDB } from '../utils/dataTransform';
import type { Language } from '../services/supabaseService.v2';
import FloatingCharacters from './FloatingCharacters';
import { useLanguageTheme, useLanguageClasses } from '../hooks/useLanguageTheme';
import '../App.css';

interface CourseListProps {
  language: Language;
}

const CourseList = ({ language }: CourseListProps) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useLanguageTheme(language);
  const { cardClass } = useLanguageClasses(language);

  useEffect(() => {
    loadCourses();
  }, [language]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const [coursesResult, lessonsResult] = await Promise.all([
        getCourses(language, 1, 100),
        getLessons(undefined, language, 1, 100),
      ]);

      const coursesData = coursesResult.data;
      const lessonsData = lessonsResult.data;

      // Load vocabulary, kanji, grammar counts
      const { getVocabulary, getKanji, getGrammar } = await import('../services/supabaseService.v2');
      const [allVocabResult, allKanjiResult, allGrammarResult] = await Promise.all([
        getVocabulary(undefined, language, 1, 1000),
        getKanji(undefined, language, 1, 1000),
        getGrammar(undefined, language, 1, 1000)
      ]);

      const allVocab = allVocabResult.data;
      const allKanji = allKanjiResult.data;
      const allGrammar = allGrammarResult.data;

      // Group courses by level
      const coursesByLevel: Record<string, any[]> = {};
      const levelOrder = language === 'japanese' 
        ? ['N5', 'N4', 'N3', 'N2', 'N1']
        : ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'];

      coursesData.forEach(course => {
        if (!coursesByLevel[course.level]) {
          coursesByLevel[course.level] = [];
        }
        coursesByLevel[course.level].push(course);
      });

      // Transform and group courses by level
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
              : `${level} - ${totalLessons} bài học`,
            description: coursesByLevel[level].length === 1
              ? firstCourse.description || ''
              : `Bao gồm: ${courseTitles}`,
            lessons: allLessons.map((l: any) => {
              const vocabCount = allVocab.filter((v: any) => v.lesson_id === l.id).length;
              const kanjiCount = allKanji.filter((k: any) => k.lesson_id === l.id).length;
              const grammarCount = allGrammar.filter((g: any) => g.lesson_id === l.id).length;

              return {
                id: l.id,
                title: l.title,
                level: l.level || level,
                lessonNumber: l.lesson_number,
                description: l.description || '',
                vocabulary: Array(vocabCount).fill(null),
                kanji: Array(kanjiCount).fill(null),
                grammar: Array(grammarCount).fill(null),
                listening: [],
                speaking: [],
                difficultVocabulary: [],
              };
            }),
            courseCount: coursesByLevel[level].length,
            totalLessons: totalLessons,
          };
        });

      setCourses(groupedCourses);
    } catch (err: any) {
      console.error('Error loading courses:', err);
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

  return (
    <div 
      className="container" 
      data-language={language}
      style={{ position: 'relative', zIndex: 1 }}
    >
      <FloatingCharacters language={language} count={15} />
      <Link to="/" className="back-button">
        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Về trang chủ
      </Link>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>
          {language === 'japanese' ? '📖 Khóa học tiếng Nhật' : '📖 Khóa học tiếng Trung'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          {language === 'japanese' 
            ? 'Chọn cấp độ phù hợp và bắt đầu hành trình học tiếng Nhật của bạn'
            : 'Chọn cấp độ phù hợp và bắt đầu hành trình học tiếng Trung của bạn'}
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có khóa học nào.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {courses.map((course, index) => (
            <Link key={course.level} to={`/${language}/courses/${course.level}`} style={{ textDecoration: 'none' }}>
              <div 
                className={cardClass}
                style={{ 
                height: '100%',
                transition: 'all 0.3s',
                cursor: 'pointer',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                e.currentTarget.style.borderColor = index === 0 ? '#10b981' :
                  index === 1 ? '#3b82f6' :
                  index === 2 ? '#f59e0b' :
                  index === 3 ? '#ef4444' : '#8b5cf6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = 'transparent';
              }}>
                {/* Gradient Header */}
                <div style={{
                  background: `linear-gradient(135deg, ${
                    index === 0 ? '#10b981, #059669' :
                    index === 1 ? '#3b82f6, #2563eb' :
                    index === 2 ? '#f59e0b, #d97706' :
                    index === 3 ? '#ef4444, #dc2626' :
                    '#8b5cf6, #7c3aed'
                  })`,
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
                  {/* Japan/China Map Icon */}
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
                          fill={index === 0 ? '#10b981' :
                            index === 1 ? '#3b82f6' :
                            index === 2 ? '#f59e0b' :
                            index === 3 ? '#ef4444' : '#8b5cf6'}
                        />
                      </svg>
                    ) : (
                      // China Map
                      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 30L25 25L30 20L35 22L40 25L45 23L50 20L55 22L60 25L65 28L70 30L75 35L78 40L80 45L82 50L80 55L78 60L75 65L70 68L65 70L60 72L55 70L50 68L45 70L40 72L35 70L30 68L25 65L22 60L20 55L18 50L20 45L22 40L20 35L20 30Z" 
                          fill={index === 0 ? '#10b981' :
                            index === 1 ? '#3b82f6' :
                            index === 2 ? '#f59e0b' :
                            index === 3 ? '#ef4444' : '#8b5cf6'}
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
                    {course.description}
                  </p>
                  <button style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${
                      index === 0 ? '#10b981, #059669' :
                      index === 1 ? '#3b82f6, #2563eb' :
                      index === 2 ? '#f59e0b, #d97706' :
                      index === 3 ? '#ef4444, #dc2626' :
                      '#8b5cf6, #7c3aed'
                    })`,
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
                    Bắt đầu học
                    <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;

