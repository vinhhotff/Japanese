import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import '../App.css';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    // We can use signIn here to auto-login, but typically signUp returns a session if auto confirm is on.
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
            // 1. Sign up with Supabase Auth
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'student', // Default role for now, prevents users from registering as admin directly
                    },
                },
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                // 2. Create profile entry (if not handled by triggers)
                // Check if we need to manually insert into profiles, but let's assume triggers might handle it
                // based on previous schema viewing, profiles table exists.
                // Let's manually insert just in case no trigger exists for 'profiles' or to be safe.
                // Usually good practice to have a trigger in SQL, but let's do safe check.

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

                // Warning: if RLS prevents insert or trigger already inserted, this might fail or duplicate.
                // Ideally we rely on triggers. If profileError occurs and says "duplicate", ignore.
                if (profileError && !profileError.message.includes('duplicate')) {
                    logger.error('Error creating profile', profileError);
                    // Don't block flow, user is created.
                }

                // 3. Auto Sign-in if session exists (Auto Confirm enabled)
                if (data.session) {
                    logger.log('Registration successful, logging in...');
                    // Explicitly call context sign in to update state if needed, 
                    // essentially the AuthContext listener will pick it up anyway.
                    navigate('/');
                } else {
                    // Email confirmation required
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
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <svg style={{ width: '64px', height: '64px', margin: '0 auto 1rem', color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <h1>Đăng ký tài khoản</h1>
                    <p>Tham gia cộng đồng học tiếng Nhật</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            <svg style={{ width: '20px', height: '20px', display: 'inline', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="success-message" style={{ background: '#d1fae5', color: '#065f46', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <svg style={{ width: '20px', height: '20px', display: 'inline', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {message}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="fullName">Họ và tên</label>
                        <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ít nhất 6 ký tự"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Xác nhận mật khẩu"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '1rem', background: '#10b981' }}
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng ký'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></p>
                    <Link to="/" className="back-link">
                        Về trang chủ
                    </Link>
                </div>

                {/* Support Section */}
                <div className="register-support">
                    <p className="support-title">Cần hỗ trợ đăng ký?</p>
                    <div className="support-contacts">
                        <a href="https://zalo.me/0909123456" target="_blank" rel="noopener noreferrer" className="support-item">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                            </svg>
                            Zalo: 0909123456
                        </a>
                        <a href="https://m.me/japaneselearning" target="_blank" rel="noopener noreferrer" className="support-item">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.99.587 3.853 1.592 5.445L2 22l4.555-1.592A9.954 9.954 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm3.771 13.447l-2.594-.798a1.016 1.016 0 00-.761.006l-.96.438a.994.994 0 01-.771 0l-.96-.438a1.016 1.016 0 00-.761-.006l-2.594.798C6.024 15.772 5 13.997 5 12c0-3.866 3.134-7 7-7s7 3.134 7 7c0 1.997-1.024 3.772-2.229 5.447zM10 10c-.553 0-1-.447-1-1s.447-1 1-1 1 .447 1 1-.447 1-1 1zm4 0c-.553 0-1-.447-1-1s.447-1 1-1 1 .447 1 1-.447 1-1 1z"/>
                            </svg>
                            Facebook Messenger
                        </a>
                        <a href="mailto:support@japanese-learning.com" className="support-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                            Email hỗ trợ
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
