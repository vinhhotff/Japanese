import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLessons } from '../services/supabaseService';
import { getLessonCompletionPercentage, isLessonCompleted } from '../services/progressService';
import '../styles/custom-theme.css';

const LessonListNew = () => {
  const { level } = useParams<{ level: string }>();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, [level]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const lessonsData = await getLessons();
      
      const { getVocabulary, getKanji, getGrammar } = await import('../services/supabaseService');
      const [allVocab, allKanji, allGrammar] = await Promise.all([
        getVocabulary(),
        getKanji(),
        getGrammar()
      ]);

      const lessonsOfLevel = lessonsData
        .filter((l: any) => (l.level || '').toUpperCase() === (level || '').toUpperCase())
        .sort((a: any, b: any) => (a.lesson_number || 0) - (b.lesson_number || 0))
        .map((l: any) => {
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
        });

      setLessons(lessonsOfLevel);
    } catch (err) {
      console.error('Error loading lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-bg-primary)', minHeight: '100vh' }}>
      <div className="container-custom">
        {/* Back Button */}
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            fontSize: '0.9375rem',
            marginTop: 'var(--space-2xl)',
            marginBottom: 'var(--space-xl)',
            transition: 'color var(--transition-base)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
        >
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Về trang chủ
        </Link>

        {/* Header */}
        <header style={{ 
          paddingBottom: 'var(--space-2xl)',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 'var(--space-3xl)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
            {(() => {
              const levelColors: Record<string, { bg: string; border: string; text: string }> = {
                'N5': { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
                'N4': { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },
                'N3': { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
                'N2': { bg: '#fce4ec', border: '#e91e63', text: '#c2185b' },
                'N1': { bg: '#f3e5f5', border: '#9c27b0', text: '#6a1b9a' }
              };
              const colors = levelColors[level || 'N5'] || levelColors['N5'];
              
              return (
                <div style={{
                  width: '72px',
                  height: '72px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: colors.bg,
                  border: `2px solid ${colors.border}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: colors.text
                }}>
                  {level}
                </div>
              );
            })()}
            <div>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginBottom: '0.5rem'
              }}>
                Cấp độ {level}
              </h1>
              <p style={{ 
                color: 'var(--color-text-secondary)', 
                fontSize: '1.125rem'
              }}>
                {lessons.length} bài học
              </p>
            </div>
          </div>
        </header>

        {/* Lessons List */}
        <div style={{ display: 'grid', gap: 'var(--space-lg)', paddingBottom: 'var(--space-3xl)' }}>
          {lessons.map((lesson, index) => {
            const progress = getLessonCompletionPercentage(lesson.id);
            const completed = isLessonCompleted(lesson.id);

            return (
              <Link 
                key={lesson.id} 
                to={`/lessons/${lesson.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div 
                  className="card-custom animate-fade-in-up"
                  style={{ 
                    padding: 'var(--space-xl)',
                    cursor: 'pointer',
                    animationDelay: `${index * 30}ms`,
                    position: 'relative'
                  }}
                >
                  {/* Completion Badge */}
                  {completed && (
                    <div style={{
                      position: 'absolute',
                      top: 'var(--space-lg)',
                      right: 'var(--space-lg)',
                      padding: '0.375rem 0.75rem',
                      background: 'var(--color-success)',
                      color: 'white',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      Đã hoàn thành
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'start' }}>
                    {/* Lesson Number */}
                    {(() => {
                      const levelColors: Record<string, string> = {
                        'N5': '#4caf50',
                        'N4': '#2196f3',
                        'N3': '#ff9800',
                        'N2': '#e91e63',
                        'N1': '#9c27b0'
                      };
                      const levelBgColors: Record<string, string> = {
                        'N5': '#e8f5e9',
                        'N4': '#e3f2fd',
                        'N3': '#fff3e0',
                        'N2': '#fce4ec',
                        'N1': '#f3e5f5'
                      };
                      const color = levelColors[level || 'N5'] || levelColors['N5'];
                      const bgColor = levelBgColors[level || 'N5'] || levelBgColors['N5'];
                      
                      return (
                        <div style={{
                          width: '56px',
                          height: '56px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: completed ? 'var(--color-success)' : bgColor,
                          border: `2px solid ${completed ? 'var(--color-success)' : color}`,
                          borderRadius: 'var(--radius-md)',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: completed ? 'white' : color,
                          flexShrink: 0
                        }}>
                          {lesson.lessonNumber || index + 1}
                        </div>
                      );
                    })()}

                    {/* Content */}
                    <div style={{ flex: 1, paddingRight: completed ? '6rem' : '0' }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 600, 
                        color: 'var(--color-text-primary)',
                        marginBottom: 'var(--space-sm)'
                      }}>
                        {lesson.title}
                      </h3>
                      
                      {lesson.description && (
                        <p style={{ 
                          fontSize: '1rem', 
                          color: 'var(--color-text-secondary)',
                          marginBottom: 'var(--space-lg)',
                          lineHeight: 1.6
                        }}>
                          {lesson.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div style={{ 
                        display: 'flex', 
                        gap: 'var(--space-xl)',
                        fontSize: '0.9375rem',
                        color: 'var(--color-text-muted)'
                      }}>
                        <span>Từ vựng: {lesson.vocabCount}</span>
                        <span>Kanji: {lesson.kanjiCount}</span>
                        <span>Ngữ pháp: {lesson.grammarCount}</span>
                      </div>

                      {/* Progress Bar */}
                      {progress > 0 && !completed && (() => {
                        const levelColors: Record<string, string> = {
                          'N5': '#4caf50',
                          'N4': '#2196f3',
                          'N3': '#ff9800',
                          'N2': '#e91e63',
                          'N1': '#9c27b0'
                        };
                        const color = levelColors[level || 'N5'] || levelColors['N5'];
                        
                        return (
                        <div style={{ marginTop: 'var(--space-lg)' }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--space-sm)',
                            fontSize: '0.875rem',
                            color: 'var(--color-text-muted)'
                          }}>
                            <span>Tiến độ</span>
                            <span style={{ fontWeight: 600, color }}>{progress}%</span>
                          </div>
                          <div style={{
                            height: '4px',
                            background: 'var(--color-border)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${progress}%`,
                              background: color,
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {lessons.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--space-3xl)',
            color: 'var(--color-text-secondary)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>📚</div>
            <p>このレベルにはまだレッスンがありません</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonListNew;
