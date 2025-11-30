import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLessonById, getSentenceGames, getRoleplayScenarios } from '../services/supabaseService.v2';
import { transformLessonFromDB } from '../utils/dataTransform';
import { Lesson, RoleplayScenario } from '../types';
import { getLessonProgress, updateLessonProgress } from '../services/progressService';
import type { Language } from '../services/supabaseService.v2';
import VocabularySection from './VocabularySection';
import KanjiSection from './KanjiSection';
import GrammarSection from './GrammarSection';
import ListeningSection from './ListeningSection';
import SentenceGame from './SentenceGame';
import Flashcard from './Flashcard';
import Quiz from './Quiz';
import Roleplay from './Roleplay';
import Pronunciation from './Pronunciation';
import Shadowing from './Shadowing';
import '../App.css';

type LearningStep = 'learn' | 'practice' | 'test';

interface LessonDetailProps {
  language: Language;
}

const LessonDetail = ({ language }: LessonDetailProps) => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [currentStep, setCurrentStep] = useState<LearningStep>('learn');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseLevel, setCourseLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [sentenceGames, setSentenceGames] = useState<any[]>([]);
  const [roleplayScenarios, setRoleplayScenarios] = useState<RoleplayScenario[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Sub-tabs for each step
  const [learnTab, setLearnTab] = useState<'vocab' | 'kanji' | 'grammar'>('vocab');
  const [practiceTab, setPracticeTab] = useState<'listening' | 'flashcard' | 'game'>('listening');

  useEffect(() => {
    if (lessonId) {
      loadLesson();
      loadProgress();
    }
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const lessonData = await getLessonById(lessonId!);
      
      if (lessonData) {
        const transformed = transformLessonFromDB(lessonData);
        setLesson(transformed);
        setCourseLevel(transformed.level);

        const gamesResult = await getSentenceGames(lessonId!, language, 1, 100);
        setSentenceGames(gamesResult.data || []);

        const scenariosResult = await getRoleplayScenarios(lessonId!, language, 1, 100);
        const scenarios = scenariosResult.data;
        if (scenarios) {
          setRoleplayScenarios(scenarios.map((s: any) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            scenario: s.scenario,
            characterA: s.character_a,
            characterB: s.character_b,
            characterAScript: s.character_a_script || [],
            characterBScript: s.character_b_script || [],
            characterACorrectAnswers: s.character_a_correct_answers || [],
            characterBCorrectAnswers: s.character_b_correct_answers || [],
            vocabularyHints: s.vocabulary_hints || [],
            grammarPoints: s.grammar_points || [],
            difficulty: s.difficulty || 'medium',
            imageUrl: s.image_url,
            enableScoring: s.enable_scoring || false,
          })));
        }
      }
    } catch (err: any) {
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = () => {
    const progress = getLessonProgress(lessonId!);
    if (progress) {
      setCompletedSteps(new Set(progress.completedSteps));
    }
  };

  const markStepComplete = (step: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(step);
    setCompletedSteps(newCompleted);
    
    // Lưu vào service mới
    updateLessonProgress(lessonId!, [...newCompleted], 6);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải bài học...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container">
        <h1>Không tìm thấy bài học</h1>
        <Link to="/" className="back-button">← Về trang chủ</Link>
      </div>
    );
  }

  const totalItems = lesson.vocabulary.length + lesson.kanji.length + lesson.grammar.length;
  const progress = Math.round((completedSteps.size / 6) * 100); // 6 main activities

  return (
    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
      <FloatingCharacters language={language} count={10} />
      <Link to={`/${language}/courses/${courseLevel}`} className="back-button">
        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Về danh sách bài học
      </Link>

      {/* Lesson Header */}
      <div className="card" style={{ marginBottom: '2rem', background: 'var(--secondary-gradient)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'white' }}>{lesson.title}</h1>
            <p style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '1rem' }}>{lesson.description}</p>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              <span>📖 {lesson.vocabulary.length} từ vựng</span>
              <span>{language === 'japanese' ? '㊗️' : '🈶'} {lesson.kanji.length} {language === 'japanese' ? 'kanji' : 'hán tự'}</span>
              <span>📝 {lesson.grammar.length} ngữ pháp</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', minWidth: '120px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.5rem',
              fontSize: '2rem',
              fontWeight: '700'
            }}>
              {progress}%
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Hoàn thành</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ 
          height: '8px', 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: '999px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            height: '100%',
            width: `${progress}%`,
            background: 'rgba(255,255,255,0.9)',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Learning Path - 3 Main Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setCurrentStep('learn')}
          className="card"
          style={{
            cursor: 'pointer',
            border: currentStep === 'learn' ? '3px solid var(--primary-color)' : '2px solid var(--border-color)',
            background: currentStep === 'learn' ? 'var(--primary-light)' : 'var(--card-bg)',
            transition: 'all 0.2s',
            position: 'relative'
          }}
        >
          {completedSteps.has('learn-vocab') && completedSteps.has('learn-kanji') && completedSteps.has('learn-grammar') && (
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--success-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              ✓
            </div>
          )}
          <svg style={{ width: '48px', height: '48px', margin: '0 auto 0.5rem', color: currentStep === 'learn' ? 'var(--primary-color)' : 'var(--text-secondary)', strokeWidth: '1.5' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem', color: currentStep === 'learn' ? 'var(--primary-color)' : 'var(--text-primary)' }}>
            Bước 1: Học
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Từ vựng, Kanji, Ngữ pháp
          </p>
        </button>

        <button
          onClick={() => setCurrentStep('practice')}
          className="card"
          style={{
            cursor: 'pointer',
            border: currentStep === 'practice' ? '3px solid var(--success-color)' : '2px solid var(--border-color)',
            background: currentStep === 'practice' ? 'var(--success-light)' : 'var(--card-bg)',
            transition: 'all 0.2s',
            position: 'relative'
          }}
        >
          {completedSteps.has('practice-listening') && (
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--success-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              ✓
            </div>
          )}
          <svg style={{ width: '48px', height: '48px', margin: '0 auto 0.5rem', color: currentStep === 'practice' ? 'var(--success-color)' : 'var(--text-secondary)', strokeWidth: '1.5' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem', color: currentStep === 'practice' ? 'var(--success-color)' : 'var(--text-primary)' }}>
            Bước 2: Luyện tập
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Nghe, Nói, Flashcard, Game
          </p>
        </button>

        <button
          onClick={() => setCurrentStep('test')}
          className="card"
          style={{
            cursor: 'pointer',
            border: currentStep === 'test' ? '3px solid var(--warning-color)' : '2px solid var(--border-color)',
            background: currentStep === 'test' ? 'var(--warning-light)' : 'var(--card-bg)',
            transition: 'all 0.2s',
            position: 'relative'
          }}
        >
          {completedSteps.has('test-quiz') && (
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--success-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              ✓
            </div>
          )}
          <svg style={{ width: '48px', height: '48px', margin: '0 auto 0.5rem', color: currentStep === 'test' ? 'var(--warning-color)' : 'var(--text-secondary)', strokeWidth: '1.5' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem', color: currentStep === 'test' ? 'var(--warning-color)' : 'var(--text-primary)' }}>
            Bước 3: Kiểm tra
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Quiz tổng hợp
          </p>
        </button>
      </div>

      {/* Step Content */}
      {currentStep === 'learn' && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setLearnTab('vocab')}
              className={learnTab === 'vocab' ? 'btn btn-primary' : 'btn btn-outline'}
            >
              📖 Từ vựng ({lesson.vocabulary.length})
              {completedSteps.has('learn-vocab') && ' ✓'}
            </button>
            <button
              onClick={() => setLearnTab('kanji')}
              className={learnTab === 'kanji' ? 'btn btn-primary' : 'btn btn-outline'}
            >
              {language === 'japanese' ? '㊗️' : '🈶'} {language === 'japanese' ? 'Kanji' : 'Hán tự'} ({lesson.kanji.length})
              {completedSteps.has('learn-kanji') && ' ✓'}
            </button>
            <button
              onClick={() => setLearnTab('grammar')}
              className={learnTab === 'grammar' ? 'btn btn-primary' : 'btn btn-outline'}
            >
              📝 Ngữ pháp ({lesson.grammar.length})
              {completedSteps.has('learn-grammar') && ' ✓'}
            </button>
          </div>

          {learnTab === 'vocab' && (
            <div>
              <VocabularySection vocabulary={lesson.vocabulary} language={language} />
              {!completedSteps.has('learn-vocab') && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => markStepComplete('learn-vocab')}
                    style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}
                  >
                    ✓ Đã học xong từ vựng
                  </button>
                </div>
              )}
            </div>
          )}
          {learnTab === 'kanji' && (
            <div>
              <KanjiSection kanji={lesson.kanji} language={language} />
              {!completedSteps.has('learn-kanji') && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => markStepComplete('learn-kanji')}
                    style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}
                  >
                    ✓ Đã học xong {language === 'japanese' ? 'Kanji' : 'Hán tự'}
                  </button>
                </div>
              )}
            </div>
          )}
          {learnTab === 'grammar' && (
            <div>
              <GrammarSection grammar={lesson.grammar} />
              {!completedSteps.has('learn-grammar') && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => markStepComplete('learn-grammar')}
                    style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}
                  >
                    ✓ Đã học xong Ngữ pháp
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {currentStep === 'practice' && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setPracticeTab('listening')}
              className={practiceTab === 'listening' ? 'btn btn-primary' : 'btn btn-outline'}
            >
              👂 Nghe ({lesson.listening.length})
              {completedSteps.has('practice-listening') && ' ✓'}
            </button>
            <button
              onClick={() => setPracticeTab('flashcard')}
              className={practiceTab === 'flashcard' ? 'btn btn-primary' : 'btn btn-outline'}
            >
              🎴 Flashcard
              {completedSteps.has('practice-flashcard') && ' ✓'}
            </button>
            <button
              onClick={() => setPracticeTab('game')}
              className={practiceTab === 'game' ? 'btn btn-primary' : 'btn btn-outline'}
            >
              🎮 Game
              {completedSteps.has('practice-game') && ' ✓'}
            </button>
          </div>

          {practiceTab === 'listening' && (
            <div>
              <ListeningSection listening={lesson.listening} />
              {!completedSteps.has('practice-listening') && lesson.listening.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => markStepComplete('practice-listening')}
                    style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}
                  >
                    ✓ Hoàn thành bài nghe
                  </button>
                </div>
              )}
            </div>
          )}
          {practiceTab === 'flashcard' && (
            <div className="section-container">
              <div className="section-content">
                <Flashcard 
                  vocabulary={lesson.vocabulary}
                  onComplete={(mastered, total) => {
                    markStepComplete('practice-flashcard');
                  }}
                />
              </div>
            </div>
          )}
          {practiceTab === 'game' && (
            <div className="section-container">
              <div className="section-content">
                {sentenceGames.length > 0 ? (
                  <SentenceGame 
                    sentences={sentenceGames.map((g: any) => ({
                      id: g.id,
                      sentence: g.sentence,
                      translation: g.translation,
                      words: g.words || [],
                      correctOrder: g.correct_order || [],
                      hint: g.hint || undefined,
                    }))}
                    onComplete={(score, total) => {
                      markStepComplete('practice-game');
                    }}
                  />
                ) : (
                  <div className="empty-state">
                    <p>Chưa có game cho bài học này</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {currentStep === 'test' && (
        <div className="section-container">
          <div className="section-content">
            <Quiz 
              vocabulary={lesson.vocabulary}
              kanji={lesson.kanji}
              grammar={lesson.grammar}
              onComplete={(score, total) => {
                markStepComplete('test-quiz');
                if (score / total >= 0.8) {
                  alert(`🎉 Xuất sắc! Bạn đã đạt ${score}/${total} điểm!\n\nBạn đã hoàn thành bài học này!`);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonDetail;
