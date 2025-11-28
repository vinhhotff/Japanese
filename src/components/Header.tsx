import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LanguageSwitcher from './LanguageSwitcher';
import './Header.css';

const Header = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPracticeMenu, setShowPracticeMenu] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const practiceMenuRef = useRef<HTMLDivElement>(null);
  const aiMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (practiceMenuRef.current && !practiceMenuRef.current.contains(event.target as Node)) {
        setShowPracticeMenu(false);
      }
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
        setShowAIMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const isActiveGroup = (paths: string[]) => paths.some(path => location.pathname.startsWith(path));

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="header-logo">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="logo-text">日本語学習</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="header-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Trang chủ</span>
          </Link>

          <Link to="/courses" className={`nav-link ${isActive('/courses') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            <span>Khóa học</span>
          </Link>

          <Link to="/dictionary" className={`nav-link ${isActive('/dictionary') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Từ điển</span>
          </Link>

          {/* Practice Dropdown */}
          <div className="nav-dropdown" ref={practiceMenuRef}>
            <button 
              className={`nav-link nav-dropdown-toggle ${showPracticeMenu || isActiveGroup(['/vocabulary-practice', '/spaced-repetition', '/kanji-writing']) ? 'active' : ''}`}
              onClick={() => {
                setShowPracticeMenu(!showPracticeMenu);
                setShowAIMenu(false);
                setShowMoreMenu(false);
              }}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Luyện tập</span>
              <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showPracticeMenu && (
              <div className="nav-dropdown-menu">
                <Link to="/vocabulary-practice" className="dropdown-item" onClick={() => setShowPracticeMenu(false)}>
                  <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Luyện từ vựng</span>
                </Link>
                <Link to="/spaced-repetition" className="dropdown-item" onClick={() => setShowPracticeMenu(false)}>
                  <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Ôn tập SRS</span>
                </Link>
                <Link to="/kanji-writing" className="dropdown-item" onClick={() => setShowPracticeMenu(false)}>
                  <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Luyện viết Kanji</span>
                </Link>
              </div>
            )}
          </div>

          {/* AI Tools Dropdown */}
          <div className="nav-dropdown" ref={aiMenuRef}>
            <button 
              className={`nav-link nav-dropdown-toggle ${showAIMenu || isActiveGroup(['/ai-conversation', '/ai-roleplay', '/voice-recorder']) ? 'active' : ''}`}
              onClick={() => {
                setShowAIMenu(!showAIMenu);
                setShowPracticeMenu(false);
                setShowMoreMenu(false);
              }}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>AI Tools</span>
              <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAIMenu && (
              <div className="nav-dropdown-menu">
                <Link to="/ai-conversation" className="dropdown-item" onClick={() => setShowAIMenu(false)}>
                  <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Hội thoại AI</span>
                </Link>
                <Link to="/ai-roleplay" className="dropdown-item" onClick={() => setShowAIMenu(false)}>
                  <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Nhập vai AI</span>
                </Link>
                <Link to="/voice-recorder" className="dropdown-item" onClick={() => setShowAIMenu(false)}>
                  <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>Ghi âm luyện nói</span>
                </Link>
              </div>
            )}
          </div>

          {/* More Dropdown */}
          <div className="nav-dropdown" ref={moreMenuRef}>
            <button 
              className={`nav-link nav-dropdown-toggle ${showMoreMenu || isActiveGroup(['/saved-words', '/study-progress']) ? 'active' : ''}`}
              onClick={() => {
                setShowMoreMenu(!showMoreMenu);
                setShowPracticeMenu(false);
                setShowAIMenu(false);
              }}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Thêm</span>
              <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showMoreMenu && (
              <div className="nav-dropdown-menu">
                <Link to="/saved-words" className="dropdown-item" onClick={() => setShowMoreMenu(false)}>
                  <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>Từ đã lưu</span>
                </Link>
                <Link to="/study-progress" className="dropdown-item" onClick={() => setShowMoreMenu(false)}>
                  <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Tiến độ học tập</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme Toggle */}
          <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}>
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* User Menu */}
          {user && (
            <div className="user-menu" ref={userMenuRef}>
              <button 
                className="user-menu-toggle"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <div className="user-info">
                    <div className="user-email">{user.email}</div>
                  </div>
                  <Link to="/admin" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Admin Panel</span>
                  </Link>
                  <button className="user-menu-item danger" onClick={handleSignOut}>
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {showMobileMenu ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu">
          <div className="mobile-menu-section">
            <Link to="/" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Trang chủ</span>
            </Link>
            <Link to="/courses" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              <span>Khóa học</span>
            </Link>
            <Link to="/dictionary" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Từ điển</span>
            </Link>
          </div>

          <div className="mobile-menu-section">
            <div className="mobile-menu-label">Luyện tập</div>
            <Link to="/vocabulary-practice" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Luyện từ vựng</span>
            </Link>
            <Link to="/spaced-repetition" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Ôn tập SRS</span>
            </Link>
            <Link to="/kanji-writing" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Luyện viết Kanji</span>
            </Link>
          </div>

          <div className="mobile-menu-section">
            <div className="mobile-menu-label">AI Tools</div>
            <Link to="/ai-conversation" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Hội thoại AI</span>
            </Link>
            <Link to="/ai-roleplay" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Nhập vai AI</span>
            </Link>
            <Link to="/voice-recorder" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Ghi âm luyện nói</span>
            </Link>
          </div>

          <div className="mobile-menu-section">
            <div className="mobile-menu-label">Khác</div>
            <Link to="/saved-words" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>Từ đã lưu</span>
            </Link>
            <Link to="/study-progress" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Tiến độ học tập</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
