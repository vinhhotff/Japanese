import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLessonById, getSentenceGames, getRoleplayScenarios } from '../services/supabaseService.v2';
import { transformLessonFromDB } from '../utils/dataTransform';
import { Lesson, RoleplayScenario } from '../types';
import { getLessonProgress, updateLessonProgress } from '../services/progressService';
import { useAuth } from '../contexts/AuthContext';
import { getStudentClasses, joinClass } from '../services/classService';
import { supabase } from '../config/supabase';
import type { Language } from '../services/supabaseService.v2';
import VocabularySection from './VocabularySection';
import KanjiSection from './KanjiSection';
import GrammarSection from './GrammarSection';
import ListeningSection from './ListeningSection';
import SentenceGame from './SentenceGame';
import Flashcard from './Flashcard';
import Quiz from './Quiz';

import Pronunciation from './Pronunciation';
import Shadowing from './Shadowing';
import '../App.css';
import '../styles/lesson-detail-premium.css';
import FloatingCharacters from './FloatingCharacters';

type LearningStep = 'learn' | 'practice' | 'test';

interface LessonDetailProps {
  language: Language;
}

const LessonDetail = ({ language }: LessonDetailProps) => {
  const { user } = useAuth();
  const { lessonId } = useParams<{ lessonId: string }>();
  const [currentStep, setCurrentStep] = useState<LearningStep>('learn');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseLevel, setCourseLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [sentenceGames, setSentenceGames] = useState<any[]>([]);
  const [roleplayScenarios, setRoleplayScenarios] = useState<RoleplayScenario[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [enrollCode, setEnrollCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Sub-tabs for each step
  const [learnTab, setLearnTab] = useState<'vocab' | 'kanji' | 'grammar'>('vocab');
  const [practiceTab, setPracticeTab] = useState<'listening' | 'flashcard' | 'game'>('listening');

  useEffect(() => {
    if (lessonId) {
      loadLessonAndCheckAccess();
    }
  }, [lessonId, user]);

  const loadLessonAndCheckAccess = async () => {
    try {
      setLoading(true);
      setCheckingAccess(true);

      // Fetch lesson data first or in parallel? 
      // We need course_id from lesson to check specific course access.
      // But we can check class enrollments even without lesson data.

      const lessonData = await getLessonById(lessonId!);
      if (!lessonData) {
        setLoading(false);
        setCheckingAccess(false);
        return;
      }

      const transformed = transformLessonFromDB(lessonData);
      setLesson(transformed);
      setCourseLevel(transformed.level);

      // Parallelize checks that depend on having the lesson/user
      const checks = [];

      if (user) {
        // 1. Check direct purchase
        checks.push(
          supabase
            .from('user_courses')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', lessonData.course_id)
            .eq('status', 'active')
            .maybeSingle()
            .then(({ data }) => !!data)
        );

        // 2. Check class enrollments
        checks.push(
          getStudentClasses(user.id).then(enrollments =>
            enrollments.some((e: any) =>
              e.classes?.id === lessonData.course_id || (
                e.classes?.language === language &&
                (e.classes?.level || '').toUpperCase() === (transformed.level || '').toUpperCase()
              )
            )
          )
        );

        // 3. Load additional content
        checks.push(getSentenceGames(lessonId!, language, 1, 100).then(res => res.data || []));
        checks.push(getRoleplayScenarios(lessonId!, language, 1, 100).then(res => res.data || []));

        const [hasPurchased, isEnrolled, gamesData, scenariosData]: [boolean, boolean, any[], any[]] = await Promise.all(checks) as any;

        if (userIsAdmin || userIsTeacher || hasPurchased || isEnrolled) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }

        setSentenceGames(gamesData || []);
        if (scenariosData) {
          setRoleplayScenarios(scenariosData.map((s: any) => ({
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

        // Background sync progress
        import('../services/progressService').then(m => m.syncProgressFromCloud(user!.id)).then(() => {
          loadProgress();
        });
      } else {
        setHasAccess(false);
        loadProgress();
      }
    } catch (err: any) {
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
      setCheckingAccess(false);
    }
  };

  const currentLoggedInUser = user;
  const { isAdmin: userIsAdmin, isTeacher: userIsTeacher } = useAuth();

  const handleJoinByCode = async () => {
    if (!currentLoggedInUser || !enrollCode.trim()) return;

    try {
      setIsEnrolling(true);
      setEnrollError(null);
      await joinClass(currentLoggedInUser.id, enrollCode.trim().toUpperCase());
      // Refresh access
      await loadLessonAndCheckAccess();
      setEnrollCode('');
      alert('Chúc mừng! Bạn đã tham gia khóa học thành công.');
    } catch (err: any) {
      setEnrollError(err.message || 'Mã không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsEnrolling(false);
    }
  };

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

    // Lưu vào service mới (hỗ trợ cloud sync nếu đã đăng nhập)
    updateLessonProgress(lessonId!, [...newCompleted], 6, user?.id);
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

  const isLocked = !hasAccess && !userIsAdmin && !userIsTeacher && !lesson.is_free;

  return (
    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
      {isLocked && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          borderRadius: '24px',
          textAlign: 'center',
          minHeight: '400px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔒</div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Nội dung Premium
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            maxWidth: '500px',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            Bài học này thuộc chương trình Premium. Hãy nhập mã tham gia từ giáo viên hoặc mua khóa học để mở khóa toàn bộ nội dung.
          </p>

          <div style={{
            width: '100%',
            maxWidth: '400px',
            background: 'var(--card-bg)',
            padding: '2rem',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', textAlign: 'left', fontWeight: '700' }}>🔑 Nhập mã tham gia</h4>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={enrollCode}
                onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
                placeholder="VD: JP-N5-XXXXXX"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontWeight: '600'
                }}
              />
              <button
                onClick={handleJoinByCode}
                disabled={isEnrolling || !enrollCode.trim()}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary-color)',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {isEnrolling ? '...' : 'Gửi'}
              </button>
            </div>
            {enrollError && (
              <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left' }}>
                {enrollError}
              </p>
            )}

            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hoặc bạn có thể mua lẻ khóa học này</p>
              <Link
                to={`/${language}/courses`}
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'var(--success-color)',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '700'
                }}
              >
                🛒 Mua khóa học
              </Link>
            </div>
          </div>

          <Link to={`/${language}/courses`} style={{ marginTop: '2rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            ← Quay lại danh sách bài học
          </Link>
        </div>
      )}
      <FloatingCharacters language={language} count={10} />
      <div className="lesson-header-navigation">
        <Link to={`/${language}/courses/${courseLevel}`} className="back-link-small">
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Về danh sách bài học
        </Link>
      </div>

      {/* Lesson Header & Progress */}
      <div className="lesson-detail-hero">
        <div className="lesson-hero-card" style={{
          background: language === 'japanese'
            ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        }}>
          <div className="lesson-hero-content">
            <div className="hero-main-info">
              <div className="hero-badge-row">
                <span className="hero-lang-badge">{language === 'japanese' ? '🇯🇵 Japanese' : '🇨🇳 Chinese'}</span>
                <span className="hero-level-badge">{courseLevel}</span>
              </div>
              <h1 className="hero-title">{lesson.title}</h1>
              <p className="hero-description">{lesson.description}</p>

              <div className="hero-stats-row">
                <div className="hero-stat-item">
                  <span className="stat-icon">📖</span>
                  <span className="stat-text">{lesson.vocabulary.length} từ vựng</span>
                </div>
                <div className="hero-stat-item">
                  <span className="stat-icon">{language === 'japanese' ? '㊗️' : '🈶'}</span>
                  <span className="stat-text">{lesson.kanji.length} {language === 'japanese' ? 'kanji' : 'hán tự'}</span>
                </div>
                <div className="hero-stat-item">
                  <span className="stat-icon">📝</span>
                  <span className="stat-text">{lesson.grammar.length} ngữ pháp</span>
                </div>
              </div>
            </div>

            <div className="progress-card-wrapper">
              <div className="progress-card">
                <div className="progress-circle-container">
                  <svg className="progress-circle-svg" viewBox="0 0 100 100">
                    <circle className="progress-circle-bg" cx="50" cy="50" r="45" />
                    <circle
                      className="progress-circle-fill"
                      cx="50" cy="50" r="45"
                      style={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                    />
                  </svg>
                  <div className="progress-percentage">{progress}%</div>
                </div>
                <div className="progress-label">Hoàn thành</div>
              </div>
            </div>
          </div>

          <div className="hero-progress-bar-container">
            <div className="hero-progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Learning Path - 3 Main Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setCurrentStep('learn')}
          className="card"
          style={{
            cursor: 'pointer',
            border: currentStep === 'learn'
              ? `3px solid ${language === 'japanese' ? '#8b5cf6' : '#ef4444'}`
              : '2px solid var(--border-color)',
            background: currentStep === 'learn'
              ? (language === 'japanese' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)')
              : 'var(--card-bg)',
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
          <svg style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 0.5rem',
            color: currentStep === 'learn'
              ? (language === 'japanese' ? '#8b5cf6' : '#ef4444')
              : 'var(--text-secondary)',
            strokeWidth: '1.5'
          }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: '0.25rem',
            color: currentStep === 'learn'
              ? (language === 'japanese' ? '#8b5cf6' : '#ef4444')
              : 'var(--text-primary)'
          }}>
            Bước 1: Học
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Từ vựng, {language === 'japanese' ? 'Kanji' : 'Hán tự'}, Ngữ pháp
          </p>
        </button>

        <button
          onClick={() => setCurrentStep('practice')}
          className="card"
          style={{
            cursor: 'pointer',
            border: currentStep === 'practice'
              ? `3px solid ${language === 'japanese' ? '#10b981' : '#f59e0b'}`
              : '2px solid var(--border-color)',
            background: currentStep === 'practice'
              ? (language === 'japanese' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)')
              : 'var(--card-bg)',
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
          <svg style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 0.5rem',
            color: currentStep === 'practice'
              ? (language === 'japanese' ? '#10b981' : '#f59e0b')
              : 'var(--text-secondary)',
            strokeWidth: '1.5'
          }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: '0.25rem',
            color: currentStep === 'practice'
              ? (language === 'japanese' ? '#10b981' : '#f59e0b')
              : 'var(--text-primary)'
          }}>
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
            border: currentStep === 'test'
              ? `3px solid ${language === 'japanese' ? '#3b82f6' : '#ec4899'}`
              : '2px solid var(--border-color)',
            background: currentStep === 'test'
              ? (language === 'japanese' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)')
              : 'var(--card-bg)',
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
          <svg style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 0.5rem',
            color: currentStep === 'test'
              ? (language === 'japanese' ? '#3b82f6' : '#ec4899')
              : 'var(--text-secondary)',
            strokeWidth: '1.5'
          }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: '0.25rem',
            color: currentStep === 'test'
              ? (language === 'japanese' ? '#3b82f6' : '#ec4899')
              : 'var(--text-primary)'
          }}>
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
