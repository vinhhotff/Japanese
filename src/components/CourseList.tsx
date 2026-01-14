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
          {courses.map((course, index) => {
            const getLevelColor = (idx: number) => {
               const colors = [
                 'var(--success-color)', 
                 'var(--primary-color)', 
                 'var(--warning-color)', 
                 'var(--danger-color)', 
                 'var(--secondary-color)'
               ];
               return colors[idx % colors.length];
            };

            const levelColor = getLevelColor(index);

            return (
              <Link key={course.level} to={`/${language}/courses/${course.level}`} style={{ textDecoration: 'none' }}>
                <div 
                  className={cardClass}
                  style={{ 
                    height: '100%',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    e.currentTarget.style.borderColor = levelColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  {/* Clean Header */}
                  <div style={{
                    backgroundColor: levelColor,
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
                      {course.description}
                    </p>
                    <button style={{
                      width: '100%',
                      padding: '0.875rem',
                      borderRadius: '8px',
                      border: `1px solid ${levelColor}`,
                      background: 'transparent',
                      color: levelColor,
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = levelColor;
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = levelColor;
                    }}
                    >
                      Bắt đầu học
                      <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseList;

