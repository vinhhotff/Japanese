import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { getStudentClasses, joinClass } from '../services/classService';
import { getLessons } from '../services/supabaseService.v2';
import { getLessonCompletionPercentage, isLessonCompleted } from '../services/progressService';
import type { Language } from '../services/supabaseService.v2';
import FloatingCharacters from './FloatingCharacters';
import Pagination from './common/Pagination';
import '../styles/custom-theme.css';
import '../styles/premium-features.css';
import '../styles/lesson-list-premium.css';
import '../styles/skeleton.css';

interface LessonListNewProps {
  language: Language;
}

const LessonListNew = ({ language }: LessonListNewProps) => {
  const { level } = useParams<{ level: string }>();
  const { user, isAdmin, isTeacher } = useAuth();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [showTrialNotice, setShowTrialNotice] = useState(false);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [enrollCode, setEnrollCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [switchingCourse, setSwitchingCourse] = useState(false);
  const itemsPerPage = 8;

  useEffect(() => {
    checkAccessAndLoad();
  }, [level, language, user]);

  const checkAccessAndLoad = async () => {
    setCheckingAccess(true);

    let courseId: string | null = null;

    // Load lessons first (this sets courseInfo in state)
    const loadedCourse = await loadLessons();
    courseId = loadedCourse?.id || null;

    // Admin and Teacher have full access
    if (isAdmin || isTeacher) {
      setHasAccess(true);
      setCheckingAccess(false);
      return;
    }

    // Check access for logged-in users
    if (!user) {
      setHasAccess(false);
      setShowTrialNotice(true);
      setCheckingAccess(false);
      return;
    }

    try {
      // 1. Check user_courses (Direct purchase) using courseId from loaded data
      const { data: courseAccess } = await supabase
        .from('user_courses')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('status', 'active')
        .maybeSingle();

      if (courseAccess) {
        setHasAccess(true);
        setShowTrialNotice(false);
        setCheckingAccess(false);
        return;
      }

      // 2. Fallback to old enrollment system
      const enrollments = await getStudentClasses(user.id);
      const isEnrolled = enrollments.some((e: any) =>
        e.classes?.language === language &&
        (e.classes?.level || '').toUpperCase() === (level || '').toUpperCase()
      );

      setHasAccess(isEnrolled);
      if (!isEnrolled) {
        setShowTrialNotice(true);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
      setShowTrialNotice(true);
    } finally {
      setCheckingAccess(false);
    }
  };

  const loadLessons = async (isSwitching = false): Promise<any> => {
    try {
      if (isSwitching) setSwitchingCourse(true);
      else setLoading(true);

      // 1. Fetch Course ID first
      const { getCourseByLevel } = await import('../services/supabaseService');
      const targetLevel = (level || '').toUpperCase();
      const course = await getCourseByLevel(language, targetLevel);

      let lessonsData: any[] = [];

      if (course) {
        setCourseInfo(course);
        const lessonsResult = await getLessons(course.id, undefined, undefined, 1, 1000);
        lessonsData = lessonsResult.data || [];
      } else {
        const lessonsResult = await getLessons(undefined, language, targetLevel as any, 1, 1000);
        lessonsData = lessonsResult.data || [];
      }

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
            is_free: l.is_free
          };
        });

      setLessons(lessonsOfLevel);
      setCurrentPage(1);
      return course || null;
    } catch (err) {
      console.error('Error loading lessons:', err);
      return null;
    } finally {
      setLoading(false);
      setSwitchingCourse(false);
    }
  };

  const currentItems = lessons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (checkingAccess || loading) {
    return (
      <div className="lesson-list-skeleton">
        {/* Header Skeleton */}
        <div className="lesson-list-skeleton__header">
          <div className="skeleton lesson-list-skeleton__lang-icon"></div>
          <div className="lesson-list-skeleton__header-info">
            <div className="skeleton lesson-list-skeleton__header-badge"></div>
            <div className="skeleton lesson-list-skeleton__header-title"></div>
            <div className="lesson-list-skeleton__header-stats">
              <div className="skeleton lesson-list-skeleton__stat"></div>
              <div className="skeleton lesson-list-skeleton__stat"></div>
              <div className="skeleton lesson-list-skeleton__stat"></div>
            </div>
          </div>
        </div>

        {/* Info Box Skeleton */}
        <div className="lesson-list-skeleton__info-box">
          <div className="skeleton lesson-list-skeleton__info-icon"></div>
          <div className="lesson-list-skeleton__info-content">
            <div className="skeleton lesson-list-skeleton__info-title"></div>
            <div className="skeleton lesson-list-skeleton__info-text"></div>
            <div className="skeleton lesson-list-skeleton__info-text"></div>
          </div>
        </div>

        {/* Lesson Cards Skeleton */}
        <div className="lesson-list-skeleton__grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="lesson-list-skeleton__card">
              <div className="skeleton lesson-list-skeleton__card-number"></div>
              <div className="lesson-list-skeleton__card-content">
                <div className="skeleton lesson-list-skeleton__card-title"></div>
                <div className="skeleton lesson-list-skeleton__card-desc"></div>
                <div className="lesson-list-skeleton__card-stats">
                  <div className="skeleton lesson-list-skeleton__card-stat"></div>
                  <div className="skeleton lesson-list-skeleton__card-stat"></div>
                  <div className="skeleton lesson-list-skeleton__card-stat"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleBuyCourse = () => {
    // Already have access
    if (hasAccess) return;

    // Not logged in: redirect to login
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    // Free courses: enroll directly without showing modal
    if (courseInfo && courseInfo.price === 0) {
      enrollFreeCourse();
      return;
    }
    setShowPurchaseModal(true);
  };

  const enrollFreeCourse = async () => {
    if (!user || !courseInfo) return;

    // Check if already enrolled
    if (hasAccess) {
      setShowPurchaseModal(false);
      return;
    }

    try {
      setIsProcessingPayment(true);
      const { supabase } = await import('../config/supabase');

      // Check existing enrollment
      const { data: existing } = await supabase
        .from('user_courses')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseInfo.id)
        .maybeSingle();

      if (existing) {
        setHasAccess(true);
        setShowTrialNotice(false);
        setShowPurchaseModal(false);
        return;
      }

      // Insert user_courses for free courses
      const { error } = await supabase
        .from('user_courses')
        .insert({
          user_id: user.id,
          course_id: courseInfo.id,
          status: 'active',
          purchased_at: new Date().toISOString()
        });

      if (error) throw error;
      setHasAccess(true);
      setShowTrialNotice(false);
      setShowPurchaseModal(false);
      alert('Chúc mừng! Bạn đã đăng ký khóa học miễn phí thành công.');
    } catch (err) {
      console.error('Enroll free course error:', err);
      alert('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!courseInfo) return;

    // Free courses: enroll directly
    if (courseInfo.price === 0) {
      enrollFreeCourse();
      return;
    }

    // If not logged in, redirect to login first
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    try {
      setIsProcessingPayment(true);
      const { data: sessionData } = await import('../config/supabase').then(m => m.supabase.auth.getSession());
      const token = sessionData.session?.access_token;

      if (!token) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      const returnUrl = `${window.location.origin}/payment/success`;
      const cancelUrl = `${window.location.origin}/${language}/courses/${level}`;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: courseInfo.id,
          returnUrl,
          cancelUrl
        })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data?.error || 'Lỗi tạo link thanh toán. Vui lòng thử lại.');
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data?.error || 'Lỗi tạo link thanh toán. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Buy error:', error);
      alert('Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!user || !enrollCode.trim()) return;

    try {
      setIsEnrolling(true);
      setEnrollError(null);
      await joinClass(user.id, enrollCode.trim().toUpperCase());
      // Refresh access status
      await checkAccessAndLoad();
      setEnrollCode('');
      alert('Chúc mừng! Bạn đã tham gia khóa học thành công.');
    } catch (err: any) {
      setEnrollError(err.message || 'Mã không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsEnrolling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Freemium Logic:
  // If hasAccess (Enrolled/Admin/Teacher) -> Show all
  // If !hasAccess -> Show list, but lock "is_free === false" lessons

  // We no longer block the whole component if !hasAccess. 
  // Instead we render the list with locks.

  // Remove the "Access Denied" block entirely. Use it for "Premium Content" state inside render.

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
        background: language === 'japanese' ? 'var(--secondary-color)' : 'var(--danger-color)',
        borderRadius: '24px',
        padding: '3rem 2rem',
        color: 'white',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
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
                marginBottom: '0.75rem'
              }}>
                {language === 'japanese' ? 'JLPT' : 'HSK'} {level}
              </div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                margin: 0,
                color: 'white'
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
        border: `2px solid ${language === 'japanese' ? 'var(--jp-primary)' : 'var(--cn-primary)'}`,
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            fontSize: '2rem',
            background: language === 'japanese' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '0.75rem',
            borderRadius: '12px'
          }}>
            💡
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
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

          {/* Join Code Section - Only show if no access */}
          {!hasAccess && (
            <div style={{
              flex: '1 1 100%',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px dashed var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                🔑 Đã có mã tham gia từ giáo viên?
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={enrollCode}
                  onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã (VD: JP-N5-XXXXXX)"
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: '600'
                  }}
                />
                <button
                  onClick={handleJoinByCode}
                  disabled={isEnrolling || !enrollCode.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: language === 'japanese' ? 'var(--primary-color)' : 'var(--danger-color)',
                    color: 'white',
                    fontWeight: '700',
                    cursor: (isEnrolling || !enrollCode.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isEnrolling || !enrollCode.trim()) ? 0.7 : 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isEnrolling ? 'Đang tham gia...' : 'Tham gia lớp'}
                </button>
              </div>
              {enrollError && (
                <p style={{ margin: 0, color: 'var(--danger-color)', fontSize: '0.85rem', fontWeight: '600' }}>
                  ⚠️ {enrollError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Buy Course Notice */}
      <AnimatePresence mode="wait">
        {!hasAccess && showTrialNotice && (
          <motion.div
            key="premium-notice"
            className="premium-floating-notice"
          >
            <div className="premium-glow premium-glow-top" />
            <div className="premium-glow premium-glow-bottom" />

            <button
              onClick={() => setShowTrialNotice(false)}
              className="premium-close-btn"
              aria-label="Đóng"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="premium-header">
              <div className="premium-icon-box" style={{ background: 'rgba(255,255,255,0.1)', boxShadow: 'none' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div className="premium-title">
                <span className="premium-badge" style={{ color: 'rgba(255,255,255,0.5)' }}>{user ? 'Tiếp cận giới hạn' : 'Truy cập bài học'}</span>
                <h3>{user ? 'Nâng cấp Premium' : 'Đăng nhập để học'}</h3>
              </div>
            </div>

            <p className="premium-description">
              {user
                ? courseInfo?.price === 0
                  ? 'Khóa học này MIỄN PHÍ! Nhấn nút bên dưới để đăng ký ngay.'
                  : 'Bạn đang xem các bài học thử miễn phí. Hãy đăng ký ngay để mở khóa toàn bộ nội dung và bài tập!'
                : 'Xem trước một số bài học miễn phí. Đăng nhập hoặc tạo tài khoản để truy cập toàn bộ khóa học.'
              }
            </p>

            {user ? (
              courseInfo?.price === 0 ? (
                <button
                  onClick={enrollFreeCourse}
                  disabled={isProcessingPayment}
                  className="premium-action-btn"
                  style={{ background: 'var(--success-color)', color: 'white', boxShadow: 'none' }}
                >
                  {isProcessingPayment ? 'Đang đăng ký...' : 'Đăng ký miễn phí ngay'}
                </button>
              ) : (
                <button
                  onClick={handleBuyCourse}
                  className="premium-action-btn"
                  style={{ background: 'white', color: 'black', boxShadow: 'none' }}
                >
                  Mở khóa toàn bộ
                </button>
              )
            ) : (
              <>
                <Link
                  to="/login"
                  state={{ from: window.location.pathname }}
                  className="premium-action-btn"
                  style={{ background: 'white', color: 'black', boxShadow: 'none', display: 'block', textAlign: 'center', textDecoration: 'none' }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  state={{ from: window.location.pathname }}
                  className="premium-action-btn"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'white', boxShadow: 'none', display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '0.75rem', border: '1.5px solid rgba(255,255,255,0.3)' }}
                >
                  Tạo tài khoản miễn phí
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lessons List */}
      <div style={{ position: 'relative', display: 'grid', gap: '1.5rem', paddingBottom: '3rem' }}>
        {switchingCourse && (
          <div className="course-switch-overlay">
            <div className="spinner-large"></div>
          </div>
        )}
        {currentItems.map((lesson, index) => {
          const progress = getLessonCompletionPercentage(lesson.id);
          const completed = isLessonCompleted(lesson.id);
          const isLocked = !hasAccess && !lesson.is_free;

          const LessonCardContent = (
            <div
              className={`card locked-container ${isLocked ? 'is-premium-locked' : ''}`}
              style={{
                padding: '2rem',
                cursor: (isLocked || switchingCourse) ? 'not-allowed' : 'pointer',
                position: 'relative',
                opacity: switchingCourse ? 0.5 : 1
              }}
            >
              {/* Premium Blur Overlay for Locked Content */}
              {isLocked && (
                <div className="premium-locked-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <div className="premium-lock-text">Nội dung Premium</div>
                </div>
              )}

              <div className="flex justify-between items-start mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div className="flex items-center gap-6" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div
                    className="lesson-number-badge"
                    style={{
                      width: '64px',
                      height: '64px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '16px',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      background: completed ? 'var(--success-color)' : 'var(--danger-light)',
                      color: completed ? 'white' : 'var(--danger-color)',
                      boxShadow: completed ? '0 8px 16px rgba(16, 185, 129, 0.2)' : '0 8px 16px rgba(239, 68, 68, 0.1)'
                    }}
                  >
                    {lesson.lessonNumber}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        marginBottom: '0.5rem',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {lesson.title}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!hasAccess && lesson.is_free && (
                    <div style={{
                      background: 'var(--success-color)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.35rem 1rem',
                      borderRadius: '99px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                    }}>
                      MIỄN PHÍ
                    </div>
                  )}
                  {completed && (
                    <div style={{
                      background: 'var(--success-light)',
                      color: 'var(--success-color)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.35rem 1rem',
                      borderRadius: '99px',
                      border: '1px solid var(--success-color)'
                    }}>
                      ✓ HOÀN THÀNH
                    </div>
                  )}
                </div>
              </div>

              {lesson.description && (
                <p style={{
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1.5rem',
                  lineHeight: 1.6,
                  opacity: isLocked ? 0.5 : 1
                }}>
                  {lesson.description}
                </p>
              )}

              {/* Stats - Hide if locked to increase premium curiosity or show with blur */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                filter: isLocked ? 'blur(2px)' : 'none',
                opacity: isLocked ? 0.3 : 1
              }}>
                <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', fontSize: '0.9rem' }}>
                  📖 {lesson.vocabCount} từ vựng
                </div>
                <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', fontSize: '0.9rem' }}>
                  {language === 'japanese' ? '㊗️' : '🈶'} {lesson.kanjiCount} {language === 'japanese' ? 'kanji' : 'hán tự'}
                </div>
                <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', fontSize: '0.9rem' }}>
                  📝 {lesson.grammarCount} ngữ pháp
                </div>
              </div>

              {progress > 0 && !completed && !isLocked && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-color)' }} />
                  </div>
                </div>
              )}
            </div>
          );

          return isLocked ? (
            <div key={lesson.id} onClick={() => !switchingCourse && setShowTrialNotice(true)} style={{ opacity: 0.9 }}>
              {LessonCardContent}
            </div>
          ) : (
            <Link
              key={lesson.id}
              to={switchingCourse ? '#' : `/${language}/lessons/${lesson.id}`}
              style={{ textDecoration: 'none', color: 'inherit', pointerEvents: switchingCourse ? 'none' : 'auto' }}
            >
              {LessonCardContent}
            </Link>
          );
        })}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(lessons.length / itemsPerPage)}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={lessons.length}
      />

      {lessons.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--card-bg)', borderRadius: '24px', border: '1px dashed var(--border-color)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Chưa có bài học nào cho cấp độ này</p>
        </div>
      )}
      {/* Purchase Confirmation Modal */}
      <AnimatePresence>
        {showPurchaseModal && courseInfo && (
          <div className="modal-overlay" style={{
            zIndex: 10001,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} onClick={() => setShowPurchaseModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="purchase-modal"
              style={{
                width: '90%',
                maxWidth: '480px',
                borderRadius: '32px',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--card-bg, #ffffff)',
                border: language === 'japanese'
                  ? '2px solid var(--jp-primary)'
                  : '2px solid var(--cn-primary)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Gradient Strip */}
              <div style={{
                height: '8px',
                width: '100%',
                background: language === 'japanese'
                  ? 'linear-gradient(90deg, var(--jp-primary), var(--jp-primary-light))'
                  : 'linear-gradient(90deg, var(--cn-primary), var(--cn-primary-light))'
              }} />

              {/* Decorative Background Pattern */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                opacity: 0.05,
                zIndex: 0,
                pointerEvents: 'none'
              }}>
                {language === 'japanese' ? (
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c-1.5 0-3 1.5-3 3.5 0 1 .3 1.8.7 2.5-.8.3-1.7.8-2.2 1.5C6.5 10.5 6 12 6 14c0 2.5 1.5 4.5 4 5.5 0 1 .5 2.5 2 2.5s2-1.5 2-2.5c2.5-1 4-3 4-5.5 0-2-0.5-3.5-1.5-4.5-.5-.7-1.4-1.2-2.2-1.5.4-.7.7-1.5.7-2.5 0-2-1.5-3.5-3-3.5z" />
                  </svg>
                ) : (
                  <svg width="120" height="120" viewBox="0 0 24 32" fill="currentColor">
                    <ellipse cx="12" cy="16" rx="8" ry="10" />
                  </svg>
                )}
              </div>

              <div style={{ padding: '2.5rem', position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '24px',
                  background: courseInfo.price === 0
                    ? 'rgba(16, 185, 129, 0.1)'
                    : (language === 'japanese' ? 'rgba(185, 28, 44, 0.1)' : 'rgba(185, 28, 28, 0.1)'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  color: courseInfo.price === 0
                    ? 'var(--success-color)'
                    : (language === 'japanese' ? 'var(--jp-primary)' : 'var(--cn-primary)')
                }}>
                  {courseInfo.price === 0 ? (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 12 20 22 4 22 4 12"></polyline>
                      <rect x="2" y="7" width="20" height="5"></rect>
                      <line x1="12" y1="22" x2="12" y2="7"></line>
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                    </svg>
                  ) : (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  )}
                </div>

                <h2 style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary, #111827)'
                }}>
                  {courseInfo.price === 0 ? 'Đăng ký miễn phí' : (language === 'japanese' ? 'Tiếp tục học tập?' : 'Bắt đầu ngay?')}
                </h2>
                <p style={{
                  color: 'var(--text-secondary, #4b5563)',
                  marginBottom: '2rem',
                  fontSize: '1rem',
                  lineHeight: 1.5
                }}>
                  {courseInfo.price === 0
                    ? 'Khóa học này hoàn toàn miễn phí. Nhấn "Đăng ký" để bắt đầu học ngay!'
                    : 'Đăng ký khóa học để mở khóa toàn bộ nội dung bài học và bài tập đặc sắc.'}
                </p>

                {/* Course Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 16px',
                  borderRadius: '100px',
                  background: 'var(--bg-secondary, #f3f4f6)',
                  marginBottom: '2rem',
                  border: '1px solid var(--border-color, #e5e7eb)'
                }}>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: language === 'japanese' ? 'var(--jp-primary)' : 'var(--cn-primary)',
                    marginRight: '8px'
                  }}>
                    {courseInfo.level}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted, #6b7280)' }}>
                    • {courseInfo.title}
                  </span>
                </div>

                {/* Price Display */}
                {courseInfo.price === 0 ? (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '1.5rem',
                    borderRadius: '24px',
                    marginBottom: '2rem',
                    border: '1px solid var(--success-color)'
                  }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--success-color)', letterSpacing: '-0.02em' }}>
                      MIỄN PHÍ
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--success-color)', marginTop: '0.25rem', fontWeight: 600 }}>
                      Không cần thanh toán
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'var(--bg-secondary, #f9fafb)',
                    padding: '1.5rem',
                    borderRadius: '24px',
                    marginBottom: '2rem',
                    border: '1px solid var(--border-color, #f3f4f6)'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)', marginBottom: '0.25rem' }}>Số tiền thanh toán</div>
                    <div style={{
                      fontSize: '2.25rem',
                      fontWeight: 900,
                      color: 'var(--text-primary, #111827)',
                      letterSpacing: '-0.02em'
                    }}>
                      {formatCurrency(courseInfo.price || 0)}
                    </div>
                  </div>
                )}

                {/* Benefits List */}
                <div style={{
                  textAlign: 'left',
                  marginBottom: '2rem',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary, #4b5563)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span>Toàn bộ bài học</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span>{courseInfo.price === 0 ? 'Miễn phí vĩnh viễn' : 'Sử dụng trọn đời'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {courseInfo.price === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      onClick={handleConfirmPurchase}
                      disabled={isProcessingPayment}
                      style={{
                        padding: '1rem',
                        borderRadius: '18px',
                        border: 'none',
                        background: 'var(--success-color)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      {isProcessingPayment ? 'Đang đăng ký...' : 'Đăng ký miễn phí ngay'}
                    </button>
                    <button
                      onClick={() => setShowPurchaseModal(false)}
                      style={{
                        padding: '1rem',
                        borderRadius: '18px',
                        border: '1.5px solid var(--border-color, #e5e7eb)',
                        background: 'transparent',
                        color: 'var(--text-secondary, #4b5563)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Đóng
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                      onClick={() => setShowPurchaseModal(false)}
                      className="modal-btn-secondary"
                      style={{
                        padding: '1rem',
                        borderRadius: '18px',
                        border: '1.5px solid var(--border-color, #e5e7eb)',
                        background: 'transparent',
                        color: 'var(--text-secondary, #4b5563)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Xem thêm
                    </button>
                    <button
                      onClick={handleConfirmPurchase}
                      disabled={isProcessingPayment}
                      className="modal-btn-primary"
                      style={{
                        padding: '1rem',
                        borderRadius: '18px',
                        border: 'none',
                        background: language === 'japanese' ? 'var(--jp-primary)' : 'var(--cn-primary)',
                        color: '#ffffff',
                        fontWeight: 700,
                        cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: language === 'japanese'
                          ? '0 10px 15px -3px rgba(185, 28, 44, 0.3)'
                          : '0 10px 15px -3px rgba(185, 28, 28, 0.3)'
                      }}
                    >
                      {isProcessingPayment ? 'Đang chuyển...' : 'Thanh toán'}
                    </button>
                  </div>
                )}

                {/* Secure Payment Note */}
                <div style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted, #9ca3af)'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Thanh toán an toàn qua cổng PayOS
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LessonListNew;
