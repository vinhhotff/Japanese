import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../config/supabase';
import { getCourses, getLessons, PaginatedResponse } from '../services/supabaseService.v2';
import { getProgressStats, getUserProgress } from '../services/progressService';
import { useAuth } from '../contexts/AuthContext';
import { getStudentClasses, joinClass, createClass, getAllClasses } from '../services/classService';
import DragonAnimation from './DragonAnimation';
import FloatingCharactersPhysics from './FloatingCharactersPhysics';
import '../styles/dashboard-v2.css';

type Language = 'japanese' | 'chinese';

interface LevelInfo {
  level: string;
  name: string;
  description: string;
  icon: string;
}

const groupCoursesByLevel = (courses: any[], levels: string[]) => {
  const grouped: Record<string, any[]> = {};
  levels.forEach(level => {
    grouped[level] = courses.filter(c => c.level === level);
  });
  return levels.map(level => ({
    level,
    courses: grouped[level] || [],
    count: grouped[level]?.length || 0,
  }));
};

const DashboardNew = () => {
  const { t } = useTranslation();
  const { user, session, loading: authLoading, isTeacher, isStudent, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [selectedLanguage, setSelectedLanguage] = useState<Language>('japanese');
  const [japaneseCourses, setJapaneseCourses] = useState<any[]>([]);
  const [chineseCourses, setChineseCourses] = useState<any[]>([]);
  const [progressByLevel, setProgressByLevel] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Enrollment State
  const [enrolledLevels, setEnrolledLevels] = useState<Set<string>>(new Set());
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCode, setEnrollCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [myClasses, setMyClasses] = useState<any[]>([]);

  // Teacher State
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassLevel, setNewClassLevel] = useState('N5');
  const [newClassName, setNewClassName] = useState('');
  const [createdCode, setCreatedCode] = useState('');

  // Practice Modal State
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [practiceType, setPracticeType] = useState<'vocabulary' | 'writing'>('vocabulary');

  const [error, setError] = useState<string | null>(null);

  // Ref to prevent double-firing
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const loadData = async () => {
    // Prevent duplicate calls
    if (isLoadingRef.current) return;

    // Don't load if we're on login/register page
    if (window.location.pathname === '/login' || window.location.pathname === '/register') {
      setLoading(false);
      return;
    }

    isLoadingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // 1. Load critical data (Courses) first
      let japaneseData: PaginatedResponse<any> = { data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 };
      let chineseData: PaginatedResponse<any> = { data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 };

      try {
        const [jpResult, cnResult] = await Promise.allSettled([
          getCourses('japanese', 1, 100),
          getCourses('chinese', 1, 100)
        ]);

        if (jpResult.status === 'fulfilled') {
          japaneseData = jpResult.value;
        }

        if (cnResult.status === 'fulfilled') {
          chineseData = cnResult.value;
        }
      } catch (e: any) {
        setError(`Lỗi không mong muốn: ${e.message || JSON.stringify(e)}`);
      }

      // Group by level and update state immediately
      const groupJapanese = groupCoursesByLevel(japaneseData.data, ['N5', 'N4', 'N3', 'N2', 'N1']);
      const groupChinese = groupCoursesByLevel(chineseData.data, ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']);

      setJapaneseCourses(groupJapanese);
      setChineseCourses(groupChinese);

      // Stop loading spinner so user can interact
      setLoading(false);

      // 2. Load Enrollments / Teacher Assignments (Non-blocking)
      if (user) {
        if (isAdmin) {
          getAllClasses().then((classes) => {
            setMyClasses(classes);
          }).catch(e => console.error("Error loading all classes", e));
        } else if (isTeacher) {
          // TEACHER LOGIC: Load assigned courses from teacher_assignments
          supabase
            .from('teacher_assignments')
            .select('language, level')
            .eq('teacher_email', user.email)
            .then(({ data: assignments }: { data: any[] | null }) => {
              if (assignments) {
                const assignedLevels = new Set<string>(assignments.map(a => a.level));
                setEnrolledLevels(assignedLevels);
              }
            });

          // Also load classes created by teacher
          supabase
            .from('classes')
            .select('*')
            .eq('teacher_id', user.id)
            .then(({ data: classes }: { data: any[] | null }) => {
              if (classes) setMyClasses(classes);
            });
        } else {
          // STUDENT LOGIC
          getStudentClasses(user.id).then((enrollments) => {
            const authorizedLevels = new Set<string>();
            enrollments.forEach((e: any) => {
              if (e.classes?.language === selectedLanguage && e.classes?.level) {
                authorizedLevels.add(e.classes.level);
              }
            });
            setEnrolledLevels(authorizedLevels);
            setMyClasses(enrollments.map((e: any) => e.classes).filter(Boolean));
          }).catch(e => console.error("Error loading enrollments", e));
        }
      }

      // 3. Progress calculation DISABLED for performance
      // This was fetching 1000+ lessons and is very slow
      // Progress display is already removed from UI, so this is not needed
      /*
      (async () => {
        try {
          const fetchLessonsSafe = async (lang: string) => {
            try {
              // Fetch max 1000 lessons - potential optimization needed on backend later
              return await getLessons(undefined, lang as any, undefined, 1, 1000);
            } catch (e) {
              console.error(`Error fetching ${lang} lessons:`, e);
              return { data: [], total: 0, page: 1, pageSize: 1000, totalPages: 0 } as PaginatedResponse<any>;
            }
          };

          const [jpLessons, cnLessons] = await Promise.all([
            fetchLessonsSafe('japanese'),
            fetchLessonsSafe('chinese')
          ]);

          const allLessons = [...(jpLessons.data || []), ...(cnLessons.data || [])];

          // Calculate stats
          const totalByLevel: Record<string, number> = {};
          const lessonLevelMap: Record<string, string> = {};

          allLessons.forEach((l: any) => {
            if (l.level) {
              if (!totalByLevel[l.level]) totalByLevel[l.level] = 0;
              totalByLevel[l.level]++;
              lessonLevelMap[l.id] = l.level;
            }
          });

          const userProgress = getUserProgress();
          const completedByLevel: Record<string, number> = {};

          if (userProgress && userProgress.lessons) {
            Object.values(userProgress.lessons).forEach((p: any) => {
              if (p.completedAt) {
                const level = lessonLevelMap[p.lessonId];
                if (level) {
                  if (!completedByLevel[level]) completedByLevel[level] = 0;
                  completedByLevel[level]++;
                }
              }
            });
          }

          const newProgress: Record<string, number> = {};
          const allLevels = [
            'N5', 'N4', 'N3', 'N2', 'N1',
            'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'
          ];

          allLevels.forEach(level => {
            const total = totalByLevel[level] || 0;
            const completed = completedByLevel[level] || 0;
            newProgress[level] = total > 0 ? Math.round((completed / total) * 100) : 0;
          });

          setProgressByLevel(newProgress);
        } catch (err) {
          console.warn('Background progress calculation failed', err);
        }
      })();
      */
      console.log('✅ Skipping progress calculation for performance');

    } catch (err: any) {
      console.error('❌ Error loading data:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      // Only set error if we haven't stopped loading yet
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu.');
      setLoading(false);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const handleJoinClass = async () => {
    if (!user) return;
    try {
      setJoinError('');
      // Arg signature: userId, classCode
      await joinClass(user.id, enrollCode);
      alert('Tham gia lớp học thành công!');
      setShowEnrollModal(false);
      setEnrollCode('');
      loadData(); // Refresh to update access
    } catch (err: any) {
      setJoinError(err.message || 'Lỗi khi tham gia lớp');
    }
  };

  const handleCreateClass = async () => {
    if (!user) return;
    try {
      const result = await createClass({
        name: newClassName,
        level: newClassLevel,
        language: selectedLanguage,
        teacher_id: user.id
      });
      setCreatedCode(result.code);
      alert(`Tạo lớp thành công! Mã lớp: ${result.code}`);
    } catch (err) {
      alert('Lỗi tạo lớp');
    }
  };

  const handlePracticeClick = (e: React.MouseEvent, type: 'vocabulary' | 'writing') => {
    e.preventDefault();
    setPracticeType(type);
    setShowPracticeModal(true);
  };


  const handleAuthRequired = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (!user) {
      if (window.confirm('Vui lòng đăng nhập để sử dụng tính năng này!')) {
        navigate('/login');
      }
    } else {
      navigate(path);
    }
  };

  if (error) {
    return (
      <div className="dashboard-v2-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: '500px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>Không thể tải dữ liệu</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.9rem', color: '#475569' }}>
            <strong>Gợi ý khắc phục:</strong>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Kiểm tra kết nối mạng của bạn.</li>
              <li>Đảm bảo Supabase URL và Key trong file <code>.env</code> là chính xác.</li>
              <li>Nếu bạn mới cài đặt database, hãy chạy nội dung file <code>supabase_content_tables.sql</code> trong Supabase SQL Editor để tạo các bảng dữ liệu.</li>
            </ul>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
              <p>Debug Info:</p>
              <p>Status: {error}</p>
              <p>URL Config: {((import.meta as any).env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ MISSING')}</p>
            </div>
          </div>

          <button
            onClick={() => loadData()}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '0.8rem 2rem',
              borderRadius: '9999px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
            }}
          >
            Thử lại
          </button>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            style={{
              background: '#ef4444',
              color: 'white',
              padding: '0.8rem 2rem',
              borderRadius: '9999px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              marginLeft: '1rem',
              boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.5)'
            }}
          >
            Đăng xuất & Reset
          </button>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="dashboard-v2-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-v2-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu khóa học...</p>
        </div>
      </div>
    );
  }

  const currentCourses = selectedLanguage === 'japanese' ? japaneseCourses : chineseCourses;

  console.log('Rendering with:', {
    selectedLanguage,
    japaneseCoursesLength: japaneseCourses.length,
    chineseCoursesLength: chineseCourses.length,
    currentCoursesLength: currentCourses.length,
    loading
  });

  const levelInfo: Record<string, LevelInfo> = {
    'N5': { level: 'N5', name: 'Sơ cấp', description: 'Nền tảng cơ bản', icon: '🌸' },
    'N4': { level: 'N4', name: 'Tiền trung cấp', description: 'Giao tiếp hàng ngày', icon: '🎋' },
    'N3': { level: 'N3', name: 'Trung cấp', description: 'Văn bản thông thường', icon: '🏯' },
    'N2': { level: 'N2', name: 'Trung cao cấp', description: 'Báo chí & công việc', icon: '⛩️' },
    'N1': { level: 'N1', name: 'Cao cấp', description: 'Chuyên môn & học thuật', icon: '🗾' },
    'HSK1': { level: 'HSK1', name: 'Sơ cấp', description: 'Tiếng Trung cơ bản', icon: '🏮' },
    'HSK2': { level: 'HSK2', name: 'Sơ-Trung cấp', description: 'Giao tiếp hàng ngày', icon: '🎐' },
    'HSK3': { level: 'HSK3', name: 'Trung cấp', description: 'Ứng dụng thực tế', icon: '🐉' },
    'HSK4': { level: 'HSK4', name: 'Trung-Cao cấp', description: 'Chủ đề đa dạng', icon: '🏛️' },
    'HSK5': { level: 'HSK5', name: 'Cao cấp', description: 'Đọc báo & sách', icon: '📜' },
    'HSK6': { level: 'HSK6', name: 'Thành thạo', description: 'Diễn đạt chuyên nghiệp', icon: '🎎' },
  };

  const levelColors: Record<string, string> = {
    'N5': '#10b981', 'N4': '#3b82f6', 'N3': '#f59e0b', 'N2': '#ef4444', 'N1': '#8b5cf6',
    'HSK1': '#10b981', 'HSK2': '#3b82f6', 'HSK3': '#f59e0b', 'HSK4': '#ef4444', 'HSK5': '#8b5cf6', 'HSK6': '#ec4899',
  };

  return (
    <div
      className="dashboard-v2-container"
      data-language={selectedLanguage}
    >
      {/* Cultural SVG Background Pattern */}
      <svg className="cultural-pattern" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          {selectedLanguage === 'japanese' ? (
            <>
              <pattern id="sakura-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="3" fill="#ffc0cb" opacity="0.15" />
                <circle cx="150" cy="100" r="2" fill="#ffb6c1" opacity="0.12" />
                <circle cx="100" cy="150" r="2.5" fill="#ffc0cb" opacity="0.1" />
                <path d="M 30 30 Q 35 25 40 30 T 50 30" stroke="#c41e3a" strokeWidth="0.5" fill="none" opacity="0.08" />
              </pattern>
              <radialGradient id="jp-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c41e3a" stopOpacity="0.05" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </>
          ) : (
            <>
              <pattern id="chinese-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="3" fill="#dc143c" opacity="0.12" />
                <circle cx="150" cy="100" r="2" fill="#ffd700" opacity="0.1" />
                <rect x="80" y="80" width="40" height="40" fill="none" stroke="#dc143c" strokeWidth="0.5" opacity="0.08" />
              </pattern>
              <radialGradient id="cn-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#dc143c" stopOpacity="0.05" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </>
          )}
        </defs>
        <rect width="100%" height="100%" fill={`url(#${selectedLanguage === 'japanese' ? 'sakura' : 'chinese'}-pattern)`} />
        <rect width="100%" height="100%" fill={`url(#${selectedLanguage === 'japanese' ? 'jp' : 'cn'}-glow)`} />
      </svg>

      {/* Floating Characters Background */}
      <DragonAnimation />
      <FloatingCharactersPhysics language={selectedLanguage} />

      {/* Hero Header */}
      <div className="hero-header">
        <div className="hero-content">
          <div className="hero-badge">
            {selectedLanguage === 'japanese' ? '🌸 JLPT' : '🏮 HSK'}
          </div>
          <h1 className="hero-title">
            {selectedLanguage === 'japanese' ? (
              <>
                <span className="title-main">日本語を学ぼう</span>
                <span className="title-sub">
                  <span className="title-text">Học Tiếng Nhật </span>
                  <span className="title-highlight">Cùng AI</span>
                </span>
              </>
            ) : (
              <>
                <span className="title-main">学习中文</span>
                <span className="title-sub">
                  <span className="title-text">Học Tiếng Trung </span>
                  <span className="title-highlight">Cùng AI</span>
                </span>
              </>
            )}
          </h1>
          <p className="hero-description">
            {selectedLanguage === 'japanese'
              ? 'Khám phá vẻ đẹp của tiếng Nhật qua hệ thống học tập thông minh với AI'
              : '通过智能AI系统探索中文之美 - Khám phá vẻ đẹp tiếng Trung với AI thông minh'
            }
          </p>

          {/* Action Buttons based on Role */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>

            {/* Action Buttons Removed for Teachers as requested */}
          </div>
        </div>

        {/* Language Switcher */}
        <div className="language-switcher">
          <button
            className={`lang-switch-btn ${selectedLanguage === 'japanese' ? 'active' : ''}`}
            onClick={() => setSelectedLanguage('japanese')}
          >
            <div className="switch-flag">JP</div>
            <div className="switch-info">
              <span className="switch-name">日本語</span>
              <span className="switch-label">Tiếng Nhật</span>
              <span className="switch-count">{japaneseCourses.reduce((sum, g) => sum + g.count, 0)} khóa học</span>
            </div>
          </button>
          <button
            className={`lang-switch-btn ${selectedLanguage === 'chinese' ? 'active' : ''}`}
            onClick={() => setSelectedLanguage('chinese')}
          >
            <div className="switch-flag">CN</div>
            <div className="switch-info">
              <span className="switch-name">中文</span>
              <span className="switch-label">Tiếng Trung</span>
              <span className="switch-count">{chineseCourses.reduce((sum, g) => sum + g.count, 0)} khóa học</span>
            </div>
          </button>
        </div>
      </div>

      {/* My Classes Section */}
      {myClasses.length > 0 && (
        <section className="my-classes-section">
          <h2 className="my-classes-title">
            <span>{isAdmin ? '📋' : '📝'}</span>
            {isAdmin ? 'Tất cả lớp học (Admin)' : 'Lớp học của tôi'}
          </h2>
          {isAdmin && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '3rem', opacity: 0.8 }}>
              Quản lý và theo dõi tất cả các lớp học hiện có trên hệ thống
            </p>
          )}
          <div className="classes-container-grid">
            {myClasses.map((cls, idx) => (
              <div key={idx} className="dashboard-class-card">
                <div className="class-card-header">
                  <div className={`class-level-badge ${cls.language === 'japanese' ? 'jp-badge' : 'cn-badge'}`}>
                    <span>{cls.language === 'japanese' ? '🇯🇵' : '🇨🇳'}</span>
                    {cls.level}
                  </div>
                  <span className="class-code-tag">CODE: {cls.code}</span>
                </div>

                <h3 className="class-card-name">{cls.name}</h3>

                <button
                  className="class-enter-btn"
                  onClick={() => alert(`Sắp ra mắt: Xem bài tập cho lớp ${cls.name}`)}
                >
                  <span>Vào lớp học</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Courses Section */}
      <div className="courses-section">
        <div className="section-title">
          <h2>{selectedLanguage === 'japanese' ? 'レベル別コース' : '等级课程'}</h2>
          <p>{selectedLanguage === 'japanese' ? 'Chọn cấp độ phù hợp với bạn' : '选择适合你的级别'}</p>
        </div>

        <div className="levels-grid">

          {((isAdmin || !user || isTeacher) ? currentCourses : currentCourses.filter(g => enrolledLevels.has(g.level))).length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '3rem',
              background: 'var(--card-bg)',
              borderRadius: '20px',
              border: '2px dashed var(--border-color)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {(isAdmin || !user || isTeacher) ? 'Chưa có dữ liệu khóa học' : 'Chưa đăng ký khóa học nào'}
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {(isAdmin || !user || isTeacher)
                  ? `Hiện tại chưa có khóa học ${selectedLanguage === 'japanese' ? 'Tiếng Nhật' : 'Tiếng Trung'} nào.`
                  : 'Vui lòng nhập mã code từ giáo viên để mở khóa nội dung học tập.'
                }
              </p>
              {user && !isAdmin && (
                <button
                  onClick={() => setShowEnrollModal(true)}
                  style={{
                    marginTop: '1.5rem',
                    padding: '0.8rem 2rem',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '99px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  Nhập mã Code ngay
                </button>
              )}
            </div>
          ) : (
            ((isAdmin || !user || isTeacher) ? currentCourses : currentCourses.filter(g => enrolledLevels.has(g.level))).map((group, index) => {
              const info = levelInfo[group.level];
              // Homepage shows all courses - no enrollment needed
              const isEnrolled = true;

              return (
                <div
                  key={group.level}
                  className={`level-card ${selectedLanguage === 'japanese' ? 'jp-style' : 'cn-style'}`}
                  style={{
                    '--card-color': levelColors[group.level],
                    '--delay': `${index * 0.1}s`,
                    cursor: 'pointer'
                  } as React.CSSProperties}
                  onClick={() => {
                    // Check if guest
                    if (!user) {
                      if (window.confirm('Vui lòng đăng nhập để tham gia khóa học!')) {
                        navigate('/login');
                      }
                      return;
                    }
                    // Direct navigation - all courses accessible from homepage
                    navigate(`/${selectedLanguage}/courses/${group.level}`);
                  }}
                >
                  <div className="card-header">
                    <div className="card-flag">{selectedLanguage === 'japanese' ? '🇯🇵' : '🇨🇳'}</div>
                    <div className="level-badge" style={{ background: levelColors[group.level] }}>
                      <span className="badge-level">{group.level}</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <h3 className="level-name">{info?.name || group.level}</h3>
                    <p className="level-desc">{info?.description || 'Khóa học'}</p>

                    {/* Stats Removed as per Step Id 239 */}

                    {/* Stats Removed as per Step Id 239 */}

                    {/* 
                  <div className="level-progress">
                    <div className="progress-info">
                      <span className="progress-label">Tiến độ</span>
                      <span className="progress-percent">{progressByLevel[group.level] || 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progressByLevel[group.level] || 0}%`, background: levelColors[group.level] }}></div>
                    </div>
                  </div> 
                  */}
                  </div>

                  <div className="card-footer">
                    <span className="start-btn">
                      Bắt đầu học
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>🔑 Tham gia lớp học</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Nhập mã lớp do giáo viên cung cấp để mở khóa.</p>
            <input
              type="text"
              value={enrollCode}
              onChange={e => setEnrollCode(e.target.value)}
              placeholder="Nhập mã 6 ký tự"
              style={{ width: '100%', padding: '0.8rem', fontSize: '1.2rem', marginBottom: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase' }}
            />
            {joinError && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.9rem' }}>{joinError}</p>}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowEnrollModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: 'var(--text-secondary)' }}>Hủy</button>
              <button onClick={handleJoinClass} style={{ flex: 1, padding: '0.8rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Tham gia</button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Create Class Modal */}
      {showCreateClassModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>+ Tạo lớp học mới</h3>
            {createdCode ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Mã lớp của bạn là:</p>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-color)', margin: '1rem 0', letterSpacing: '4px' }}>{createdCode}</div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Hãy gửi mã này cho học sinh để họ có thể tham gia lớp học.</p>
                <button onClick={() => { setShowCreateClassModal(false); setCreatedCode(''); }} style={{ width: '100%', padding: '0.8rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Đóng</button>
              </div>
            ) : (
              <>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Tên lớp:</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="Ví dụ: Lớp N5 Sáng T2-T4"
                  style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                />
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Cấp độ:</label>
                <select
                  value={newClassLevel}
                  onChange={e => setNewClassLevel(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
                >
                  {selectedLanguage === 'japanese' ? (
                    ['N5', 'N4', 'N3', 'N2', 'N1'].map(l => <option key={l} value={l}>{l}</option>)
                  ) : (
                    ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map(l => <option key={l} value={l}>{l}</option>)
                  )}
                </select>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setShowCreateClassModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: 'var(--text-secondary)' }}>Hủy</button>
                  <button onClick={handleCreateClass} style={{ flex: 1, padding: '0.8rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Tạo lớp</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Practice Selection Modal */}
      {showPracticeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
              {practiceType === 'vocabulary' ? '🧠 Luyện từ vựng' : '✍️ Luyện viết chữ'}
            </h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Chọn cấp độ bạn muốn luyện tập:</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
              {(selectedLanguage === 'japanese'
                ? ['N5', 'N4', 'N3', 'N2', 'N1']
                : ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']
              ).map(level => (
                <button
                  key={level}
                  onClick={() => {
                    const baseUrl = practiceType === 'vocabulary'
                      ? `/${selectedLanguage}/vocabulary-practice/${level}`
                      : `/${selectedLanguage}/${selectedLanguage === 'japanese' ? 'kanji' : 'hanzi'}-writing?level=${level}`; // Writing might need params too, but logic similar

                    // Note: Just navigating for now. Writing practice might not support params yet, but Vocab does.
                    if (practiceType === 'vocabulary') {
                      navigate(baseUrl);
                    } else {
                      // For writing, just go to the page, maybe param later
                      navigate(`/${selectedLanguage}/${selectedLanguage === 'japanese' ? 'kanji' : 'hanzi'}-writing`);
                      alert('Tính năng chọn level cho Luyện viết đang được cập nhật. Chuyển đến trang luyện viết chung.');
                    }
                    setShowPracticeModal(false);
                  }}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '2px solid ' + (levelColors[level] || '#ccc'),
                    background: 'white',
                    color: levelColors[level] || '#333',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1.1rem'
                  }}
                >
                  {level}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPracticeModal(false)}
              style={{ width: '100%', padding: '0.8rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#64748b' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* AI Features Section */}
      <div className="ai-features-section">
        <div className="section-title">
          <h2>🤖 Tính năng AI độc quyền</h2>
          <p>Học thông minh hơn với công nghệ AI tiên tiến</p>
        </div>

        <div className="features-grid">
          <Link to={`/${selectedLanguage}/dictionary`} className="feature-card">
            <svg className="feature-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <h3 className="feature-title">Từ điển thông minh</h3>
            <p className="feature-desc">Tra cứu nhanh với AI phân tích ngữ cảnh</p>
          </Link>

          <Link
            to="#"
            className="feature-card"
            onClick={(e) => handlePracticeClick(e, 'vocabulary')}
          >
            <svg className="feature-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <h3 className="feature-title">Luyện từ vựng</h3>
            <p className="feature-desc">Hệ thống ôn tập thông minh SRS</p>
          </Link>

          <Link
            to="#"
            className="feature-card"
            onClick={(e) => handlePracticeClick(e, 'writing')}
          >
            <svg className="feature-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            <h3 className="feature-title">Luyện viết chữ</h3>
            <p className="feature-desc">Nhận diện nét viết bằng AI</p>
          </Link>

          <Link
            to="/ai-roleplay"
            className="feature-card feature-highlight"
            onClick={(e) => handleAuthRequired(e, '/ai-roleplay')}
            style={{ gridColumn: 'span 2' }}
          >
            <svg className="feature-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            </svg>
            <h3 className="feature-title">Nhập vai cùng AI</h3>
            <p className="feature-desc">Trò chuyện và nhập vai cùng nhân vật hoạt hình thông minh, có gợi ý câu trả lời & dịch thuật tức thì</p>
            <span className="feature-badge">HOT PRO</span>
          </Link>

          <Link to="/study-progress" className="feature-card">
            <svg className="feature-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <h3 className="feature-title">Theo dõi tiến độ</h3>
            <p className="feature-desc">Phân tích chi tiết quá trình học</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardNew;
