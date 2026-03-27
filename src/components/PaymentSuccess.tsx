import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const PaymentSuccess = () => {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [courseInfo, setCourseInfo] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkAccess();
    } else {
      setChecking(false);
    }
  }, [user]);

  const checkAccess = async () => {
    if (!user) return;

    // Capture userId to avoid closure issues in setTimeout
    const userId = user.id;
    const code = new URLSearchParams(window.location.search).get('orderCode');

    try {
      if (code) {
        const orderCodeNum = parseInt(code);

        // First check if payment was successful
        const { data: payment } = await supabase
          .from('payments')
          .select('course_id, status')
          .eq('order_code', orderCodeNum)
          .eq('user_id', userId)
          .single();

        if (payment?.status === 'paid') {
          setHasAccess(true);
          const { data: course } = await supabase
            .from('courses')
            .select('*')
            .eq('id', payment.course_id)
            .single();
          setCourseInfo(course);
          setChecking(false);
        } else if (payment?.status === 'pending') {
          // Payment still pending - retry after webhook processes it
          setTimeout(async () => {
            const { data: refreshed } = await supabase
              .from('payments')
              .select('course_id, status')
              .eq('order_code', orderCodeNum)
              .eq('user_id', userId)
              .single();
            if (refreshed?.status === 'paid') {
              setHasAccess(true);
            }
            setChecking(false);
          }, 3000);
          return;
        } else {
          // No payment found - fallback check
          await checkActiveAccess(userId);
        }
      } else {
        // No order code in URL - just check active access
        await checkActiveAccess(userId);
      }
    } catch (err) {
      console.error('Error checking payment:', err);
      await checkActiveAccess(userId);
    }
  };

  const checkActiveAccess = async (userId: string) => {
    try {
      const { data: access } = await supabase
        .from('user_courses')
        .select('course_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (access) {
        setHasAccess(true);
      }
    } catch (err) {
      console.error('Error checking active access:', err);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div style={{ fontSize: '4rem' }}>🎉</div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>
          Đang xác nhận thanh toán...
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'var(--card-bg)',
          borderRadius: '32px',
          padding: '3rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xl)',
          border: '2px solid var(--success-color)'
        }}
      >
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          fontSize: '3rem'
        }}>
          🎉
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '1rem'
        }}>
          Thanh toán thành công!
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.1rem',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          Cảm ơn bạn đã đăng ký khóa học. Bây giờ bạn có thể truy cập toàn bộ bài học và nội dung premium.
        </p>

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '1rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          border: '1px solid var(--success-color)'
        }}>
          <p style={{ color: 'var(--success-color)', fontWeight: 700, margin: 0 }}>
            ✓ Khóa học đã được kích hoạt
          </p>
          {courseInfo && (
            <p style={{ color: 'var(--success-color)', fontWeight: 600, margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
              {courseInfo.title}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            to="/"
            style={{
              display: 'block',
              padding: '1rem',
              borderRadius: '14px',
              background: 'var(--primary-color)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            Về trang chủ
          </Link>
          <Link
            to="/japanese/courses"
            style={{
              display: 'block',
              padding: '1rem',
              borderRadius: '14px',
              border: '1.5px solid var(--primary-color)',
              color: 'var(--primary-color)',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            🇯🇵 Học tiếng Nhật ngay
          </Link>
          <Link
            to="/chinese/courses"
            style={{
              display: 'block',
              padding: '1rem',
              borderRadius: '14px',
              border: '1.5px solid var(--cn-primary)',
              color: 'var(--cn-primary)',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            🇨🇳 Học tiếng Trung ngay
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
