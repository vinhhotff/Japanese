import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLessons } from '../services/supabaseService.v2';
import { getLessonCompletionPercentage, isLessonCompleted } from '../services/progressService';
import type { Language } from '../services/supabaseService.v2';
import FloatingCharacters from './FloatingCharacters';
import '../styles/custom-theme.css';

interface LessonListNewProps {
  language: Language;
}

const LessonListNew = ({ language }: LessonListNewProps) => {
  const { level } = useParams<{ level: string }>();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, [level, language]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const lessonsResult = await getLessons(undefined, language, 1, 1000);
      const lessonsData = lessonsResult.data;
      
      const { getVocabulary, getKanji, getGrammar } = await import('../services/supabaseService.v2');
      const [allVocabResult, allKanjiResult, allGrammarResult] = await Promise.all([
        getVocabulary(undefined, language, 1, 1000),
        getKanji(undefined, language, 1, 1000),
        getGrammar(undefined, language, 1, 1000)
      ]);

      const allVocab = allVocabResult.data;
      const allKanji = allKanjiResult.data;
      const allGrammar = allGrammarResult.data;

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
    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <FloatingCharacters language={language} count={12} />
        {/* Back Button */}
        <Link to="/" className="back-button">
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Về trang chủ
        </Link>

        {/* Header */}
        <div style={{ 
          marginBottom: '3rem',
          background: language === 'japanese' 
            ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '24px',
          padding: '3rem 2rem',
          color: 'white',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative background elements */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '4rem' }}>
                {language === 'japanese' ? '🇯🇵' : '🇨🇳'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.75rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  {language === 'japanese' ? 'JLPT' : 'HSK'} {level}
                </div>
                <h1 style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '800', 
                  margin: 0,
                  color: 'white',
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                  {language === 'japanese' 
                    ? `Khóa học tiếng Nhật ${level}` 
                    : `Khóa học tiếng Trung ${level}`}
                </h1>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              flexWrap: 'wrap',
              fontSize: '1rem'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>📚</span>
                <span style={{ fontWeight: '600' }}>{lessons.length} bài học</span>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>
                  {language === 'japanese' ? '🗾' : '🐉'}
                </span>
                <span style={{ fontWeight: '600' }}>
                  {language === 'japanese' ? 'Tiếng Nhật' : 'Tiếng Trung'}
                </span>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>⭐</span>
                <span style={{ fontWeight: '600' }}>
                  {language === 'japanese' 
                    ? level === 'N5' ? 'Sơ cấp' : level === 'N4' ? 'Sơ-Trung cấp' : level === 'N3' ? 'Trung cấp' : level === 'N2' ? 'Trung-Cao cấp' : 'Cao cấp'
                    : level === 'HSK1' ? 'Sơ cấp' : level === 'HSK2' ? 'Sơ-Trung cấp' : level === 'HSK3' ? 'Trung cấp' : level === 'HSK4' ? 'Trung-Cao cấp' : level === 'HSK5' ? 'Cao cấp' : 'Thành thạo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: `2px solid ${language === 'japanese' ? '#8b5cf6' : '#ef4444'}`,
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
            <div style={{ 
              fontSize: '2rem',
              background: language === 'japanese' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              padding: '0.75rem',
              borderRadius: '12px'
            }}>
              💡
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '700', 
                marginBottom: '0.5rem',
                color: 'var(--text-primary)'
              }}>
                {language === 'japanese' ? 'Về JLPT' : 'Về HSK'}
              </h3>
              <p style={{ 
                fontSize: '0.9375rem', 
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                margin: 0
              }}>
                {language === 'japanese' 
                  ? `JLPT (Japanese Language Proficiency Test) ${level} là kỳ thi năng lực tiếng Nhật quốc tế. Hoàn thành khóa học này sẽ giúp bạn đạt trình độ ${level}.`
                  : `HSK (Hanyu Shuiping Kaoshi) ${level} là kỳ thi năng lực tiếng Trung quốc tế. Hoàn thành khóa học này sẽ giúp bạn đạt trình độ ${level}.`}
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
                to={`/${language}/lessons/${lesson.id}`}
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
                    <div style={{
                      width: '64px',
                      height: '64px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: completed 
                        ? 'linear-gradient(135deg, #10b981, #059669)' 
                        : language === 'japanese'
                          ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                          : 'linear-gradient(135deg, #ef4444, #dc2626)',
                      borderRadius: '16px',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: 'white',
                      flexShrink: 0,
                      boxShadow: completed
                        ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                        : language === 'japanese'
                          ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                          : '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}>
                      {lesson.lessonNumber || index + 1}
                    </div>

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
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: '8px'
                        }}>
                          <span>📖</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {lesson.vocabCount} từ vựng
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: '8px'
                        }}>
                          <span>{language === 'japanese' ? '㊗️' : '🈶'}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {lesson.kanjiCount} {language === 'japanese' ? 'kanji' : 'hán tự'}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: '8px'
                        }}>
                          <span>📝</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {lesson.grammarCount} ngữ pháp
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {progress > 0 && !completed && (
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
                            <span style={{ 
                              fontWeight: 600, 
                              color: language === 'japanese' ? '#8b5cf6' : '#ef4444'
                            }}>
                              {progress}%
                            </span>
                          </div>
                          <div style={{
                            height: '8px',
                            background: 'var(--border-light)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${progress}%`,
                              background: language === 'japanese'
                                ? 'linear-gradient(90deg, #8b5cf6, #7c3aed)'
                                : 'linear-gradient(90deg, #ef4444, #dc2626)',
                              transition: 'width 0.3s ease',
                              borderRadius: '4px'
                            }} />
                          </div>
                        </div>
                      )}
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
