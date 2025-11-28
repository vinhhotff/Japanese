import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">日本語学習</h3>
            <p className="footer-description">
              Hệ thống học tiếng Nhật toàn diện từ N5 đến N1
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Khóa học</h4>
            <ul className="footer-links">
              <li><Link to="/courses/N5">JLPT N5</Link></li>
              <li><Link to="/courses/N4">JLPT N4</Link></li>
              <li><Link to="/courses/N3">JLPT N3</Link></li>
              <li><Link to="/courses/N2">JLPT N2</Link></li>
              <li><Link to="/courses/N1">JLPT N1</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Công cụ</h4>
            <ul className="footer-links">
              <li><Link to="/dictionary">Từ điển</Link></li>
              <li><Link to="/">Flashcard</Link></li>
              <li><Link to="/">Quiz</Link></li>
              <li><Link to="/">Game</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Hỗ trợ</h4>
            <ul className="footer-links">
              <li><a href="#">Hướng dẫn</a></li>
              <li><a href="#">Liên hệ</a></li>
              <li><a href="#">Điều khoản</a></li>
              <li><a href="#">Chính sách</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} 日本語学習. Tất cả quyền được bảo lưu.
          </p>
          <p className="footer-made">
            Made with{' '}
            <svg className="heart-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>{' '}
            for Japanese learners
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
