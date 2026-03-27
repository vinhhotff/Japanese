import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PaymentCancel = () => {
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
          border: '2px solid var(--danger-color)'
        }}
      >
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          fontSize: '3rem'
        }}>
          🙁
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '1rem'
        }}>
          Thanh toán bị hủy
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.1rem',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          Thanh toán của bạn đã bị hủy. Bạn vẫn có thể truy cập các bài học miễn phí hoặc thử lại thanh toán bất kỳ lúc nào.
        </p>

        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          padding: '1rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          border: '1px solid var(--danger-color)'
        }}>
          <p style={{ color: 'var(--danger-color)', fontWeight: 700, margin: 0 }}>
            Không có khoản phí nào được thu
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            to="/japanese/courses"
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
            🇯🇵 Học tiếng Nhật miễn phí
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
            🇨🇳 Học tiếng Trung miễn phí
          </Link>
          <Link
            to="/"
            style={{
              display: 'block',
              padding: '1rem',
              borderRadius: '14px',
              border: '1.5px solid var(--border-color)',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            Về trang chủ
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCancel;
