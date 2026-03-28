import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import FloatingElements from './FloatingElements';
import '../styles/login-premium.css';

const Register = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (password !== confirmPassword) {
            setError('Mật khẩu nhập lại không khớp');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'student',
                    },
                },
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: data.user.id,
                            email: email,
                            full_name: fullName,
                            updated_at: new Date(),
                        }
                    ])
                    .select();

                if (profileError && !profileError.message.includes('duplicate')) {
                    logger.error('Error creating profile', profileError);
                }

                if (data.session) {
                    logger.log('Registration successful, logging in...');
                    navigate('/');
                } else {
                    setMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.');
                }
            }

        } catch (err: any) {
            logger.error('Registration error', err);
            setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="premium-login-container">
            {/* Sakura pattern background */}
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

            {/* Floating decorative elements */}
            <FloatingElements language="japanese" />

            {/* Animated blur blobs */}
            <div className="login-visual-background">
                <div className="blur-blob blob-1"></div>
                <div className="blur-blob blob-2"></div>
            </div>

            {/* The card */}
            <div className="premium-login-card">
                <div className="premium-header">
                    <h1>Đăng ký tài khoản</h1>
                    <p>Tham gia cộng đồng học tiếng Nhật cùng AI</p>
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

                    {message && (
                        <div className="premium-error" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
                            <svg style={{ width: '20px', height: '20px', display: 'inline', marginRight: '0.75rem', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{message}</span>
                        </div>
                    )}

                    {/* Full name */}
                    <div className="form-group">
                        <div className="input-field-wrapper">
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder=" "
                                required
                                disabled={loading}
                                autoComplete="name"
                            />
                            <label htmlFor="fullName">Họ và tên</label>
                            <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                    </div>

                    {/* Email */}
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

                    {/* Password */}
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
                                autoComplete="new-password"
                            />
                            <label htmlFor="password">Mật khẩu</label>
                            <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                        </div>
                    </div>

                    {/* Confirm password */}
                    <div className="form-group">
                        <div className="input-field-wrapper">
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder=" "
                                required
                                disabled={loading}
                                autoComplete="new-password"
                            />
                            <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
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
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    Đăng ký
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
                    <p>Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></p>
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

export default Register;
