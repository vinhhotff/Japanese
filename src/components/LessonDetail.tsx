import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLessonById, getSentenceGames, getRoleplayScenarios } from '../services/supabaseService.v2';
import { transformLessonFromDB } from '../utils/dataTransform';
import { Lesson, RoleplayScenario } from '../types';
import { getLessonProgress, updateLessonProgress, syncProgressFromCloud } from '../services/progressService';
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
import '../styles/core.css';
import '../styles/lesson-shared.css';
import '../styles/lesson-detail-premium.css';
import '../styles/skeleton.css';
import FloatingCharacters from './FloatingCharacters';

type LearningStep = 'learn' | 'practice' | 'test';

interface LessonDetailProps {
  language: Language;
}

const LessonDetail = ({ language }: LessonDetailProps) => {
  const { user, isAdmin, isTeacher } = useAuth();
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
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // Sub-tabs for each step
  const [learnTab, setLearnTab] = useState<'vocab' | 'kanji' | 'grammar'>('vocab');
  const [practiceTab, setPracticeTab] = useState<'listening' | 'flashcard' | 'game'>('listening');

  useEffect(() => {
    if (lessonId) {
      loadLessonAndCheckAccess();
    }
  }, [lessonId, user]);

  const loadLessonAndCheckAccess = async () => {
    if (!lessonId) return;

    try {
      setLoading(true);
      setCheckingAccess(true);

      const lessonData = await getLessonById(lessonId);
      if (!lessonData) {
        setLoading(false);
        setCheckingAccess(false);
        return;
      }

      const transformed = transformLessonFromDB(lessonData);
      setLesson(transformed);
      setCourseLevel(transformed.level);

      // Always load games and scenarios
      const [gamesResult, scenariosResult] = await Promise.all([
        getSentenceGames(lessonId, language, 1, 100),
        getRoleplayScenarios(lessonId, language, 1, 100),
      ]);

      setSentenceGames(gamesResult.data || []);
      if (scenariosResult.data) {
        setRoleplayScenarios(scenariosResult.data.map((s: any) => ({
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

      // Determine access: Admins/Teachers always have access
      if (isAdmin || isTeacher) {
        setHasAccess(true);
      } else if (transformed.is_free) {
        // Free lessons accessible to everyone (including guests)
        setHasAccess(true);
      } else if (!user) {
        // Guest trying to access paid lesson - show login modal
        setHasAccess(false);
        setShowEnrollModal(true);
      } else {
        // Logged-in student: check purchase or enrollment
        const [courseAccess, enrollments] = await Promise.all([
          supabase
            .from('user_courses')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', lessonData.course_id)
            .eq('status', 'active')
            .maybeSingle(),
          getStudentClasses(user.id),
        ]);

        const hasPurchased = !!courseAccess;
        const isEnrolled = enrollments.some((e: any) =>
          e.classes?.id === lessonData.course_id || (
            e.classes?.language === language &&
            (e.classes?.level || '').toUpperCase() === (transformed.level || '').toUpperCase()
          )
        );

        if (hasPurchased || isEnrolled) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
          setShowEnrollModal(true);
        }
      }

      // Sync progress for logged-in users
      if (user) {
        syncProgressFromCloud(user.id).then((synced) => {
          if (synced) loadProgress();
        }).catch(() => { });
      }

      loadProgress();
    } catch (err) {
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
      setCheckingAccess(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!user || !enrollCode.trim()) return;

    try {
      setIsEnrolling(true);
      setEnrollError(null);
      await joinClass(user.id, enrollCode.trim().toUpperCase());
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
      <div className="lesson-detail-skeleton">
        {/* Back Link Skeleton */}
        <div className="skeleton lesson-detail-skeleton__back"></div>

        {/* Hero Section Skeleton */}
        <div className="lesson-detail-skeleton__hero">
          <div className="lesson-detail-skeleton__hero-info">
            <div className="lesson-detail-skeleton__badges">
              <div className="skeleton lesson-detail-skeleton__hero-badge"></div>
              <div className="skeleton lesson-detail-skeleton__hero-badge"></div>
            </div>
            <div className="skeleton lesson-detail-skeleton__hero-title"></div>
            <div className="skeleton lesson-detail-skeleton__hero-desc"></div>
            <div className="lesson-detail-skeleton__hero-stats">
              <div className="lesson-detail-skeleton__stat">
                <div className="skeleton lesson-detail-skeleton__stat-icon"></div>
                <div className="skeleton lesson-detail-skeleton__stat-text"></div>
              </div>
              <div className="lesson-detail-skeleton__stat">
                <div className="skeleton lesson-detail-skeleton__stat-icon"></div>
                <div className="skeleton lesson-detail-skeleton__stat-text"></div>
              </div>
              <div className="lesson-detail-skeleton__stat">
                <div className="skeleton lesson-detail-skeleton__stat-icon"></div>
                <div className="skeleton lesson-detail-skeleton__stat-text"></div>
              </div>
            </div>
          </div>
          <div className="lesson-detail-skeleton__progress">
            <div className="skeleton lesson-detail-skeleton__progress-value"></div>
            <div className="skeleton lesson-detail-skeleton__progress-label"></div>
          </div>
        </div>

        {/* Steps Skeleton */}
        <div className="lesson-detail-skeleton__steps">
          {[1, 2, 3].map((i) => (
            <div key={i} className="lesson-detail-skeleton__step">
              <div className="skeleton lesson-detail-skeleton__step-icon"></div>
              <div className="lesson-detail-skeleton__step-content">
                <div className="skeleton lesson-detail-skeleton__step-title"></div>
                <div className="skeleton lesson-detail-skeleton__step-desc"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="lesson-detail-skeleton__tabs">
          <div className="skeleton lesson-detail-skeleton__tab"></div>
          <div className="skeleton lesson-detail-skeleton__tab"></div>
          <div className="skeleton lesson-detail-skeleton__tab"></div>
        </div>

        {/* Content Skeleton */}
        <div className="lesson-detail-skeleton__content">
          <div className="skeleton lesson-detail-skeleton__content-title"></div>
          <div className="lesson-detail-skeleton__content-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="lesson-detail-skeleton__content-item">
                <div className="skeleton lesson-detail-skeleton__content-kanji"></div>
                <div className="skeleton lesson-detail-skeleton__content-item-title"></div>
                <div className="skeleton lesson-detail-skeleton__content-item-desc"></div>
              </div>
            ))}
          </div>
        </div>
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

  const isLocked = !hasAccess && !lesson.is_free;

  return (
    <div className={`container lesson-detail-premium ${language === 'japanese' ? 'jp-theme' : 'cn-theme'}`} style={{ position: 'relative', zIndex: 1 }} data-language={language}>
      {/* Cultural SVG Background Pattern */}
      <svg className="cultural-pattern" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          {language === 'japanese' ? (
            <>
              <pattern id="sakura-pattern-lesson" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="3" fill="#ffc0cb" opacity="0.15" />
                <circle cx="150" cy="100" r="2" fill="#ffb6c1" opacity="0.12" />
                <path d="M 30 30 Q 35 25 40 30 T 50 30" stroke="#c41e3a" strokeWidth="0.5" fill="none" opacity="0.08" />
              </pattern>
            </>
          ) : (
            <>
              <pattern id="chinese-pattern-lesson" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="3" fill="#dc143c" opacity="0.12" />
                <rect x="80" y="80" width="40" height="40" fill="none" stroke="#dc143c" strokeWidth="0.5" opacity="0.08" />
              </pattern>
            </>
          )}
        </defs>
        <rect width="100%" height="100%" fill={`url(#${language === 'japanese' ? 'sakura' : 'chinese'}-pattern-lesson)`} />
      </svg>

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
            {user
              ? 'Bài học này thuộc chương trình Premium. Hãy nhập mã tham gia từ giáo viên hoặc mua khóa học để mở khóa toàn bộ nội dung.'
              : 'Hãy đăng nhập hoặc tạo tài khoản để truy cập bài học này. Bạn có thể xem trước một số bài học miễn phí.'
            }
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
            {!user ? (
              <>
                <h4 style={{ margin: '0 0 1rem 0', textAlign: 'center', fontWeight: '700' }}>🔑 Đăng nhập để tiếp tục</h4>
                <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Đăng nhập để truy cập bài học này và theo dõi tiến độ học tập của bạn.
                </p>
                <Link
                  to="/login"
                  state={{ from: `/japanese/lessons/${lessonId}` }}
                  style={{
                    display: 'block',
                    padding: '0.875rem',
                    borderRadius: '10px',
                    background: 'var(--primary-color)',
                    color: 'white',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  state={{ from: `/japanese/lessons/${lessonId}` }}
                  style={{
                    display: 'block',
                    padding: '0.875rem',
                    borderRadius: '10px',
                    border: '1.5px solid var(--primary-color)',
                    color: 'var(--primary-color)',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                >
                  Tạo tài khoản miễn phí
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <Link to={`/${language}/courses/${courseLevel}`} style={{ marginTop: '2rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
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
            ? 'linear-gradient(135deg, var(--jp-primary) 0%, var(--jp-primary-dark) 100%)'
            : 'linear-gradient(135deg, var(--cn-primary) 0%, var(--cn-primary-dark) 100%)',
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
      <div className="learning-step-grid">
        <button
          onClick={() => setCurrentStep('learn')}
          className={`step-card ${currentStep === 'learn' ? 'active' : ''} ${language === 'japanese' ? 'jp-theme' : 'cn-theme'}`}
          style={{
            color: currentStep === 'learn'
              ? (language === 'japanese' ? 'var(--jp-primary)' : 'var(--cn-primary)')
              : 'inherit'
          }}
        >
          {completedSteps.has('learn-vocab') && completedSteps.has('learn-kanji') && completedSteps.has('learn-grammar') && (
            <div className="step-complete-badge">✓</div>
          )}
          <svg className="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="step-title">Bước 1: Học</h3>
          <p className="step-description">
            Từ vựng, {language === 'japanese' ? 'Kanji' : 'Hán tự'}, Ngữ pháp
          </p>
        </button>

        <button
          onClick={() => setCurrentStep('practice')}
          className={`step-card ${currentStep === 'practice' ? 'active' : ''} ${language === 'japanese' ? 'jp-theme' : 'cn-theme'}`}
          style={{
            color: currentStep === 'practice'
              ? (language === 'japanese' ? 'var(--jp-primary)' : 'var(--cn-primary)')
              : 'inherit',
            borderColor: currentStep === 'practice'
              ? (language === 'japanese' ? 'var(--jp-primary)' : 'var(--cn-primary)')
              : undefined,
            background: currentStep === 'practice'
              ? (language === 'japanese' ? 'rgba(185, 28, 44, 0.08)' : 'rgba(185, 28, 28, 0.08)')
              : undefined
          }}
        >
          {completedSteps.has('practice-listening') && (
            <div className="step-complete-badge">✓</div>
          )}
          <svg className="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="step-title">Bước 2: Luyện tập</h3>
          <p className="step-description">
            Nghe, Nói, Flashcard, Game
          </p>
        </button>

        <button
          onClick={() => setCurrentStep('test')}
          className={`step-card ${currentStep === 'test' ? 'active' : ''} ${language === 'japanese' ? 'jp-theme' : 'cn-theme'}`}
          style={{
            color: currentStep === 'test'
              ? (language === 'japanese' ? 'var(--jp-primary)' : 'var(--cn-primary)')
              : 'inherit',
            borderColor: currentStep === 'test'
              ? (language === 'japanese' ? 'var(--jp-primary)' : 'var(--cn-primary)')
              : undefined,
            background: currentStep === 'test'
              ? (language === 'japanese' ? 'rgba(185, 28, 44, 0.08)' : 'rgba(185, 28, 28, 0.08)')
              : undefined
          }}
        >
          {completedSteps.has('test-quiz') && (
            <div className="step-complete-badge">✓</div>
          )}
          <svg className="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="step-title">Bước 3: Kiểm tra</h3>
          <p className="step-description">
            Quiz tổng hợp
          </p>
        </button>
      </div>

      {/* Step Content */}
      {currentStep === 'learn' && (
        <div>
          <div className="tab-buttons">
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
                <div className="complete-section-btn">
                  <button
                    className="btn btn-primary"
                    onClick={() => markStepComplete('learn-vocab')}
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
                <div className="complete-section-btn">
                  <button
                    className="btn btn-primary"
                    onClick={() => markStepComplete('learn-kanji')}
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
                <div className="complete-section-btn">
                  <button
                    className="btn btn-primary"
                    onClick={() => markStepComplete('learn-grammar')}
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
          <div className="tab-buttons">
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
                <div className="complete-section-btn">
                  <button
                    className="btn btn-primary"
                    onClick={() => markStepComplete('practice-listening')}
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
