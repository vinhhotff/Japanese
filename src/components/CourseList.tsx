import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const navigate = useNavigate();
  useLanguageTheme(language);
  const { cardClass } = useLanguageClasses(language);

  useEffect(() => {
    loadCourses();
  }, [language]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const [coursesResult, lessonsResult] = await Promise.all([
        getCourses(language, 1, 100),
        getLessons(undefined, language, undefined, 1, 1000),
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

      // Transform and group courses by level - now showing individual courses
      const groupedCourses = levelOrder
        .filter(level => coursesByLevel[level] && coursesByLevel[level].length > 0)
        .map(level => {
          // Get all lessons from all courses of this level
          const allLessons = lessonsData.filter(l => {
            const courseId = l.course_id || l.course?.id;
            return coursesByLevel[level].some(c => c.id === courseId);
          });

          // For each individual course, get its lessons
          const individualCourses = coursesByLevel[level].map(course => {
            const courseLessons = allLessons.filter(l => {
              const lessonCourseId = l.course_id || l.course?.id;
              return lessonCourseId === course.id;
            });

            return {
              ...course,
              level,
              lessons: courseLessons.map((l: any) => {
                const vocabCount = allVocab.filter((v: any) => v.lesson_id === l.id).length;
                const kanjiCount = allKanji.filter((k: any) => k.lesson_id === l.id).length;
                const grammarCount = allGrammar.filter((g: any) => g.lesson_id === l.id).length;

                return {
                  id: l.id,
                  title: l.title,
                  level: l.level || level,
                  lessonNumber: l.lesson_number,
                  description: l.description || '',
                  vocabCount,
                  kanjiCount,
                  grammarCount,
                };
              }),
              totalLessons: courseLessons.length,
            };
          });

          return {
            level,
            courses: individualCourses,
          };
        });

      setCourses(groupedCourses);
    } catch (err: any) {
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLevel = (level: string) => {
    setSelectedLevel(selectedLevel === level ? null : level);
  };

  const handleSelectCourse = (course: any) => {
    // Navigate to lessons for this specific course
    navigate(`/${language}/courses/${course.level}?courseId=${course.id}`);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="empty-state">
          <div style={{ fontSize: '2rem', color: '#ef4444' }}>⚠️</div>
          <p style={{ color: '#ef4444', fontWeight: 'bold' }}>{error}</p>
          <button onClick={() => loadCourses()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Thử lại</button>
        </div>
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'N5': 'var(--success-color)',
      'N4': 'var(--primary-color)',
      'N3': 'var(--warning-color)',
      'N2': 'var(--danger-color)',
      'N1': 'var(--secondary-color)',
      'HSK1': 'var(--success-color)',
      'HSK2': 'var(--primary-color)',
      'HSK3': 'var(--warning-color)',
      'HSK4': 'var(--danger-color)',
      'HSK5': 'var(--secondary-color)',
      'HSK6': '#ec4899',
    };
    return colors[level] || 'var(--primary-color)';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

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
            ? 'Chọn cấp độ và khóa học phù hợp với bạn'
            : 'Chọn cấp độ và khóa học phù hợp với bạn'}
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có khóa học nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {courses.map((levelGroup, groupIndex) => {
            const levelColor = getLevelColor(levelGroup.level);
            const isExpanded = selectedLevel === levelGroup.level;

            return (
              <div
                key={levelGroup.level}
                style={{
                  background: 'var(--card-bg)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: `2px solid ${isExpanded ? levelColor : 'var(--border-color)'}`,
                  transition: 'all 0.3s ease',
                  boxShadow: isExpanded ? '0 8px 30px rgba(0,0,0,0.12)' : 'var(--shadow)',
                }}
              >
                {/* Level Header - Clickable to expand/collapse */}
                <div
                  onClick={() => handleSelectLevel(levelGroup.level)}
                  style={{
                    background: isExpanded ? levelColor : `linear-gradient(135deg, ${levelColor} 0%, ${levelColor}cc 100%)`,
                    padding: '1.5rem 2rem',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>
                      {levelGroup.level}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                      {levelGroup.level === 'N5' ? 'Sơ cấp' :
                       levelGroup.level === 'N4' ? 'Tiền trung cấp' :
                       levelGroup.level === 'N3' ? 'Trung cấp' :
                       levelGroup.level === 'N2' ? 'Trung cao cấp' :
                       levelGroup.level === 'N1' ? 'Cao cấp' :
                       levelGroup.level}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '0.4rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      {levelGroup.courses.length} khóa học
                    </div>
                    <svg
                      style={{
                        width: '24px',
                        height: '24px',
                        transition: 'transform 0.3s ease',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* Courses List - Only show when expanded */}
                {isExpanded && (
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                      {levelGroup.courses.map((course: any, index: number) => (
                        <div
                          key={course.id}
                          className={cardClass}
                          onClick={() => handleSelectCourse(course)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.3s ease',
                            padding: '1.5rem',
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <h3 style={{
                              fontSize: '1.25rem',
                              fontWeight: '700',
                              color: 'var(--text-primary)',
                              margin: 0,
                              flex: 1,
                            }}>
                              {course.title || `${levelGroup.level} - Khóa học ${index + 1}`}
                            </h3>
                            {course.price === 0 ? (
                              <span style={{
                                background: 'var(--success-color)',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                              }}>
                                MIỄN PHÍ
                              </span>
                            ) : (
                              <span style={{
                                background: levelColor,
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                              }}>
                                {formatCurrency(course.price || 0)}
                              </span>
                            )}
                          </div>

                          <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            lineHeight: '1.5',
                            marginBottom: '1rem',
                          }}>
                            {course.description || `${course.totalLessons} bài học trong khóa học này`}
                          </p>

                          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{
                              background: 'rgba(0,0,0,0.05)',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              color: 'var(--text-secondary)',
                            }}>
                              📖 {course.totalLessons} bài
                            </div>
                          </div>

                          <button style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '10px',
                            border: `2px solid ${levelColor}`,
                            background: 'transparent',
                            color: levelColor,
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                          }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = levelColor;
                              (e.currentTarget as HTMLButtonElement).style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              (e.currentTarget as HTMLButtonElement).style.color = levelColor;
                            }}
                          >
                            Xem bài học
                            <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseList;

