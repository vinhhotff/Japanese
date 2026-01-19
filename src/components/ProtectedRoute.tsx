import { ReactNode, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasJoinedAnyClass, joinClass } from '../services/classService';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireTeacher?: boolean;
  requireEnrollment?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireTeacher = false,
  requireEnrollment = false
}: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isTeacher } = useAuth();

  // Enrollment state
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [hasEnrollment, setHasEnrollment] = useState<boolean | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCode, setEnrollCode] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [justEnrolled, setJustEnrolled] = useState(false);

  // Check enrollment status when user is available
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!requireEnrollment || !user || isAdmin || isTeacher) {
        setHasEnrollment(true);
        return;
      }

      setCheckingEnrollment(true);
      try {
        const joined = await hasJoinedAnyClass(user.id);
        setHasEnrollment(joined);
        if (!joined) {
          setShowEnrollModal(true);
        }
      } catch (err) {
        console.error('Error checking enrollment:', err);
        setHasEnrollment(false);
        setShowEnrollModal(true);
      } finally {
        setCheckingEnrollment(false);
      }
    };

    if (user && requireEnrollment) {
      checkEnrollment();
    }
  }, [user, requireEnrollment, isAdmin, isTeacher]);

  const handleEnroll = async () => {
    if (!user || !enrollCode.trim()) return;

    setEnrolling(true);
    setEnrollError('');

    try {
      await joinClass(user.id, enrollCode.trim().toUpperCase());
      setHasEnrollment(true);
      setJustEnrolled(true);
      setShowEnrollModal(false);
      setEnrollCode('');
    } catch (err: any) {
      setEnrollError(err.message || 'Mã lớp không hợp lệ');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireTeacher && !isTeacher && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If we have no enrollment and we are not admin/teacher, we show the modal or loading
  if (!hasEnrollment && showEnrollModal && !justEnrolled) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          background: 'white',
          padding: '2.5rem',
          borderRadius: '20px',
          width: '90%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 'bold',
            marginBottom: '0.75rem',
            color: '#1e293b'
          }}>
            Nhập mã khóa học
          </h2>
          <p style={{
            color: '#64748b',
            marginBottom: '1.5rem',
            lineHeight: '1.6'
          }}>
            Để truy cập nội dung học, bạn cần nhập mã lớp học do giáo viên cung cấp.
            <br />
            <strong>Bạn chỉ cần nhập 1 lần duy nhất.</strong>
          </p>

          <input
            type="text"
            value={enrollCode}
            onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
            placeholder="VD: JP-N5-123456"
            disabled={enrolling}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              textAlign: 'center',
              letterSpacing: '2px',
              borderRadius: '12px',
              border: enrollError ? '2px solid #ef4444' : '2px solid #e2e8f0',
              outline: 'none',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              if (!enrollError) e.target.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              if (!enrollError) e.target.style.borderColor = '#e2e8f0';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEnroll();
            }}
          />

          {enrollError && (
            <p style={{
              color: '#ef4444',
              fontSize: '0.9rem',
              marginBottom: '1rem',
              fontWeight: '500'
            }}>
              ⚠️ {enrollError}
            </p>
          )}

          <button
            onClick={handleEnroll}
            disabled={enrolling || !enrollCode.trim()}
            style={{
              width: '100%',
              padding: '1rem',
              marginTop: '1rem',
              background: enrolling || !enrollCode.trim()
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: enrolling || !enrollCode.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: enrolling || !enrollCode.trim()
                ? 'none'
                : '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            {enrolling ? '⏳ Đang xử lý...' : '✨ Xác nhận mã'}
          </button>

          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '1rem'
          }}>
            <a
              href="/"
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#f1f5f9',
                color: '#64748b',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              ← Về trang chủ
            </a>
            <a
              href="/login"
              onClick={() => {
                localStorage.clear();
              }}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#fef2f2',
                color: '#ef4444',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              Đổi tài khoản
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
