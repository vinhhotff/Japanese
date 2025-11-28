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
      <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div className="container">
        {/* Back Button */}
        <Link to="/" className="back-button">
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Về trang chủ
        </Link>

        {/* Header */}
        <div className="header" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
                  border: `3px solid ${colors.border}`,
                  borderRadius: '16px',
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
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Cấp độ {level}
              </h1>
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '1.125rem'
              }}>
                {lessons.length} bài học
              </p>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div style={{ display: 'grid', gap: '1.5rem', paddingBottom: '3rem' }}>
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
                  className="card"
                  style={{ 
                    padding: '2rem',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {/* Completion Badge */}
                  {completed && (
                    <div style={{
                      position: 'absolute',
                      top: '1.5rem',
                      right: '1.5rem',
                      padding: '0.375rem 0.75rem',
                      background: 'var(--success-color)',
                      color: 'white',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      borderRadius: '8px'
                    }}>
                      ✓ Đã hoàn thành
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'start' }}>
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
                          background: completed ? 'var(--success-color)' : bgColor,
                          border: `3px solid ${completed ? 'var(--success-color)' : color}`,
                          borderRadius: '12px',
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
                        color: 'var(--text-primary)',
                        marginBottom: '0.75rem'
                      }}>
                        {lesson.title}
                      </h3>
                      
                      {lesson.description && (
                        <p style={{ 
                          fontSize: '1rem', 
                          color: 'var(--text-secondary)',
                          marginBottom: '1.25rem',
                          lineHeight: 1.65
                        }}>
                          {lesson.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '1.5rem',
                        fontSize: '0.9375rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <span>📖 Từ vựng: {lesson.vocabCount}</span>
                        <span>🈯 Kanji: {lesson.kanjiCount}</span>
                        <span>📖 Ngữ pháp: {lesson.grammarCount}</span>
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
                        <div style={{ marginTop: '1.25rem' }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)'
                          }}>
                            <span>Tiến độ</span>
                            <span style={{ fontWeight: 600, color }}>{progress}%</span>
                          </div>
                          <div style={{
                            height: '6px',
                            background: 'var(--border-light)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${progress}%`,
                              background: color,
                              transition: 'width 0.3s ease',
                              borderRadius: '3px'
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
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
            <p>Chưa có bài học nào cho cấp độ này</p>
          </div>
        )}
      </div>
  );
};

export default LessonListNew;
