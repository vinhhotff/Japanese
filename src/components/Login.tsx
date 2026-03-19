import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import FloatingElements from './FloatingElements';
import '../styles/login-premium.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.error) {
        setError(result.error.message || 'Đăng nhập thất bại');
        setLoading(false);
        return;
      }

      // Wait a bit for user state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const user = result.data?.user;
      if (!user) {
        setError('Không thể lấy thông tin user');
        setLoading(false);
        return;
      }

      // Check role from metadata or email pattern (consistent with AuthContext)
      const role = user.user_metadata?.role ||
        (user.email?.toLowerCase().includes('admin') ? 'admin' :
          (user.email?.toLowerCase().includes('teacher') ? 'teacher' : 'student'));

      logger.log('User signed in:', { email: user.email, role });

      // Redirect based on role or redirect URL
      const targetUrl = redirectUrl || (role === 'admin' ? '/' : role === 'teacher' ? '/teacher-dashboard' : '/');
      navigate(targetUrl);

    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-login-container">
      {/* Homepage-style Background Pattern */}
      <svg className="cultural-pattern" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="sakura-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="3" fill="#ffc0cb" opacity="0.15" />
            <circle cx="150" cy="100" r="2" fill="#ffb6c1" opacity="0.12" />
            <circle cx="100" cy="150" r="2.5" fill="#ffc0cb" opacity="0.1" />
            <path d="M 30 30 Q 35 25 40 30 T 50 30" stroke="#c41e3a" strokeWidth="0.5" fill="none" opacity="0.08" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sakura-pattern)" />
      </svg>

      {/* Floating Elements for extra "wow" and consistency */}
      <FloatingElements language="japanese" />

      <div className="login-visual-background">
        <div className="blur-blob blob-1"></div>
        <div className="blur-blob blob-2"></div>
      </div>

      <div className="premium-login-card">
        <div className="premium-header">
          <h1>Đăng nhập</h1>
          <p>Hệ thống học tập thông minh với AI</p>
        </div>

        <form onSubmit={handleSubmit} className="premium-form">
          {error && (
            <div className="premium-error">
              <svg style={{ width: '20px', height: '20px', display: 'inline', marginRight: '0.75rem', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <div className="input-field-wrapper">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                required
                disabled={loading}
                autoComplete="email"
              />
              <label htmlFor="email">Email address</label>
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="form-group">
            <div className="input-field-wrapper">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <label htmlFor="password">Password</label>
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
          </div>

          <button
            type="submit"
            className="modern-submit-btn"
            disabled={loading}
          >
            <span>
              {loading ? (
                <>
                  <svg className="login-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeLinecap="round" />
                  </svg>
                  Đang xác thực...
                </>
              ) : (
                <>
                  Đăng nhập
                  <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </form>

        <div className="login-card-footer">
          <p>Bạn mới biết đến chúng tôi? <a href="/register">Đăng ký tài khoản</a></p>
          <div className="social-login-separator">
            <span>Hoặc quay lại</span>
          </div>
          <a href="/" className="back-home-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;

