import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getLessons } from '../services/supabaseService';
import DailyChallenge from './DailyChallenge';
import ProgressOverview from './ProgressOverview';
import '../App.css';

const Dashboard = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);

  useEffect(() => {
    loadCourses();
    // Check if first time user
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowWelcome(true);
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const [coursesData, lessonsData] = await Promise.all([
        getCourses(),
        getLessons(),
      ]);

      const coursesByLevel: Record<string, any[]> = {};
      const levelOrder = ['N5', 'N4', 'N3', 'N2', 'N1'];

      coursesData.forEach(course => {
        if (!coursesByLevel[course.level]) {
          coursesByLevel[course.level] = [];
        }
        coursesByLevel[course.level].push(course);
      });

      const groupedCourses = levelOrder
        .filter(level => coursesByLevel[level] && coursesByLevel[level].length > 0)
        .map(level => {
          const allLessons = lessonsData.filter(l => {
            const courseId = l.course_id || l.course?.id;
            return coursesByLevel[level].some(c => c.id === courseId);
          });

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
            lessons: allLessons,
            courseCount: coursesByLevel[level].length,
          };
        });

      setCourses(groupedCourses);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">⚠️ {error}</div>
        <button className="btn btn-primary" onClick={loadCourses}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Welcome Modal for First Time Users */}
      {showWelcome && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👋</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Chào mừng bạn!</h2>
            <p style={{ fontSize: '1.125rem', marginBottom: '2rem', lineHeight: '1.6' }}>
              Bắt đầu hành trình học tiếng Nhật của bạn ngay hôm nay!
              <br />Chúng tôi sẽ giúp bạn từ cơ bản đến nâng cao.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowWelcome(false)}
              style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}
            >
              Bắt đầu ngay! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        marginBottom: '3rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            {/* Left side - Main content */}
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '3rem' }}>🇯🇵</div>
                <div>
                  <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', color: 'white', fontWeight: '800', lineHeight: '1.2' }}>
                    Học Tiếng Nhật
                  </h1>
                  <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0 }}>
                    Từ N5 đến N1 - Học dễ dàng, hiệu quả với AI
                  </p>
                </div>
              </div>
              
              {/* Features pills */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '50px',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  1000+ từ vựng
                </div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '50px',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  AI trò chuyện
                </div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '50px',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Miễn phí 100%
                </div>
              </div>
            </div>

            {/* Right side - Admin button */}
            <Link to="/admin" style={{ textDecoration: 'none' }}>
              <button className="btn" style={{ 
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)',
                padding: '0.75rem 1.25rem',
                fontSize: '0.9375rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}>
                <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </button>
            </Link>
          </div>
        </div>
        
        {/* Decorative elements - smaller and more subtle */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', zIndex: 0 }} />
      </div>



      {/* Daily Challenge Modal */}
      {showDailyChallenge && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setShowDailyChallenge(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowDailyChallenge(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 1
                }}
              >
                <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <DailyChallenge />
            </div>
          </div>
        </div>
      )}

      {/* Floating Daily Challenge Button */}
      <button
        onClick={() => setShowDailyChallenge(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          border: 'none',
          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          zIndex: 100,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(245, 158, 11, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(245, 158, 11, 0.4)';
        }}
        title="Thử thách hàng ngày"
      >
        🎯
      </button>

      {/* Progress Overview */}
      <ProgressOverview />

      {/* Courses Section - MAIN FOCUS */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>
            📚 Khóa học tiếng Nhật
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
            Chọn cấp độ phù hợp và bắt đầu hành trình học tiếng Nhật của bạn
          </p>
        </div>
        {courses.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có khóa học nào. Vui lòng thêm khóa học trong trang Admin.</p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Đăng nhập Admin
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {courses.map((course, index) => (
              <Link key={course.level} to={`/courses/${course.level}`} style={{ textDecoration: 'none' }}>
                <div style={{ 
                  height: '100%',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  background: 'white',
                  border: '3px solid transparent',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = index === 0 ? '#10b981' :
                    index === 1 ? '#3b82f6' :
                    index === 2 ? '#f59e0b' :
                    index === 3 ? '#ef4444' : '#8b5cf6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}>
                  {/* Gradient Header */}
                  <div style={{
                    background: `linear-gradient(135deg, ${
                      index === 0 ? '#10b981, #059669' :
                      index === 1 ? '#3b82f6, #2563eb' :
                      index === 2 ? '#f59e0b, #d97706' :
                      index === 3 ? '#ef4444, #dc2626' :
                      '#8b5cf6, #7c3aed'
                    })`,
                    padding: '2rem',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                      {course.level}
                    </div>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.2)',
                      padding: '0.5rem 1rem',
                      borderRadius: '50px',
                      display: 'inline-block',
                      backdropFilter: 'blur(10px)',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      {course.lessons.length} bài học
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '2rem' }}>
                    <h3 style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '700', 
                      color: 'var(--text-primary)',
                      marginBottom: '1rem'
                    }}>
                      {course.title}
                    </h3>
                    <p style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '1rem', 
                      lineHeight: '1.6', 
                      marginBottom: '1.5rem',
                      minHeight: '3rem'
                    }}>
                      {course.description}
                    </p>
                    <button style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: `linear-gradient(135deg, ${
                        index === 0 ? '#10b981, #059669' :
                        index === 1 ? '#3b82f6, #2563eb' :
                        index === 2 ? '#f59e0b, #d97706' :
                        index === 3 ? '#ef4444, #dc2626' :
                        '#8b5cf6, #7c3aed'
                      })`,
                      color: 'white',
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}>
                      Bắt đầu học
                      <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ 
        height: '1px', 
        background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)',
        margin: '4rem 0'
      }} />

      {/* Featured Tools */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            ⭐ Công cụ học tập
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Sử dụng các công cụ này để học hiệu quả hơn
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <Link to="/ai-conversation" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ 
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
              border: '2px solid #3b82f6',
              height: '100%',
              position: 'relative'
            }}>
              <div className="notification-badge">MỚI</div>
              <svg style={{ width: '56px', height: '56px', margin: '0 0 1rem', color: '#3b82f6', strokeWidth: '1.5' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e40af' }}>
                Trò chuyện AI
              </h2>
              <p style={{ color: '#3b82f6', fontSize: '0.9375rem', marginBottom: '1rem' }}>
                Luyện giao tiếp với AI trong 6 tình huống thực tế
              </p>
              <button className="btn btn-primary" style={{ width: '100%' }}>
                Thử ngay →
              </button>
            </div>
          </Link>

          <Link to="/voice-recorder" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ 
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
              border: '2px solid #ef4444',
              height: '100%',
              position: 'relative'
            }}>
              <div className="notification-badge">MỚI</div>
              <svg style={{ width: '56px', height: '56px', margin: '0 0 1rem', color: '#ef4444', strokeWidth: '1.5' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#991b1b' }}>
                Luyện Phát Âm
              </h2>
              <p style={{ color: '#ef4444', fontSize: '0.9375rem', marginBottom: '1rem' }}>
                Ghi âm và nhận điểm phát âm tự động
              </p>
              <button className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                Thử ngay →
              </button>
            </div>
          </Link>

          <Link to="/dictionary" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ height: '100%' }}>
              <svg style={{ width: '56px', height: '56px', margin: '0 0 1rem', color: '#3b82f6', strokeWidth: '1.5' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Từ điển</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
                Tra từ vựng và kanji nhanh chóng
              </p>
              <button className="btn btn-primary" style={{ width: '100%' }}>
                Mở từ điển →
              </button>
            </div>
          </Link>
        </div>
      </div>

      {/* All Tools */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Công cụ khác
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          <Link to="/vocabulary-practice" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <svg style={{ width: '40px', height: '40px', color: '#10b981', strokeWidth: '1.5', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <div>
                  <h3 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>Luyện Từ Vựng</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Gõ hiragana</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/spaced-repetition" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <svg style={{ width: '40px', height: '40px', color: '#f59e0b', strokeWidth: '1.5', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <div>
                  <h3 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>Ôn Tập SRS</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Hệ thống khoa học</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/kanji-writing" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <svg style={{ width: '40px', height: '40px', color: '#8b5cf6', strokeWidth: '1.5', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <div>
                  <h3 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>Luyện Viết Kanji</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Viết và nhớ</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/study-progress" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <svg style={{ width: '40px', height: '40px', color: '#ec4899', strokeWidth: '1.5', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div>
                  <h3 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>Thống Kê</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Theo dõi tiến độ</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
