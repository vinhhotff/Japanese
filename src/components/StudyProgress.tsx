import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getProgressStats, 
  getStartedLessons, 
  getCompletedLessons,
  resetLessonProgress,
  resetAllProgress 
} from '../services/progressService';
import { getLessonById } from '../services/supabaseService';
import '../App.css';

const StudyProgress = () => {
  const [stats, setStats] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'inProgress'>('all');
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const progressStats = getProgressStats();
      setStats(progressStats);

      const started = getStartedLessons();
      const lessonsWithDetails = await Promise.all(
        started.map(async (progress) => {
          try {
            const lesson = await getLessonById(progress.lessonId);
            return {
              ...progress,
              title: lesson?.title || 'Bài học',
              level: lesson?.level || 'N5',
              description: lesson?.description || '',
            };
          } catch {
            return {
              ...progress,
              title: 'Bài học',
              level: 'N5',
              description: '',
            };
          }
        })
      );
      setAllLessons(lessonsWithDetails);
    } catch (err) {
      console.error('Error loading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetLesson = (lessonId: string) => {
    if (confirm('Bạn có chắc muốn xóa tiến độ bài học này?')) {
      resetLessonProgress(lessonId);
      loadProgress();
    }
  };

  const handleResetAll = () => {
    resetAllProgress();
    setShowResetConfirm(false);
    loadProgress();
  };

  const filteredLessons = allLessons.filter((lesson) => {
    if (filter === 'completed') return lesson.completedAt;
    if (filter === 'inProgress') return !lesson.completedAt;
    return true;
  });

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/" className="back-button">
        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Về trang chủ
      </Link>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>
          📊 Thống kê tiến độ học tập
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          Theo dõi chi tiết quá trình học của bạn
        </p>
      </div>

      {stats && stats.totalLessonsStarted > 0 ? (
        <>
          {/* Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <div className="card" style={{ textAlign: 'center', background: 'var(--primary-light)', border: '2px solid var(--primary-color)' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: '800', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                {stats.totalLessonsStarted}
              </div>
              <div style={{ color: 'var(--primary-color)', fontWeight: '600', fontSize: '1.125rem' }}>
                Bài đã bắt đầu
              </div>
            </div>

            <div className="card" style={{ textAlign: 'center', background: 'var(--success-light)', border: '2px solid var(--success-color)' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: '800', color: 'var(--success-color)', marginBottom: '0.5rem' }}>
                {stats.totalLessonsCompleted}
              </div>
              <div style={{ color: 'var(--success-color)', fontWeight: '600', fontSize: '1.125rem' }}>
                Bài đã hoàn thành
              </div>
            </div>

            <div className="card" style={{ textAlign: 'center', background: 'var(--warning-light)', border: '2px solid var(--warning-color)' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: '800', color: 'var(--warning-color)', marginBottom: '0.5rem' }}>
                {stats.overallProgress}%
              </div>
              <div style={{ color: 'var(--warning-color)', fontWeight: '600', fontSize: '1.125rem' }}>
                Tiến độ tổng
              </div>
            </div>

            <div className="card" style={{ textAlign: 'center', background: 'var(--danger-light)', border: '2px solid var(--danger-color)' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: '800', color: 'var(--danger-color)', marginBottom: '0.5rem' }}>
                {stats.totalStepsCompleted}
              </div>
              <div style={{ color: 'var(--danger-color)', fontWeight: '600', fontSize: '1.125rem' }}>
                Hoạt động hoàn thành
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'btn btn-primary' : 'btn btn-outline'}
            >
              Tất cả ({allLessons.length})
            </button>
            <button
              onClick={() => setFilter('inProgress')}
              className={filter === 'inProgress' ? 'btn btn-primary' : 'btn btn-outline'}
            >
              Đang học ({allLessons.filter(l => !l.completedAt).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={filter === 'completed' ? 'btn btn-primary' : 'btn btn-outline'}
            >
              Đã hoàn thành ({allLessons.filter(l => l.completedAt).length})
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="btn btn-danger"
              style={{ marginLeft: 'auto' }}
            >
              🗑️ Xóa tất cả tiến độ
            </button>
          </div>

          {/* Lessons List */}
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {filteredLessons.map((lesson) => {
              const progress = Math.round((lesson.completedSteps.length / lesson.totalSteps) * 100);
              const completed = lesson.completedAt !== undefined;

              return (
                <div key={lesson.lessonId} className="card" style={{ 
                  background: completed ? 'var(--success-light)' : 'var(--card-bg)',
                  border: completed ? '2px solid var(--success-color)' : '1px solid var(--border-color)',
                  position: 'relative'
                }}>
                  {completed && (
                    <div style={{
                      position: 'absolute',
                      top: '1.5rem',
                      right: '1.5rem',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--success-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                    }}>
                      ✓
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{ 
                        display: 'inline-block',
                        padding: '0.375rem 0.875rem',
                        background: 'var(--primary-light)',
                        color: 'var(--primary-color)',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginBottom: '1rem'
                      }}>
                        {lesson.level}
                      </div>

                      <h3 style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '700', 
                        marginBottom: '0.75rem',
                        color: 'var(--text-primary)',
                        paddingRight: completed ? '4rem' : '0'
                      }}>
                        {lesson.title}
                      </h3>

                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '1rem', 
                        lineHeight: '1.6',
                        marginBottom: '1rem'
                      }}>
                        {lesson.description}
                      </p>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        <span>
                          📅 Học lần cuối: {new Date(lesson.lastStudied).toLocaleDateString('vi-VN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                        {completed && lesson.completedAt && (
                          <span>
                            ✅ Hoàn thành: {new Date(lesson.completedAt).toLocaleDateString('vi-VN', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        )}
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '0.75rem'
                        }}>
                          <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            Tiến độ: {lesson.completedSteps.length}/{lesson.totalSteps} hoạt động
                          </span>
                          <span style={{ fontSize: '1.25rem', fontWeight: '700', color: completed ? 'var(--success-color)' : 'var(--primary-color)' }}>
                            {progress}%
                          </span>
                        </div>
                        <div style={{ 
                          height: '10px', 
                          background: 'var(--progress-bg)', 
                          borderRadius: '999px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            height: '100%',
                            width: `${progress}%`,
                            background: completed 
                              ? 'var(--success-gradient)'
                              : 'var(--primary-gradient)',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <Link to={`/lessons/${lesson.lessonId}`} style={{ textDecoration: 'none' }}>
                          <button className="btn btn-primary">
                            {completed ? '🔄 Ôn tập lại' : '📖 Tiếp tục học'}
                          </button>
                        </Link>
                        <button 
                          className="btn btn-outline"
                          onClick={() => handleResetLesson(lesson.lessonId)}
                          style={{ borderColor: '#ef4444', color: '#ef4444' }}
                        >
                          🗑️ Xóa tiến độ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLessons.length === 0 && (
            <div className="empty-state">
              <p>Không có bài học nào trong danh mục này.</p>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Chưa có tiến độ học tập</h2>
          <p style={{ marginBottom: '2rem' }}>Bắt đầu học một bài học để theo dõi tiến độ của bạn!</p>
          <Link to="/" className="btn btn-primary">
            Khám phá khóa học
          </Link>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
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
        }} onClick={() => setShowResetConfirm(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Xác nhận xóa tất cả tiến độ</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
              Hành động này sẽ xóa toàn bộ tiến độ học tập của bạn và không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn btn-outline"
                onClick={() => setShowResetConfirm(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleResetAll}
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyProgress;
