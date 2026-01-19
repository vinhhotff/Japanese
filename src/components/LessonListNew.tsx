import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getStudentClasses } from '../services/classService';
import { getLessons } from '../services/supabaseService.v2';
import { getLessonCompletionPercentage, isLessonCompleted } from '../services/progressService';
import type { Language } from '../services/supabaseService.v2';
import FloatingCharacters from './FloatingCharacters';
import Pagination from './common/Pagination';
import '../styles/custom-theme.css';
import '../styles/premium-features.css';

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
  const itemsPerPage = 8;

  useEffect(() => {
    checkAccessAndLoad();
  }, [level, language, user]);

  const checkAccessAndLoad = async () => {
    if (!user) return;

    setCheckingAccess(true);

    // Admin and Teacher have full access
    if (isAdmin || isTeacher) {
      setHasAccess(true);
      await loadLessons();
      setCheckingAccess(false);
      return;
    }

    // Check student enrollment
    try {
      const enrollments = await getStudentClasses(user.id);
      const isEnrolled = enrollments.some((e: any) =>
        e.classes?.language === language &&
        (e.classes?.level || '').toUpperCase() === (level || '').toUpperCase()
      );

      setHasAccess(isEnrolled);
      // ALWAYS load lessons - they will be displayed with lock/FREE badges based on access
      await loadLessons();
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
      // Still load lessons even on error - show them with locks
      await loadLessons();
    } finally {
      setCheckingAccess(false);
      // Show trial notice if user has no access and is not an admin/teacher
      if (!isAdmin && !isTeacher) {
        setShowTrialNotice(true);
      }
    }
  };

  const loadLessons = async () => {
    try {
      setLoading(true);

      // 1. Fetch Course ID first (More reliable than querying lessons by level string)
      const { getCourseByLevel } = await import('../services/supabaseService');
      const targetLevel = (level || '').toUpperCase();
      const course = await getCourseByLevel(language, targetLevel); // Returns course object directly

      let lessonsData = [];

      if (course) {
        setCourseInfo(course);
        // 2. Fetch Lessons by Course ID
        const lessonsResult = await getLessons(course.id, undefined, undefined, 1, 1000);
        lessonsData = lessonsResult.data || [];
        console.log(`Loaded ${lessonsData.length} lessons for Course: ${course.title} (${course.id})`);
        console.log('Sample lesson data:', lessonsData[0]); // Check is_free here
      } else {
        // Fallback: Try loading by level if course not found (legacy behavior)
        const targetLevel = (level || '').toUpperCase();
        console.warn(`Course not found for ${targetLevel}, trying legacy fetch by level string`);
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
      setCurrentPage(1); // Reset page when level changes
    } catch (err) {
      console.error('Error loading lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentItems = lessons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (checkingAccess || loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          {checkingAccess ? 'Đang kiểm tra quyền truy cập...' : 'Đang tải bài học...'}
        </div>
      </div>
    );
  }

  const handleBuyCourse = () => {
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!courseInfo) return;

    try {
      setIsProcessingPayment(true);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('../config/supabase').then(m => m.supabase.auth.getSession())).data.session?.access_token}`
        },
        body: JSON.stringify({
          courseId: courseInfo.id,
          returnUrl: window.location.href,
          cancelUrl: window.location.href
        })
      });

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert('Lỗi tạo link thanh toán');
      }
    } catch (error) {
      console.error('Buy error:', error);
      alert('Đã xảy ra lỗi khi tạo đơn hàng');
    } finally {
      setIsProcessingPayment(false);
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

  if (loading) { // checkingAccess is less blocking now, we just want to load content
    // ... keep loading spinner
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Đang tải bài học...
        </div>
      </div>
    );
  }

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
                <span className="premium-badge" style={{ color: 'rgba(255,255,255,0.5)' }}>Tiếp cận giới hạn</span>
                <h3>Nâng cấp Premium</h3>
              </div>
            </div>

            <p className="premium-description">
              Bạn đang xem các bài học thử miễn phí. Hãy đăng ký ngay để mở khóa toàn bộ nội dung và bài tập!
            </p>

            <button
              onClick={handleBuyCourse}
              className="premium-action-btn"
              style={{ background: 'white', color: 'black', boxShadow: 'none' }}
            >
              Mở khóa toàn bộ
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lessons List */}
      <div style={{ display: 'grid', gap: '1.5rem', paddingBottom: '3rem' }}>
        {currentItems.map((lesson, index) => {
          const progress = getLessonCompletionPercentage(lesson.id);
          const completed = isLessonCompleted(lesson.id);
          const isLocked = !hasAccess && !lesson.is_free;

          const LessonCardContent = (
            <div
              className={`card locked-container ${isLocked ? 'is-premium-locked' : ''}`}
              style={{
                padding: '2rem',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                position: 'relative'
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
                  🈶 {lesson.kanjiCount} hán tự
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
            <div key={lesson.id} onClick={() => setShowTrialNotice(true)} style={{ opacity: 0.9 }}>
              {LessonCardContent}
            </div>
          ) : (
            <Link
              key={lesson.id}
              to={`/${language}/lessons/${lesson.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
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
          <div className="modal-overlay" style={{ zIndex: 10001 }} onClick={() => setShowPurchaseModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal-content"
              style={{
                maxWidth: '450px',
                padding: '2.5rem',
                borderRadius: '32px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>💳</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', color: '#111827' }}>
                Xác nhận đăng ký
              </h2>
              <p style={{ color: '#4B5563', marginBottom: '2rem', lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn mua khóa học <strong>{courseInfo.title}</strong> này không? Bạn sẽ được chuyển hướng đến trang thanh toán an toàn.
              </p>

              <div style={{
                background: '#F9FAFB',
                padding: '1.5rem',
                borderRadius: '20px',
                marginBottom: '2rem',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Tổng cộng</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>
                  {formatCurrency(courseInfo.price || 0)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  style={{
                    padding: '1rem',
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    background: 'white',
                    color: '#374151',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  disabled={isProcessingPayment}
                  style={{
                    padding: '1rem',
                    borderRadius: '16px',
                    border: 'none',
                    background: '#111827',
                    color: 'white',
                    fontWeight: 700,
                    cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isProcessingPayment ? 0.7 : 1
                  }}
                >
                  {isProcessingPayment ? 'Đang xử lý...' : 'Xác nhận ngay'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LessonListNew;
