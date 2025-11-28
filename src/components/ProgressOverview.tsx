import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProgressStats, getStartedLessons } from '../services/progressService';
import { getLessonById } from '../services/supabaseService';
import '../App.css';

const ProgressOverview = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progressStats = getProgressStats();
      setStats(progressStats);

      // Load thông tin chi tiết của các bài học gần đây
      const started = getStartedLessons().slice(0, 3);
      const lessonsWithDetails = await Promise.all(
        started.map(async (progress) => {
          try {
            const lesson = await getLessonById(progress.lessonId);
            return {
              ...progress,
              title: lesson?.title || 'Bài học',
              level: lesson?.level || 'N5',
            };
          } catch {
            return {
              ...progress,
              title: 'Bài học',
              level: 'N5',
            };
          }
        })
      );
      setRecentLessons(lessonsWithDetails);
    } catch (err) {
      console.error('Error loading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return null;
  }

  if (stats.totalLessonsStarted === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          📊 Tiến độ học tập
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
          Theo dõi quá trình học của bạn
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '2px solid #3b82f6' }}>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: '#3b82f6', marginBottom: '0.5rem' }}>
            {stats.totalLessonsStarted}
          </div>
          <div style={{ color: '#1e40af', fontWeight: '600', fontSize: '1rem' }}>
            Bài đã bắt đầu
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '2px solid #10b981' }}>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: '#10b981', marginBottom: '0.5rem' }}>
            {stats.totalLessonsCompleted}
          </div>
          <div style={{ color: '#065f46', fontWeight: '600', fontSize: '1rem' }}>
            Bài đã hoàn thành
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #f59e0b' }}>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: '#f59e0b', marginBottom: '0.5rem' }}>
            {stats.overallProgress}%
          </div>
          <div style={{ color: '#92400e', fontWeight: '600', fontSize: '1rem' }}>
            Tiến độ tổng
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '2px solid #ef4444' }}>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: '#ef4444', marginBottom: '0.5rem' }}>
            {stats.totalStepsCompleted}
          </div>
          <div style={{ color: '#991b1b', fontWeight: '600', fontSize: '1rem' }}>
            Hoạt động hoàn thành
          </div>
        </div>
      </div>

      {/* Recent Lessons */}
      {recentLessons.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            🕐 Học gần đây
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {recentLessons.map((lesson) => {
              const progress = Math.round((lesson.completedSteps.length / lesson.totalSteps) * 100);
              const completed = lesson.completedAt !== undefined;

              return (
                <Link key={lesson.lessonId} to={`/lessons/${lesson.lessonId}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ 
                    padding: '1.5rem',
                    background: completed ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'white',
                    border: completed ? '2px solid #10b981' : '1px solid #e5e7eb',
                    position: 'relative'
                  }}>
                    {completed && (
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1rem'
                      }}>
                        ✓
                      </div>
                    )}
                    
                    <div style={{ 
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      background: '#eff6ff',
                      color: '#3b82f6',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginBottom: '0.75rem'
                    }}>
                      {lesson.level}
                    </div>

                    <h4 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: '700', 
                      marginBottom: '0.75rem',
                      color: 'var(--text-primary)',
                      paddingRight: completed ? '2.5rem' : '0'
                    }}>
                      {lesson.title}
                    </h4>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {completed ? 'Hoàn thành' : 'Đang học'}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: '700', color: completed ? '#10b981' : '#3b82f6' }}>
                          {progress}%
                        </span>
                      </div>
                      <div style={{ 
                        height: '6px', 
                        background: '#e5e7eb', 
                        borderRadius: '999px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          height: '100%',
                          width: `${progress}%`,
                          background: completed 
                            ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Học lần cuối: {new Date(lesson.lastStudied).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressOverview;
