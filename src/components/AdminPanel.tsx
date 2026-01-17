import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { logger } from '../utils/logger';
import {
  getCourses, createCourse, updateCourse, deleteCourse,
  getLessons, createLesson, updateLesson, deleteLesson,
  getVocabulary, createVocabulary, updateVocabulary, deleteVocabulary,
  getKanji, createKanji, updateKanji, deleteKanji,
  getGrammar, createGrammar, updateGrammar, deleteGrammar,
  getListeningExercises, createListeningExercise, updateListeningExercise, deleteListeningExercise,
  getSentenceGames, createSentenceGame, updateSentenceGame, deleteSentenceGame,
  getRoleplayScenarios, createRoleplayScenario, updateRoleplayScenario, deleteRoleplayScenario
} from '../services/supabaseService';
import { getAllUserRoles, assignRole, assignTeacherToCourse, removeRole } from '../services/adminService';
import { parseVocabularyBatch } from '../utils/vocabParser';
import { parseKanjiBatch } from '../utils/kanjiParser';
import { parseGrammarBatch } from '../utils/grammarParser';
import { parseSentenceGameBatch } from '../utils/sentenceGameParser';
import { uploadAudio, uploadImage, validateFileType, validateFileSize } from '../utils/fileUpload';
import AdminHelpGuide from './AdminHelpGuide';
import '../App.css';
import '../styles/admin-panel-complete.css';
import '../styles/admin-help-guide.css';

type TabType = 'courses' | 'lessons' | 'vocabulary' | 'kanji' | 'grammar' | 'listening' | 'games' | 'roleplay' | 'users';

const AdminPanel = () => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();

  // Navigation State
  // 'languages': Select Japanese/Chinese
  // 'courses': List of courses for selected language (N1, N2.. or HSK1, HSK2..)
  // 'lessons': List of lessons in selectedCourse
  // 'content': Content of selectedLesson
  // 'users': User Management
  const [viewMode, setViewMode] = useState<'languages' | 'levels' | 'courses' | 'lessons' | 'content' | 'users'>('languages');
  const [selectedLanguage, setSelectedLanguage] = useState<'japanese' | 'chinese' | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('vocabulary');

  // Data State
  const [data, setData] = useState<any[]>([]); // Current view data (content items)
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]); // Lessons for current course
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  // Filter and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // User Management State
  const [userEmailInput, setUserEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | 'admin'>('student');
  const [assignCourseLang, setAssignCourseLang] = useState('japanese');
  const [assignCourseLevel, setAssignCourseLevel] = useState('N5');

  // Import CSS for Admin Panel
  useEffect(() => {
    // Dynamically importing or ensuring the CSS is applied
    // Since we can't do `import '../styles/admin-panel.css'` conditionally inside component easily,
    // we assume it is imported at the top of file or here.
  }, []);

  // When viewing content, load data based on active tab and selected lesson
  useEffect(() => {
    if (viewMode === 'content' && selectedLesson) {
      loadContent();
    } else if (viewMode === 'users') {
      loadUsers();
    } else if (viewMode === 'courses' && selectedLanguage && selectedLevel) {
      loadCourses();
    } else if (viewMode === 'lessons' && selectedCourse) {
      loadLessonsForCourse(selectedCourse.id);
    }
  }, [viewMode, selectedLesson, activeTab, selectedLanguage, selectedLevel, selectedCourse]);

  // Search filtering
  useEffect(() => {
    let filtered = [...data];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        JSON.stringify(item).toLowerCase().includes(lower)
      );
    }
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [data, searchTerm]);

  const loadCourses = async () => {
    if (!selectedLanguage) return;
    setLoading(true);
    try {
      // Fetch all courses then filter by language in memory or api
      // Assuming getCourses returns all, we filter here for now
      const res = await getCourses();
      const filteredCourses = (res || []).filter((c: any) =>
        c.language === selectedLanguage && c.level === selectedLevel
      );

      setCourses(filteredCourses);
      // If we are in courses view, data is courses
      if (viewMode === 'courses') {
        setData(filteredCourses);
        setFilteredData(filteredCourses);
      }
    } catch (e) {
      console.error(e);
      showToast('Lỗi tải khóa học', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLessonsForCourse = async (courseId: string) => {
    setLoading(true);
    try {
      const res = await getLessons(courseId);
      // Sort lessons by number if possible
      const sorted = (res || []).sort((a: any, b: any) => a.lesson_number - b.lesson_number);
      setLessons(sorted);
      setData(sorted);
      setFilteredData(sorted);
    } catch (e) {
      console.error(e);
      showToast('Lỗi tải bài học', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    if (!selectedLesson) return;
    setLoading(true);
    try {
      let res: any[] = [];
      switch (activeTab) {
        case 'vocabulary': res = await getVocabulary(selectedLesson.id); break;
        case 'kanji': res = await getKanji(selectedLesson.id); break;
        case 'grammar': res = await getGrammar(selectedLesson.id); break;
        case 'listening': res = await getListeningExercises(selectedLesson.id); break;
        case 'games': res = await getSentenceGames(selectedLesson.id); break;
        case 'roleplay': res = await getRoleplayScenarios(selectedLesson.id); break;
      }
      setData(res || []);
      setFilteredData(res || []);
    } catch (e: any) {
      showToast('Lỗi tải dữ liệu: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUserRoles();
      setData(res || []);
      setFilteredData(res || []);
    } catch (e: any) {
      showToast('Lỗi tải user: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Navigation Handlers
  const handleSelectLanguage = (lang: 'japanese' | 'chinese') => {
    setSelectedLanguage(lang);
    setViewMode('levels');
  };

  const handleSelectLevel = (level: string) => {
    setSelectedLevel(level);
    setViewMode('courses');
  };

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    setViewMode('lessons');
    loadLessonsForCourse(course.id);
  };

  const handleSelectLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    setViewMode('content');
    setActiveTab('vocabulary'); // Default tab
  };

  const handleBackToLanguages = () => {
    setSelectedLanguage(null);
    setSelectedLevel(null);
    setSelectedCourse(null);
    setSelectedLesson(null);
    setViewMode('languages');
  };

  const handleBackToLevels = () => {
    setSelectedLevel(null);
    setSelectedCourse(null);
    setSelectedLesson(null);
    setViewMode('levels');
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setSelectedLesson(null);
    setViewMode('courses');
    // loadCourses() will be called by useEffect
  };

  const handleBackToLessons = () => {
    setSelectedLesson(null);
    setViewMode('lessons');
    // loadLessonsForCourse() will be called by useEffect
  };

  // CRUD Handlers
  const handleCreate = async (formData: any) => {
    try {
      // Auto-inject ids based on context
      if (viewMode === 'lessons' && selectedCourse) {
        formData.course_id = selectedCourse.id;
        formData.level = selectedCourse.level;
        await createLesson(formData);
        loadLessonsForCourse(selectedCourse.id);
      } else if (viewMode === 'content' && selectedLesson) {
        formData.lesson_id = selectedLesson.id;
        // ... Call specific create function based on activeTab
        if (activeTab === 'vocabulary') {
          if (Array.isArray(formData)) {
            for (const item of formData) await createVocabulary({ ...item, lesson_id: selectedLesson.id });
          } else await createVocabulary(formData);
        }
        else if (activeTab === 'kanji') {
          if (Array.isArray(formData)) {
            for (const item of formData) await createKanji({ ...item, lesson_id: selectedLesson.id });
          } else await createKanji(formData);
        }
        else if (activeTab === 'grammar') {
          if (Array.isArray(formData)) {
            for (const item of formData) await createGrammar({ ...item, lesson_id: selectedLesson.id });
          } else await createGrammar(formData);
        }
        else if (activeTab === 'listening') await createListeningExercise(formData);
        else if (activeTab === 'games') await createSentenceGame(formData);
        else if (activeTab === 'roleplay') await createRoleplayScenario(formData);

        loadContent();
      } else if (viewMode === 'courses') {
        // Ensure language and level is set from context
        formData.language = selectedLanguage;
        formData.level = selectedLevel;
        await createCourse(formData);
        loadCourses();
      }

      setShowForm(false);
      showToast('Tạo thành công', 'success');
    } catch (e: any) {
      showToast('Lỗi tạo: ' + e.message, 'error');
    }
  };

  const handleUpdate = async (id: string, formData: any) => {
    try {
      if (viewMode === 'courses') { await updateCourse(id, formData); loadCourses(); }
      else if (viewMode === 'lessons') { await updateLesson(id, formData); if (selectedCourse) loadLessonsForCourse(selectedCourse.id); }
      else if (viewMode === 'content') {
        if (activeTab === 'vocabulary') await updateVocabulary(id, formData);
        else if (activeTab === 'kanji') await updateKanji(id, formData);
        else if (activeTab === 'grammar') await updateGrammar(id, formData);
        else if (activeTab === 'listening') await updateListeningExercise(id, formData);
        else if (activeTab === 'games') await updateSentenceGame(id, formData);
        else if (activeTab === 'roleplay') await updateRoleplayScenario(id, formData);
        loadContent();
      }
      setShowForm(false);
      setEditingItem(null);
      showToast('Cập nhật thành công', 'success');
    } catch (e: any) {
      showToast('Lỗi cập nhật: ' + e.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
    try {
      if (viewMode === 'courses') { await deleteCourse(id); loadCourses(); }
      else if (viewMode === 'lessons') { await deleteLesson(id); if (selectedCourse) loadLessonsForCourse(selectedCourse.id); }
      else if (viewMode === 'content') {
        if (activeTab === 'vocabulary') await deleteVocabulary(id);
        else if (activeTab === 'kanji') await deleteKanji(id);
        else if (activeTab === 'grammar') await deleteGrammar(id);
        else if (activeTab === 'listening') await deleteListeningExercise(id);
        else if (activeTab === 'games') await deleteSentenceGame(id);
        else if (activeTab === 'roleplay') await deleteRoleplayScenario(id);
        loadContent();
      }
      else if (viewMode === 'users') {
        await removeRole(id); // id here is email based on previous implementation? Check adminService.
        loadUsers();
      }
      showToast('Xóa thành công', 'success');
    } catch (e: any) {
      showToast('Lỗi xóa: ' + e.message, 'error');
    }
  };

  // Render Helpers
  const renderBreadcrumbs = () => (
    <div className="breadcrumbs">
      <Link to="/" className="breadcrumb-item" style={{ textDecoration: 'none', color: 'inherit' }}>🏠 Trang chủ</Link>
      <span className="breadcrumb-separator">/</span>
      <span className="breadcrumb-item" onClick={handleBackToLanguages}>Admin</span>
      <span className="breadcrumb-separator">/</span>

      {viewMode === 'languages' ? (
        <span className="breadcrumb-current">Chọn ngôn ngữ</span>
      ) : (
        <>
          <span
            className={`breadcrumb-item ${viewMode === 'levels' ? 'breadcrumb-current' : ''}`}
            onClick={handleBackToLevels}
          >
            {selectedLanguage === 'japanese' ? 'Tiếng Nhật' : 'Tiếng Trung'}
          </span>

          {selectedLevel && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span
                className={`breadcrumb-item ${viewMode === 'courses' ? 'breadcrumb-current' : ''}`}
                onClick={handleBackToCourses}
              >
                Cấp độ {selectedLevel}
              </span>
            </>
          )}

          {selectedCourse && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span
                className={`breadcrumb-item ${!selectedLesson && viewMode === 'lessons' ? 'breadcrumb-current' : ''}`}
                onClick={handleBackToLessons}
              >
                {selectedCourse.title}
              </span>
            </>
          )}

          {selectedLesson && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{selectedLesson.title}</span>
            </>
          )}
        </>
      )}
    </div>
  );

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const getLabel = (tab: string) => {
    const map: any = { 'courses': 'Khóa học', 'lessons': 'Bài học', 'vocabulary': 'Từ vựng', 'kanji': 'Kanji', 'grammar': 'Ngữ pháp', 'listening': 'Nghe', 'games': 'Game', 'roleplay': 'Roleplay', 'users': 'Người dùng' };
    return map[tab] || tab;
  };

  // Helper render cho Users tab
  const renderUserManagement = () => {
    return (
      <div className="user-management">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-bold mb-4 text-slate-700 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 p-1 rounded">👤</span>
              Phân quyền thành viên
            </h3>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email người dùng"
                value={userEmailInput}
                onChange={e => setUserEmailInput(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <div className="flex gap-2">
                <select
                  value={selectedRole}
                  onChange={(e: any) => setSelectedRole(e.target.value)}
                  className="p-2 border rounded-lg flex-1 outline-none cursor-pointer"
                >
                  <option value="student">Học sinh</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={async () => {
                    try {
                      await assignRole(userEmailInput, selectedRole);
                      showToast('Đã phân quyền thành công', 'success');
                      loadUsers();
                      setUserEmailInput('');
                    } catch (e: any) {
                      showToast('Lỗi: ' + e.message, 'error');
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-bold mb-4 text-slate-700 flex items-center gap-2">
              <span className="bg-green-100 text-green-600 p-1 rounded">🎓</span>
              Phân công giảng dạy
            </h3>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email giáo viên"
                value={userEmailInput}
                onChange={e => setUserEmailInput(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-100 outline-none"
              />
              <div className="flex gap-2">
                <select
                  value={assignCourseLang}
                  onChange={e => setAssignCourseLang(e.target.value)}
                  className="p-2 border rounded-lg flex-1 outline-none"
                >
                  <option value="japanese">Nhật</option>
                  <option value="chinese">Trung</option>
                </select>
                <select
                  value={assignCourseLevel}
                  onChange={e => setAssignCourseLevel(e.target.value)}
                  className="p-2 border rounded-lg w-24 outline-none"
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                  <option value="HSK1">HSK1</option>
                  <option value="HSK2">HSK2</option>
                </select>
                <button
                  onClick={async () => {
                    try {
                      await assignTeacherToCourse(userEmailInput, assignCourseLang, assignCourseLevel);
                      showToast('Đã phân công giáo viên', 'success');
                    } catch (e: any) {
                      showToast('Lỗi: ' + e.message, 'error');
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition"
                >
                  Phân
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((userRole: any) => (
                <tr key={userRole.id || userRole.email}>
                  <td className="font-medium">{userRole.email}</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${userRole.role === 'admin' ? 'bg-red-100 text-red-700' :
                      userRole.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                      {userRole.role ? userRole.role.toUpperCase() : 'STUDENT'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(userRole.email)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm transition"
                    >
                      Xóa quyền
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-title">
          <h1>Admin Panel</h1>
          {viewMode === 'content' && <span className="text-sm font-normal ml-3 bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{selectedLesson?.title}</span>}
        </div>
        <div className="admin-actions">
          <button onClick={() => setViewMode('users')} className={`hover:bg-blue-50 text-slate-600 ${viewMode === 'users' ? 'bg-blue-50 text-blue-600 font-bold' : ''}`}>Quản lý User</button>
          <button onClick={handleBackToLanguages} className={`hover:bg-blue-50 text-slate-600 ${viewMode !== 'users' ? 'bg-blue-50 text-blue-600 font-bold' : ''}`}>Quản lý Nội dung</button>
          <button className="logout-btn" onClick={signOut}>Đăng xuất</button>
        </div>
      </header>

      <div className="admin-content">
        {viewMode !== 'users' && renderBreadcrumbs()}

        {/* CONTROLS BAR (Search, Add, Tabs) */}
        {viewMode !== 'languages' && viewMode !== 'users' && (
          <div className="controls-bar">
            {viewMode === 'content' ? (
              <div className="admin-tabs" style={{ marginBottom: 0 }}>
                {['vocabulary', 'kanji', 'grammar', 'listening', 'games', 'roleplay'].map(tab => (
                  <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab as TabType)}>
                    {getLabel(tab)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="admin-section-title">
                {viewMode === 'levels' && "Chọn cấp độ hệ thống"}
                {viewMode === 'courses' && `Khóa học ${selectedLanguage === 'japanese' ? 'Tiếng Nhật' : 'Tiếng Trung'} - Cấp độ ${selectedLevel}`}
                {viewMode === 'lessons' && `Bài học trong: ${selectedCourse?.title}`}
              </div>
            )}

            <div className="flex gap-2 ml-auto">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {(viewMode === 'courses' || viewMode === 'lessons' || viewMode === 'content') && (
                <button className="btn-add" onClick={() => { setEditingItem(null); setShowForm(true); }}>
                  <span>+</span> Thêm Mới
                </button>
              )}
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            Đang tải dữ liệu...
          </div>
        ) : viewMode === 'users' ? (
          renderUserManagement()
        ) : (
          <div className="data-grid">

            {/* 1. LANGUAGES SELECT VIEW - Modern Design */}
            {viewMode === 'languages' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                padding: '2rem'
              }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                  <h2 className="responsive-title" style={{
                    fontWeight: '800',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}> Chọn ngôn ngữ</h2>
                  <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Chọn ngôn ngữ bạn muốn quản lý nội dung</p>
                </div>

                {/* Cards Container */}
                <div className="admin-grid" style={{
                  width: '100%',
                  maxWidth: '1000px',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '2rem'
                }}>
                  {/* Japanese Card */}
                  <div
                    onClick={() => handleSelectLanguage('japanese')}
                    style={{
                      position: 'relative',
                      background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
                      borderRadius: '24px',
                      padding: '2.5rem',
                      cursor: 'pointer',
                      border: '2px solid #fecaca',
                      boxShadow: '0 10px 40px -10px rgba(239, 68, 68, 0.2)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 25px 60px -15px rgba(239, 68, 68, 0.35)';
                      e.currentTarget.style.borderColor = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(239, 68, 68, 0.2)';
                      e.currentTarget.style.borderColor = '#fecaca';
                    }}
                  >
                    {/* Background decoration */}
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      fontSize: '120px',
                      opacity: '0.05',
                      fontWeight: '900',
                      color: '#ef4444'
                    }}>日本</div>

                    {/* Icon with glow */}
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.5rem',
                      boxShadow: '0 10px 30px -5px rgba(239, 68, 68, 0.4)',
                      transition: 'transform 0.3s ease'
                    }}>
                      <span style={{ fontSize: '2.5rem' }}>🇯🇵</span>
                    </div>

                    <h3 style={{
                      fontSize: '1.75rem',
                      fontWeight: '800',
                      color: '#1e293b',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      Tiếng Nhật
                      <span style={{
                        fontSize: '0.75rem',
                        background: 'linear-gradient(135deg, #ef4444, #f97316)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontWeight: '600'
                      }}>JLPT</span>
                    </h3>

                    <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
                      Quản lý khóa học <strong>N5 → N1</strong> và tài liệu học tập tiếng Nhật.
                    </p>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#ef4444',
                      fontWeight: '700',
                      fontSize: '1rem'
                    }}>
                      <span>Bắt đầu quản lý</span>
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>

                    {/* Bottom accent bar */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #ef4444, #f97316, #fb923c)',
                      borderRadius: '0 0 24px 24px'
                    }}></div>
                  </div>

                  {/* Chinese Card */}
                  <div
                    onClick={() => handleSelectLanguage('chinese')}
                    style={{
                      position: 'relative',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)',
                      borderRadius: '24px',
                      padding: '2.5rem',
                      cursor: 'pointer',
                      border: '2px solid #fed7aa',
                      boxShadow: '0 10px 40px -10px rgba(234, 88, 12, 0.2)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 25px 60px -15px rgba(234, 88, 12, 0.35)';
                      e.currentTarget.style.borderColor = '#ea580c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(234, 88, 12, 0.2)';
                      e.currentTarget.style.borderColor = '#fed7aa';
                    }}
                  >
                    {/* Background decoration */}
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      fontSize: '120px',
                      opacity: '0.05',
                      fontWeight: '900',
                      color: '#ea580c'
                    }}>中文</div>

                    {/* Icon with glow */}
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: 'linear-gradient(135deg, #ea580c 0%, #eab308 100%)',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.5rem',
                      boxShadow: '0 10px 30px -5px rgba(234, 88, 12, 0.4)',
                      transition: 'transform 0.3s ease'
                    }}>
                      <span style={{ fontSize: '2.5rem' }}>🇨🇳</span>
                    </div>

                    <h3 style={{
                      fontSize: '1.75rem',
                      fontWeight: '800',
                      color: '#1e293b',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      Tiếng Trung
                      <span style={{
                        fontSize: '0.75rem',
                        background: 'linear-gradient(135deg, #ea580c, #eab308)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontWeight: '600'
                      }}>HSK</span>
                    </h3>

                    <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
                      Quản lý khóa học <strong>HSK1 → HSK6</strong> và tài liệu học tập tiếng Trung.
                    </p>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#ea580c',
                      fontWeight: '700',
                      fontSize: '1rem'
                    }}>
                      <span>Bắt đầu quản lý</span>
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>

                    {/* Bottom accent bar */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #ea580c, #eab308, #facc15)',
                      borderRadius: '0 0 24px 24px'
                    }}></div>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'levels' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b' }}>
                    {selectedLanguage === 'japanese' ? '🇯🇵 Chọn cấp độ JLPT' : '🇨🇳 Chọn cấp độ HSK'}
                  </h2>
                  <p style={{ color: '#64748b' }}>Chọn cấp độ để quản lý các khóa học tương ứng</p>
                </div>

                <div className="admin-grid" style={{
                  gap: '1.5rem',
                  width: '100%',
                  marginTop: '1rem'
                }}>
                  {(selectedLanguage === 'japanese'
                    ? ['N5', 'N4', 'N3', 'N2', 'N1']
                    : ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']
                  ).map((level) => (
                    <div
                      key={level}
                      onClick={() => handleSelectLevel(level)}
                      style={{
                        background: 'white',
                        padding: '2rem 1.5rem',
                        borderRadius: '20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: '2px solid #e2e8f0',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.borderColor = selectedLanguage === 'japanese' ? '#ef4444' : '#ea580c';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                      }}
                    >
                      <div style={{
                        fontSize: '2.5rem',
                        fontWeight: '900',
                        color: selectedLanguage === 'japanese' ? '#ef4444' : '#ea580c',
                        marginBottom: '0.5rem'
                      }}>{level}</div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        {selectedLanguage === 'japanese' ? 'Level' : 'Grade'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. COURSES VIEW - Modern Grid */}
            {viewMode === 'courses' && (
              <div className="admin-grid" style={{
                width: '100%',
                marginTop: '1rem'
              }}>
                {currentItems.length > 0 ? currentItems.map((course: any) => (
                  <div
                    key={course.id}
                    onClick={() => handleSelectCourse(course)}
                    style={{
                      background: 'white',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0,0,0,0.1)';
                      e.currentTarget.style.borderColor = selectedLanguage === 'japanese' ? '#fecaca' : '#fed7aa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', flex: 1 }}>{course.title}</h3>
                      <span style={{
                        background: selectedLanguage === 'japanese' ? '#fee2e2' : '#ffedd5',
                        color: selectedLanguage === 'japanese' ? '#ef4444' : '#ea580c',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '800'
                      }}>{course.level}</span>
                    </div>

                    <p style={{
                      color: '#64748b',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '2.7rem'
                    }}>{course.description || 'Chưa có mô tả cho khóa học này.'}</p>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 'auto',
                      paddingTop: '1rem',
                      borderTop: '1px solid #f1f5f9'
                    }}>
                      <button
                        className="manage-content-btn"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                      >
                        📚 Xem bài học
                      </button>
                      <div className="course-actions" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingItem(course); setShowForm(true); }}
                          className="btn-icon btn-edit"
                          style={{ padding: '0.4rem 0.7rem', fontSize: '0.75rem' }}
                        >✏️</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }}
                          className="btn-icon btn-delete"
                          style={{ padding: '0.4rem 0.7rem', fontSize: '0.75rem' }}
                        >🗑️</button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: '#f8fafc',
                    borderRadius: '24px',
                    border: '2px dashed #e2e8f0'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#475569' }}>Chưa có khóa học nào</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Hãy tạo khóa học đầu tiên cho cấp độ này</p>
                    <button
                      className="btn-add"
                      onClick={() => { setEditingItem(null); setShowForm(true); }}
                      style={{ margin: '0 auto' }}
                    >
                      <span>+</span> Thêm Khóa Học
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. LESSONS VIEW */}
            {viewMode === 'lessons' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Bài số</th>
                      <th>Tên bài học</th>
                      <th>Mô tả</th>
                      <th style={{ width: '220px', textAlign: 'center' }}>Quản lý nội dung</th>
                      <th style={{ width: '150px', textAlign: 'right' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? currentItems.map((lesson: any) => (
                      <tr key={lesson.id} className="admin-row-hover group">
                        <td data-label="Bài số" className="font-bold text-slate-400 group-hover:text-red-600 transition-colors">#{lesson.lesson_number}</td>
                        <td data-label="Tên bài học">
                          <div className="font-bold text-slate-700 group-hover:text-red-600 transition-colors text-lg">{lesson.title}</div>
                          <div className="text-xs text-slate-400 md:hidden">{lesson.description}</div>
                        </td>
                        <td data-label="Mô tả" className="text-slate-500 italic text-sm">{lesson.description || 'Chưa có mô tả'}</td>
                        <td data-label="Quản lý" style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleSelectLesson(lesson)}
                            className="manage-content-btn"
                          >
                            📝 Quản lý
                          </button>
                        </td>
                        <td data-label="Hành động">
                          <div className="row-action-btns" style={{ justifyContent: 'flex-end' }}>
                            <button onClick={(e) => { e.stopPropagation(); setEditingItem(lesson); setShowForm(true); }} className="btn-icon btn-edit" title="Chỉnh sửa">
                              <span>✏️</span> Sửa
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(lesson.id); }} className="btn-icon btn-delete" title="Xóa">
                              <span>🗑️</span> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="text-center py-12 text-slate-500">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        Chưa có bài học nào được tạo cho khóa học này.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. CONTENT VIEW */}
            {viewMode === 'content' && (
              <div className="admin-table-container shadow-lg border-t-4 border-red-600">
                <table className="admin-table">
                  <thead>
                    {activeTab === 'vocabulary' ? (
                      <tr>
                        <th style={{ width: '25%' }}>🔤 Từ vựng / Pinyin</th>
                        <th style={{ width: '40%' }}>💡 Nghĩa / Ví dụ</th>
                        <th style={{ width: '15%', textAlign: 'center' }}>⚡️ Độ khó</th>
                        <th style={{ width: '20%', textAlign: 'right' }}>Hành động</th>
                      </tr>
                    ) : activeTab === 'kanji' ? (
                      <tr>
                        <th style={{ width: '15%' }}>🈯️ Ký tự</th>
                        <th style={{ width: '40%' }}>📖 Nghĩa / Âm đọc</th>
                        <th style={{ width: '20%', textAlign: 'center' }}>✍️ Số nét</th>
                        <th style={{ width: '25%', textAlign: 'right' }}>Hành động</th>
                      </tr>
                    ) : activeTab === 'grammar' ? (
                      <tr>
                        <th style={{ width: '30%' }}>📑 Cấu trúc</th>
                        <th style={{ width: '50%' }}>💬 Giải thích / Ví dụ</th>
                        <th style={{ width: '20%', textAlign: 'right' }}>Hành động</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Nội dung</th>
                        <th style={{ textAlign: 'right' }}>Hành động</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? currentItems.map((item: any) => (
                      <tr key={item.id} className="admin-row-hover">
                        {activeTab === 'vocabulary' ? (
                          <>
                            <td data-label="Từ vựng">
                              <div className="font-bold text-xl text-slate-800">{item.word}</div>
                              {item.kanji && <div className="text-sm text-slate-400">Kanji: {item.kanji}</div>}
                              <div className="text-xs font-mono text-red-500 bg-red-50 inline-block px-1 rounded mt-1">{item.hiragana}</div>
                            </td>
                            <td data-label="Nghĩa">
                              <div className="font-semibold text-slate-700">{item.meaning}</div>
                              {item.example && (
                                <div className="text-xs text-slate-400 mt-1 italic">
                                  Ví dụ: {item.example}
                                </div>
                              )}
                            </td>
                            <td data-label="Độ khó" style={{ textAlign: 'center' }}>
                              <span className={`badge-difficulty ${item.difficulty || 'easy'}`}>
                                {item.difficulty === 'easy' ? 'Dễ' : item.difficulty === 'hard' ? 'Khó' : 'Thường'}
                              </span>
                            </td>
                            <td data-label="Hành động">
                              <div className="row-action-btns" style={{ justifyContent: 'flex-end' }}>
                                <button onClick={() => { setEditingItem(item); setShowForm(true); }} className="btn-icon btn-edit">✏️ Sửa</button>
                                <button onClick={() => handleDelete(item.id)} className="btn-icon btn-delete">🗑️ Xóa</button>
                              </div>
                            </td>
                          </>
                        ) : activeTab === 'kanji' ? (
                          <>
                            <td data-label="Ký tự">
                              <div className="text-4xl font-bold bg-slate-50 w-16 h-16 flex items-center justify-center rounded-xl border border-slate-100">{item.character}</div>
                            </td>
                            <td data-label="Ý nghĩa">
                              <div className="font-bold text-slate-700 text-lg">{item.meaning}</div>
                              <div className="text-sm text-red-500">On: {Array.isArray(item.onyomi) ? item.onyomi.join(', ') : item.onyomi}</div>
                              <div className="text-sm text-blue-500">Kun: {Array.isArray(item.kunyomi) ? item.kunyomi.join(', ') : item.kunyomi}</div>
                            </td>
                            <td data-label="Số nét" style={{ textAlign: 'center' }}>
                              <div className="text-2xl font-bold text-slate-400">{item.stroke_count}</div>
                              <div className="text-xs text-slate-300">nét</div>
                            </td>
                            <td data-label="Hành động">
                              <div className="row-action-btns" style={{ justifyContent: 'flex-end' }}>
                                <button onClick={() => { setEditingItem(item); setShowForm(true); }} className="btn-icon btn-edit">✏️ Sửa</button>
                                <button onClick={() => handleDelete(item.id)} className="btn-icon btn-delete">🗑️ Xóa</button>
                              </div>
                            </td>
                          </>
                        ) : activeTab === 'grammar' ? (
                          <>
                            <td data-label="Cấu trúc">
                              <div className="font-bold text-lg text-red-600 bg-red-50 px-3 py-1 rounded inline-block">{item.pattern}</div>
                              <div className="text-sm text-slate-700 font-semibold mt-1">{item.meaning}</div>
                            </td>
                            <td data-label="Giải thích">
                              <div className="text-sm text-slate-500 line-clamp-2">{item.explanation}</div>
                              {item.examples && item.examples.length > 0 && (
                                <div className="text-xs text-blue-400 mt-1">({item.examples.length} ví dụ)</div>
                              )}
                            </td>
                            <td data-label="Hành động">
                              <div className="row-action-btns" style={{ justifyContent: 'flex-end' }}>
                                <button onClick={() => { setEditingItem(item); setShowForm(true); }} className="btn-icon btn-edit">✏️ Sửa</button>
                                <button onClick={() => handleDelete(item.id)} className="btn-icon btn-delete">🗑️ Xóa</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td data-label="Nội dung" className="font-medium text-slate-700">{item.title || item.sentence || item.question || 'Nội dung bài học'}</td>
                            <td data-label="Hành động">
                              <div className="row-action-btns" style={{ justifyContent: 'flex-end' }}>
                                <button onClick={() => { setEditingItem(item); setShowForm(true); }} className="btn-icon btn-edit">✏️ Sửa</button>
                                <button onClick={() => handleDelete(item.id)} className="btn-icon btn-delete">🗑️ Xóa</button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="text-center py-12 text-slate-500">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                        Danh mục này chưa có dữ liệu. Hãy bấm "Thêm Mới" để bắt đầu.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {totalPages > 1 && viewMode !== 'languages' && (
          <div className="pagination flex justify-center gap-2 mt-6">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-slate-50"
            >
              Prev
            </button>
            <span className="px-3 py-1 font-bold text-slate-600">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <AdminForm
          key={editingItem?.id || 'new'}
          type={viewMode === 'courses' ? 'courses' : viewMode === 'lessons' ? 'lessons' : activeTab}
          item={editingItem}
          courses={courses}
          lessons={lessons}
          currentLanguage={selectedLanguage}
          currentCourse={selectedCourse}
          currentLevel={selectedLevel}
          currentLesson={selectedLesson}
          onSave={editingItem ? (id: string, data: any) => handleUpdate(id, data) : handleCreate}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
        />
      )}

      {showHelpGuide && <AdminHelpGuide type={activeTab} onClose={() => setShowHelpGuide(false)} />}

      {showShortcuts && (
        <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white p-4 rounded shadow">
            <h3>Shortcuts Guide</h3>
            <p>Implementation pending...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Comprehensive Admin Form
const AdminForm = ({ type, item, courses, lessons, currentLanguage, currentCourse, currentLevel, currentLesson, onSave, onCancel }: any) => {
  const { showToast } = useToast();
  // Initialize formData properly to avoid duplication
  const initializeFormData = () => {
    if (item) {
      // When editing, create a deep copy to avoid reference issues
      const baseData = JSON.parse(JSON.stringify(item));

      // Handle examples for grammar - remove duplicates
      if (type === 'grammar' && baseData.examples) {
        if (Array.isArray(baseData.examples)) {
          // Use Set to track seen examples by id or content
          const seen = new Set<string>();
          baseData.examples = baseData.examples.filter((ex: any) => {
            // Create unique key from id or content
            const key = ex.id
              ? `id_${ex.id}`
              : `content_${(ex.japanese || '').trim()}_${(ex.translation || '').trim()}`;

            if (seen.has(key)) {
              return false; // Duplicate, remove it
            }
            seen.add(key);
            return true;
          });
        } else {
          baseData.examples = [];
        }
      }

      // Handle examples for kanji - remove duplicates
      if (type === 'kanji' && baseData.examples) {
        if (Array.isArray(baseData.examples)) {
          const seen = new Set<string>();
          baseData.examples = baseData.examples.filter((ex: any) => {
            const key = ex.id
              ? `id_${ex.id}`
              : `content_${(ex.word || '').trim()}_${(ex.meaning || '').trim()}`;

            if (seen.has(key)) {
              return false; // Duplicate, remove it
            }
            seen.add(key);
            return true;
          });
        } else {
          baseData.examples = [];
        }
      }

      return baseData;
    }
    return getDefaultFormData(type);
  };

  const [formData, setFormData] = useState<any>(() => initializeFormData());
  const [importMode, setImportMode] = useState<'single' | 'batch'>('single');
  const [batchText, setBatchText] = useState('');
  const [batchPreview, setBatchPreview] = useState<any[]>([]);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [showJSONHint, setShowJSONHint] = useState<Record<string, boolean>>({});
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiJsonText, setAiJsonText] = useState(''); // ô dán JSON từ AI
  const [aiJsonStatus, setAiJsonStatus] = useState<string | null>(null); // trạng thái parse JSON

  // Check if this type supports batch import
  const supportsBatchImport = type === 'vocabulary' || type === 'kanji' || type === 'grammar' || type === 'games';

  // Reset formData when item changes (when switching between edit/new or different items)
  useEffect(() => {
    const newFormData = initializeFormData();
    setFormData(newFormData);

    if (item) {
      // Editing mode - always single
      setImportMode('single');
      setBatchText('');
      setBatchPreview([]);
      setBatchError(null);
      setAiJsonText('');
      setAiJsonStatus(null);
    } else if (supportsBatchImport) {
      // New item with batch support - default to single
      setImportMode('single');
      setBatchText('');
      setBatchPreview([]);
      setBatchError(null);
      setAiJsonText('');
      setAiJsonStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, type]); // Only depend on item.id, not the whole item object

  // Parse JSON từ AI và đổ vào form tương ứng
  const handleParseAiJson = () => {
    if (!aiJsonText.trim()) {
      // showToast('Vui lòng dán JSON trước.', 'warning');
      console.warn('Vui lòng dán JSON trước.');
      return;
    }
    let json: any;
    try {
      json = JSON.parse(aiJsonText);
    } catch (e) {
      // showToast('JSON không hợp lệ. Hãy kiểm tra lại (không được có text ngoài JSON).', 'error');
      console.error('JSON không hợp lệ.');
      return;
    }

    try {
      setAiJsonStatus(null);
      switch (type as TabType) {
        case 'listening': {
          const questions =
            Array.isArray(json.questions) && json.questions.length
              ? json.questions.map((q: any) => ({
                question: q.question || '',
                options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
                correct_answer:
                  typeof q.correct_answer === 'number' && q.correct_answer >= 0 && q.correct_answer <= 3
                    ? q.correct_answer
                    : 0,
              }))
              : [];
          setFormData({
            ...formData,
            title: json.title || formData.title,
            transcript: json.transcript || formData.transcript,
            questions,
          });
          setAiJsonStatus('Đã parse JSON bài nghe vào form.');
          break;
        }
        case 'roleplay': {
          setFormData({
            ...formData,
            title: json.title || formData.title,
            description: json.description || formData.description,
            scenario: json.scenario || formData.scenario,
            character_a: json.character_a || formData.character_a,
            character_b: json.character_b || formData.character_b,
            character_a_script: Array.isArray(json.character_a_script)
              ? json.character_a_script
              : formData.character_a_script || [],
            character_b_script: Array.isArray(json.character_b_script)
              ? json.character_b_script
              : formData.character_b_script || [],
            vocabulary_hints: Array.isArray(json.vocabulary_hints)
              ? json.vocabulary_hints
              : formData.vocabulary_hints || [],
            grammar_points: Array.isArray(json.grammar_points)
              ? json.grammar_points
              : formData.grammar_points || [],
            difficulty: json.difficulty || formData.difficulty || 'easy',
            image_url: json.image_url || formData.image_url,
          });
          setAiJsonStatus('Đã parse JSON roleplay vào form.');
          break;
        }
        case 'games': {
          // JSON 1 câu game sắp xếp câu
          setFormData({
            ...formData,
            sentence: json.sentence || formData.sentence,
            translation: json.translation || formData.translation,
            words: Array.isArray(json.words) ? json.words : formData.words || [],
            correct_order: Array.isArray(json.correct_order) ? json.correct_order : formData.correct_order || [],
            hint: json.hint || formData.hint,
          });
          setAiJsonStatus('Đã parse JSON game sắp xếp câu vào form.');
          break;
        }
        default: {
          showToast('Loại này hiện chỉ hỗ trợ import dạng text/batch, chưa hỗ trợ JSON tự parse.', 'info');
          break;
        }
      }
    } catch (e) {
      logger.error('Parse AI JSON error', e);
      showToast('Có lỗi khi áp dụng JSON vào form. Hãy kiểm tra lại cấu trúc.', 'error');
    }
  };

  // Hướng dẫn prompt JSON cho AI theo từng chức năng (chỉ hiển thị khi tạo mới)
  const renderAIPromptHint = () => {
    if (item) return null;

    switch (type as TabType) {
      case 'vocabulary':
        const showVocabJSON = showJSONHint['vocabulary'] ?? false;
        return (
          <div className="form-group">
            <label>
              Hướng dẫn JSON/format cho AI (Từ vựng)
              <button
                type="button"
                className="btn-toggle-hint"
                onClick={() => setShowJSONHint({ ...showJSONHint, vocabulary: !showVocabJSON })}
              >
                {showVocabJSON ? '▼ Thu gọn' : '▶ Mở rộng'}
              </button>
            </label>
            {showVocabJSON && (
              <div className="format-hint" style={{ lineHeight: 1.6 }}>
                Gợi ý có thể gửi cho AI:
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>{`Hãy tạo một danh sách từ vựng tiếng Nhật trình độ N5.
- Trả về dạng text, mỗi dòng một từ.
- Không giải thích thêm.
- Format mỗi dòng:
  kanji=hiragana=nghĩa_tiếng_Việt
  hoặc nếu không có kanji: hiragana=nghĩa_tiếng_Việt

Ví dụ:
学生=がくせい=sinh viên
先生=せんせい=giáo viên
ありがとう=ありがとう=cảm ơn`}</pre>
                Sau đó copy toàn bộ và dán vào ô import hàng loạt từ vựng.
              </div>
            )}
          </div>
        );
      case 'kanji':
        const showKanjiJSON = showJSONHint['kanji'] ?? false;
        return (
          <div className="form-group">
            <label>
              Hướng dẫn JSON/format cho AI (Kanji)
              <button
                type="button"
                className="btn-toggle-hint"
                onClick={() => setShowJSONHint({ ...showJSONHint, kanji: !showKanjiJSON })}
              >
                {showKanjiJSON ? '▼ Thu gọn' : '▶ Mở rộng'}
              </button>
            </label>
            {showKanjiJSON && (
              <div className="format-hint" style={{ lineHeight: 1.6 }}>
                Gợi ý:
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>{`Hãy liệt kê một số kanji trình độ N5 liên quan tới chủ đề tôi đưa.
- Trả về dạng text, mỗi dòng một kanji.
- Không giải thích thêm.
- Format mỗi dòng:
  kanji=nghĩa
  hoặc:
  kanji=nghĩa=onyomi1|onyomi2=kunyomi1|kunyomi2=số_nét

Ví dụ:
学=Học
校=Trường học
先=Trước, đầu tiên=セン|=さき=6`}</pre>
                Copy kết quả và dán vào ô import hàng loạt Kanji.
              </div>
            )}
          </div>
        );
      case 'grammar':
        const showGrammarJSON = showJSONHint['grammar'] ?? false;
        return (
          <div className="form-group">
            <label>
              Hướng dẫn JSON/format cho AI (Ngữ pháp)
              <button
                type="button"
                className="btn-toggle-hint"
                onClick={() => setShowJSONHint({ ...showJSONHint, grammar: !showGrammarJSON })}
              >
                {showGrammarJSON ? '▼ Thu gọn' : '▶ Mở rộng'}
              </button>
            </label>
            {showGrammarJSON && (
              <div className="format-hint" style={{ lineHeight: 1.6 }}>
                <strong>Gợi ý 1 (JSON đầy đủ - khuyến nghị):</strong>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>{`Hãy tạo các mẫu ngữ pháp tiếng Nhật trình độ N5 cho chủ đề tôi đưa.
- Trả về JSON array, không giải thích thêm.
- Không dùng markdown, chỉ JSON thuần.
- Giữ nguyên tên các key:

[
  {
    "pattern": "〜たいです",
    "meaning": "Muốn làm gì đó",
    "explanation": "Diễn tả mong muốn của người nói. Động từ chuyển sang thể ます rồi bỏ ます, thêm たいです.",
    "examples": [
      {
        "japanese": "コーヒーを飲みたいです。",
        "romaji": "Kōhī o nomitai desu.",
        "translation": "Tôi muốn uống cà phê."
      },
      {
        "japanese": "日本に行きたいです。",
        "romaji": "Nihon ni ikitai desu.",
        "translation": "Tôi muốn đi Nhật Bản."
      }
    ]
  },
  {
    "pattern": "〜てください",
    "meaning": "Hãy làm gì đó",
    "explanation": "Dùng khi nhờ vả, yêu cầu một cách lịch sự. Động từ chuyển sang thể て rồi thêm ください.",
    "examples": [
      {
        "japanese": "窓を開けてください。",
        "romaji": "Mado o akete kudasai.",
        "translation": "Hãy mở cửa sổ."
      },
      {
        "japanese": "静かにしてください。",
        "romaji": "Shizuka ni shite kudasai.",
        "translation": "Hãy giữ yên lặng."
      }
    ]
  }
]`}</pre>
                <strong style={{ marginTop: '1rem', display: 'block' }}>Gợi ý 2 (Format text đơn giản - để import hàng loạt):</strong>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>{`Hãy liệt kê các mẫu ngữ pháp tiếng Nhật trình độ N5 cho chủ đề tôi đưa.
- Trả về dạng text, mỗi dòng một mẫu.
- Không giải thích thêm.
- Format mỗi dòng:
  pattern=nghĩa_tiếng_Việt
  hoặc:
  pattern=nghĩa_tiếng_Việt=giải_thích_ngắn

Ví dụ:
〜たいです=Muốn làm gì đó=Diễn tả mong muốn của người nói
〜てください=Hãy làm gì đó=Dùng khi nhờ vả lịch sự`}</pre>
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', fontSize: '0.875rem' }}>
                  <strong>💡 Lưu ý:</strong> Nếu dùng JSON, bạn có thể copy từng field (pattern, meaning, explanation) và thêm examples vào form. Nếu dùng format text, chỉ có thể import pattern và meaning, cần thêm examples sau.
                </div>
              </div>
            )}
          </div>
        );
      case 'listening':
        return (
          <div className="form-group">
            <label>Hướng dẫn JSON cho AI (Bài nghe + câu hỏi)</label>
            <div className="format-hint" style={{ lineHeight: 1.6 }}>
              Gợi ý:
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>{`Hãy tạo một bài nghe tiếng Nhật trình độ N5.
- Trả về JSON, không giải thích thêm.
- Không cần audio_url (tôi sẽ upload sau), chỉ cần transcript và câu hỏi.
- Cấu trúc JSON:
{
  "title": "Tiêu đề bài nghe",
  "transcript": "Transcript tiếng Nhật (có thể xuống dòng)",
  "questions": [
    {
      "question": "Câu hỏi tiếng Việt hoặc Nhật",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correct_answer": 0
    }
  ]
}`}</pre>
              Bạn có thể copy `title`, `transcript` và từng câu hỏi (A/B/C/D + đáp án đúng) vào form Nghe.
            </div>
          </div>
        );
      case 'games':
        return (
          <div className="form-group">
            <label>Hướng dẫn JSON/format cho AI (Game sắp xếp câu)</label>
            <div className="format-hint" style={{ lineHeight: 1.6 }}>
              Gợi ý 1 (dạng text để import hàng loạt):
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>{`Hãy tạo các câu ví dụ tiếng Nhật trình độ N5, đã được tách sẵn từng từ bằng khoảng trắng.
- Trả về dạng text, mỗi dòng:
  câu_tiếng_Nhật_đã_tách=nghĩa_tiếng_Việt
Ví dụ:
私 は 学生 です=Tôi là học sinh
これは 本 です=Đây là quyển sách`}</pre>
              Gợi ý 2 (JSON chi tiết cho từng câu):
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: '#f9fafb', padding: '0.75rem', borderRadius: '8px' }}>{`{
  "sentence": "私 は 学生 です",
  "translation": "Tôi là học sinh",
  "words": ["私", "は", "学生", "です"],
  "correct_order": [0, 1, 2, 3],
  "hint": "Tôi là học sinh"
}`}</pre>
              Bạn có thể dùng JSON để tham khảo, hoặc dùng dạng text để import hàng loạt.
            </div>
          </div>
        );
      case 'roleplay':
        return (
          <div className="form-group">
            <label>Hướng dẫn JSON cho AI (Roleplay)</label>
            <div className="format-hint" style={{ lineHeight: 1.6 }}>
              Gợi ý gửi cho AI:
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: '#f9fafb', padding: '0.75rem', borderRadius: '8px' }}>{`Hãy tạo 1 kịch bản hội thoại roleplay tiếng Nhật trình độ N5.
- Trả về đúng JSON, không giải thích thêm.
- Không dùng markdown, chỉ JSON thuần.
- Giữ nguyên tên các key:
{
  "title": "Tiêu đề kịch bản",
  "description": "Mô tả ngắn (tiếng Việt hoặc Nhật)",
  "scenario": "Mô tả tình huống roleplay",
  "character_a": "Tên nhân vật A",
  "character_b": "Tên nhân vật B",
  "character_a_script": [
    "Câu 1 của nhân vật A bằng tiếng Nhật",
    "Câu 2 của nhân vật A bằng tiếng Nhật"
  ],
  "character_b_script": [
    "Câu 1 của nhân vật B bằng tiếng Nhật",
    "Câu 2 của nhân vật B bằng tiếng Nhật"
  ],
  "vocabulary_hints": [
    "từ vựng 1 - nghĩa tiếng Việt",
    "từ vựng 2 - nghĩa tiếng Việt"
  ],
  "grammar_points": [
    "mẫu ngữ pháp 1",
    "mẫu ngữ pháp 2"
  ],
  "difficulty": "easy",
  "image_url": ""
}`}</pre>
              Sau khi AI trả JSON, copy nội dung các field vào form Roleplay tương ứng.
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  function getDefaultFormData(type: TabType) {
    switch (type) {
      case 'courses':
        return { level: currentLevel || 'N5', title: '', description: '', language: currentLanguage || 'japanese' };
      case 'lessons':
        const currentCourseLessons = lessons.filter((l: any) => l.course_id === currentCourse?.id);
        const maxNumber = currentCourseLessons.length > 0
          ? Math.max(...currentCourseLessons.map((l: any) => l.lesson_number || 0))
          : 0;
        return {
          course_id: currentCourse?.id || '',
          title: '',
          lesson_number: maxNumber + 1,
          description: '',
          level: currentLevel || currentCourse?.level || 'N5',
          language: currentLanguage || currentCourse?.language || 'japanese'
        };
      case 'vocabulary':
        return { lesson_id: currentLesson?.id || '', word: '', kanji: '', hiragana: '', meaning: '', example: '', example_translation: '', difficulty: 'easy', is_difficult: false, language: currentLanguage || currentCourse?.language || currentLesson?.language || 'japanese' };
      case 'kanji':
        return { lesson_id: currentLesson?.id || '', character: '', meaning: '', onyomi: [], kunyomi: [], stroke_count: 0, examples: [] };
      case 'grammar':
        return { lesson_id: currentLesson?.id || '', pattern: '', meaning: '', explanation: '', examples: [], language: currentLanguage || currentCourse?.language || currentLesson?.language || 'japanese' };
      case 'listening':
        return { lesson_id: currentLesson?.id || '', title: '', audio_url: '', image_url: '', transcript: '', questions: [], language: currentLanguage || currentCourse?.language || currentLesson?.language || 'japanese' };
      case 'games':
        return { lesson_id: currentLesson?.id || '', sentence: '', translation: '', words: [], correct_order: [], hint: '', language: currentLanguage || currentCourse?.language || currentLesson?.language || 'japanese' };
      case 'roleplay':
        return {
          lesson_id: currentLesson?.id || '',
          title: '',
          description: '',
          scenario: '',
          character_a: '',
          character_b: '',
          character_a_script: [],
          character_b_script: [],
          character_a_correct_answers: [],
          character_b_correct_answers: [],
          vocabulary_hints: [],
          grammar_points: [],
          difficulty: 'easy',
          image_url: '',
          enable_scoring: false,
          language: currentLanguage || currentCourse?.language || currentLesson?.language || 'japanese'
        };
      default:
        return {};
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Handle batch import for vocabulary
    if (type === 'vocabulary' && importMode === 'batch' && !item) {
      if (!formData.lesson_id) {
        showToast('⚠️ Vui lòng chọn bài học trước khi import từ vựng. Nếu chưa có bài học, hãy tạo bài học trước.', 'warning');
        return;
      }

      if (batchPreview.length === 0) {
        showToast('⚠️ Vui lòng nhập từ vựng theo format đúng. Xem ví dụ trong form để biết cách nhập.', 'warning');
        return;
      }

      if (batchError) {
        showToast('⚠️ Có lỗi trong format. Vui lòng xem phần "Lỗi" bên dưới và sửa lại. Format đúng: kanji=hiragana=nghĩa hoặc hiragana=nghĩa', 'error');
        return;
      }

      // Convert preview to form data format
      const batchData = batchPreview.map(vocab => {
        if (formData.language === 'chinese') {
          const simplified = vocab.simplified || vocab.word || '';
          const pinyin = vocab.pinyin || '';
          if (!simplified || !pinyin || !vocab.meaning) {
            throw new Error(`Thiếu thông tin: hán tự, pinyin hoặc nghĩa`);
          }
          return {
            lesson_id: formData.lesson_id,
            word: simplified, // word should be simplified hanzi
            character: simplified, // character is simplified hanzi for Chinese
            hiragana: pinyin, // Use pinyin for hiragana field (database compatibility)
            simplified: simplified,
            traditional: vocab.traditional || null,
            pinyin: pinyin,
            meaning: vocab.meaning,
            difficulty: formData.difficulty || 'easy',
            is_difficult: false,
            language: 'chinese',
          };
        } else {
          const hiragana = vocab.hiragana || '';
          if (!hiragana || !vocab.meaning) {
            throw new Error(`Thiếu thông tin: hiragana hoặc nghĩa`);
          }
          return {
            lesson_id: formData.lesson_id,
            word: vocab.word || hiragana,
            character: vocab.kanji || null,
            hiragana: hiragana,
            meaning: vocab.meaning,
            difficulty: formData.difficulty || 'easy',
            is_difficult: false,
            language: 'japanese',
          };
        }
      });

      onSave(batchData);
      return;
    }

    // Handle batch import for kanji
    if (type === 'kanji' && importMode === 'batch' && !item) {
      if (!formData.lesson_id) {
        showToast('⚠️ Vui lòng chọn bài học trước khi import kanji/hán tự. Nếu chưa có bài học, hãy tạo bài học trước.', 'warning');
        return;
      }

      if (batchPreview.length === 0) {
        showToast('⚠️ Vui lòng nhập kanji/hán tự theo format đúng. Xem ví dụ trong form để biết cách nhập.', 'warning');
        return;
      }

      if (batchError) {
        showToast('⚠️ Có lỗi trong format. Vui lòng xem phần "Lỗi" bên dưới và sửa lại. Format đúng: kanji=nghĩa', 'error');
        return;
      }

      // Convert preview to form data format
      const batchData = batchPreview.map(kanji => ({
        lesson_id: formData.lesson_id,
        character: kanji.character,
        meaning: kanji.meaning,
        onyomi: kanji.onyomi || [],
        kunyomi: kanji.kunyomi || [],
        stroke_count: kanji.stroke_count,
      }));

      onSave(batchData);
      return;
    }

    // Handle batch import for grammar
    if (type === 'grammar' && importMode === 'batch' && !item) {
      if (!formData.lesson_id) {
        showToast('⚠️ Vui lòng chọn bài học trước khi import ngữ pháp. Nếu chưa có bài học, hãy tạo bài học trước.', 'warning');
        return;
      }

      if (batchPreview.length === 0) {
        showToast('⚠️ Vui lòng nhập ngữ pháp theo format đúng. Xem ví dụ trong form để biết cách nhập.', 'warning');
        return;
      }

      if (batchError) {
        showToast('⚠️ Có lỗi trong format. Vui lòng xem phần "Lỗi" bên dưới và sửa lại. Format đúng: pattern=nghĩa', 'error');
        return;
      }

      // Convert preview to form data format
      const batchData = batchPreview.map((grammar: any) => {
        // Map examples to correct format for database
        let examples = [];
        if (grammar.examples && Array.isArray(grammar.examples)) {
          examples = grammar.examples.map((ex: any) => {
            // Ensure examples have correct field names for database
            return {
              japanese: ex.japanese || ex.chinese || '', // Support both japanese and chinese
              romaji: ex.romaji || ex.pinyin || '', // Support both romaji and pinyin
              translation: ex.translation || ''
            };
          }).filter((ex: any) => ex.japanese && ex.translation); // Filter out invalid examples
        }

        return {
          lesson_id: formData.lesson_id,
          pattern: grammar.pattern || '',
          meaning: grammar.meaning || '',
          explanation: grammar.explanation || '',
          examples: examples,
          language: formData.language || 'japanese',
        };
      });

      onSave(batchData);
      return;
    }

    // Handle batch import for sentence games (sắp xếp câu)
    if (type === 'games' && importMode === 'batch' && !item) {
      if (!formData.lesson_id) {
        showToast('⚠️ Vui lòng chọn bài học trước khi import game. Nếu chưa có bài học, hãy tạo bài học trước.', 'warning');
        return;
      }

      if (batchPreview.length === 0) {
        showToast('⚠️ Vui lòng nhập danh sách câu theo format đúng. Xem ví dụ trong form để biết cách nhập.', 'warning');
        return;
      }

      if (batchError) {
        showToast('⚠️ Có lỗi trong format. Vui lòng xem phần "Lỗi" bên dưới và sửa lại. Format đúng: câu_đã_tách_từ=nghĩa', 'error');
        return;
      }

      const batchData = batchPreview.map((game) => ({
        lesson_id: formData.lesson_id,
        sentence: game.sentence,
        translation: game.translation,
        words: game.words,
        correct_order: game.correct_order,
        hint: '',
      }));

      onSave(batchData);
      return;
    }

    // Process form data based on type
    let processedData = { ...formData };

    // Process vocabulary fields for Chinese
    if (type === 'vocabulary' && formData.language === 'chinese') {
      // Map form fields to database fields for Chinese
      const simplified = formData.word || '';
      const pinyin = formData.hiragana || ''; // pinyin is stored in hiragana field in form
      const traditional = formData.kanji || null; // traditional hanzi (stored in kanji field in form)

      processedData.word = simplified;
      processedData.character = simplified; // character is simplified hanzi for Chinese
      processedData.hiragana = pinyin; // Use pinyin for hiragana field (database compatibility)
      processedData.simplified = simplified;
      processedData.traditional = traditional;
      processedData.pinyin = pinyin;
      // Remove Japanese-specific fields
      delete processedData.kanji;
    }

    if (type === 'kanji' && typeof formData.onyomi === 'string') {
      processedData.onyomi = formData.onyomi.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'kanji' && typeof formData.kunyomi === 'string') {
      processedData.kunyomi = formData.kunyomi.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'games' && typeof formData.words === 'string') {
      processedData.words = formData.words.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'games' && typeof formData.correct_order === 'string') {
      processedData.correct_order = formData.correct_order.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
    }
    if (type === 'roleplay' && typeof formData.character_a_script === 'string') {
      processedData.character_a_script = formData.character_a_script.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'roleplay' && typeof formData.character_b_script === 'string') {
      processedData.character_b_script = formData.character_b_script.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'roleplay' && typeof formData.vocabulary_hints === 'string') {
      processedData.vocabulary_hints = formData.vocabulary_hints.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'roleplay' && typeof formData.grammar_points === 'string') {
      processedData.grammar_points = formData.grammar_points.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    if (item) {
      onSave(item.id, processedData);
    } else {
      onSave(processedData);
    }
  };

  const addExample = (type: 'kanji' | 'grammar') => {
    if (type === 'kanji') {
      setFormData({
        ...formData,
        examples: [...(formData.examples || []), { word: '', reading: '', meaning: '' }]
      });
    } else {
      setFormData({
        ...formData,
        examples: [...(formData.examples || []), { japanese: '', romaji: '', translation: '' }]
      });
    }
  };


  // Keyboard shortcuts for form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Ctrl/Cmd + S to save even when in input
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
        if (ctrlKey && e.key === 's') {
          e.preventDefault();
          const form = document.querySelector('.modal-content form') as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S: Lưu
      if (ctrlKey && e.key === 's') {
        e.preventDefault();
        const form = document.querySelector('.modal-content form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }

      // Esc: Hủy
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{item ? 'Sửa' : 'Thêm mới'} {getTypeLabel(type)}</h2>
        <form onSubmit={handleSubmit}>
          {renderAIPromptHint()}
          {type === 'courses' && (
            <>
              <div className="form-group">
                <label>
                  Ngôn ngữ *
                </label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value;
                    setFormData({
                      ...formData,
                      language: newLanguage,
                      level: newLanguage === 'japanese' ? 'N5' : 'HSK1'
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  Cấp độ *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  required
                >
                  {(formData.language === 'chinese') ? (
                    <>
                      <option value="HSK1">HSK1</option>
                      <option value="HSK2">HSK2</option>
                      <option value="HSK3">HSK3</option>
                      <option value="HSK4">HSK4</option>
                      <option value="HSK5">HSK5</option>
                      <option value="HSK6">HSK6</option>
                    </>
                  ) : (
                    <>
                      <option value="N5">N5</option>
                      <option value="N4">N4</option>
                      <option value="N3">N3</option>
                      <option value="N2">N2</option>
                      <option value="N1">N1</option>
                    </>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ví dụ: Tiếng Nhật N5 - Cơ bản"
                />
              </div>
              <div className="form-group">
                <label>
                  Mô tả
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Ví dụ: Khóa học dành cho người mới bắt đầu học tiếng Nhật, bao gồm các bài học cơ bản về chào hỏi, giới thiệu bản thân..."
                />
              </div>
            </>
          )}

          {type === 'lessons' && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value;
                    setFormData({
                      ...formData,
                      language: newLanguage,
                      level: newLanguage === 'japanese' ? 'N5' : 'HSK1',
                      course_id: '' // Reset course selection when language changes
                    });
                  }}
                  required
                  disabled={!!currentLanguage}
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Khóa học *</label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  required
                  disabled={!!currentCourse}
                >
                  <option value="">Chọn khóa học</option>
                  {courses
                    .filter((c: any) => c.language === (formData.language || 'japanese'))
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>{c.title} ({c.level})</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Bài số mấy *</label>
                <input
                  type="number"
                  value={formData.lesson_number}
                  onChange={(e) => setFormData({ ...formData, lesson_number: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Cấp độ *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  required
                  disabled={!!currentLevel || !!currentCourse}
                >
                  {(formData.language === 'chinese') ? (
                    <>
                      <option value="HSK1">HSK1</option>
                      <option value="HSK2">HSK2</option>
                      <option value="HSK3">HSK3</option>
                      <option value="HSK4">HSK4</option>
                      <option value="HSK5">HSK5</option>
                      <option value="HSK6">HSK6</option>
                    </>
                  ) : (
                    <>
                      <option value="N5">N5</option>
                      <option value="N4">N4</option>
                      <option value="N3">N3</option>
                      <option value="N2">N2</option>
                      <option value="N1">N1</option>
                    </>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </>
          )}

          {type === 'vocabulary' && !item && (
            <div className="form-group">
              <label>Chế độ thêm</label>
              <div className="import-mode-selector">
                <button
                  type="button"
                  className={`mode-btn ${importMode === 'single' ? 'active' : ''}`}
                  onClick={() => {
                    setImportMode('single');
                    setBatchText('');
                    setBatchPreview([]);
                    setBatchError(null);
                  }}
                >
                  ➕ Thêm từng từ
                </button>
                <button
                  type="button"
                  className={`mode-btn ${importMode === 'batch' ? 'active' : ''}`}
                  onClick={() => {
                    setImportMode('batch');
                    setFormData({ ...formData, word: '', kanji: '', hiragana: '', meaning: '' });
                  }}
                >
                  📋 Import hàng loạt
                </button>
              </div>
            </div>
          )}

          {type === 'vocabulary' && importMode === 'single' && (
            <>
              <div className="form-group">
                <label>
                  Ngôn ngữ *
                </label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({
                      ...formData,
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  Bài học *
                </label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      // Filter lessons by language
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
                {lessons.filter((l: any) => {
                  const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                  return lessonCourse?.language === (formData.language || 'japanese');
                }).length === 0 && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--warning-light)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--warning-color)' }}>
                      ⚠️ Chưa có bài học nào cho ngôn ngữ này. Hãy tạo bài học trước!
                    </div>
                  )}
              </div>

              {formData.language === 'chinese' ? (
                <>
                  <div className="form-group">
                    <label>Hán tự giản thể (简体) *</label>
                    <input
                      type="text"
                      value={formData.word}
                      onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                      required
                      placeholder="你好"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hán tự phồn thể (繁體)</label>
                    <input
                      type="text"
                      value={formData.kanji || ''}
                      onChange={(e) => setFormData({ ...formData, kanji: e.target.value })}
                      placeholder="你好 (để trống nếu giống giản thể)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pinyin (拼音) *</label>
                    <input
                      type="text"
                      value={formData.hiragana}
                      onChange={(e) => setFormData({ ...formData, hiragana: e.target.value })}
                      required
                      placeholder="nǐ hǎo"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Từ (Hiragana) *</label>
                    <input
                      type="text"
                      value={formData.word}
                      onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                      required
                      placeholder="こんにちは"
                    />
                  </div>
                  <div className="form-group">
                    <label>Kanji (漢字)</label>
                    <input
                      type="text"
                      value={formData.kanji || ''}
                      onChange={(e) => setFormData({ ...formData, kanji: e.target.value })}
                      placeholder="今日は"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hiragana (ひらがな) *</label>
                    <input
                      type="text"
                      value={formData.hiragana}
                      onChange={(e) => setFormData({ ...formData, hiragana: e.target.value })}
                      required
                      placeholder="こんにちは"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Nghĩa *</label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ví dụ</label>
                <input
                  type="text"
                  value={formData.example || ''}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Dịch ví dụ</label>
                <input
                  type="text"
                  value={formData.example_translation || ''}
                  onChange={(e) => setFormData({ ...formData, example_translation: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Độ khó / Mức độ ưu tiên</label>
                <div className="difficulty-selector">
                  <button
                    type="button"
                    className={`diff-option easy ${formData.difficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'easy' })}
                  >
                    <span className="diff-emoji">🌱</span>
                    <span>Dễ</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-option medium ${formData.difficulty === 'medium' || !formData.difficulty ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'medium' })}
                  >
                    <span className="diff-emoji">🌿</span>
                    <span>Thường</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-option hard ${formData.difficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'hard' })}
                  >
                    <span className="diff-emoji">🌳</span>
                    <span>Khó</span>
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '2rem' }}>
                <label className={`modern-checkbox-card ${formData.is_difficult ? 'active' : ''}`}>
                  <div className="modern-checkbox-content">
                    <span className="modern-checkbox-title">🚨 Từ vựng quan trọng / khó</span>
                    <span className="modern-checkbox-desc">Đánh dấu để ưu tiên ôn tập thường xuyên hơn</span>
                  </div>
                  <div className="modern-switch">
                    <input
                      type="checkbox"
                      checked={formData.is_difficult || false}
                      onChange={(e) => setFormData({ ...formData, is_difficult: e.target.checked })}
                    />
                    <span className="modern-slider"></span>
                  </div>
                </label>
              </div>
            </>
          )}

          {type === 'vocabulary' && importMode === 'batch' && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({
                      ...formData,
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                  disabled={!!currentLanguage}
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                  disabled={!!currentLesson}
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      // Filter lessons by language
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Nhập từ vựng (mỗi dòng một từ) *
                  <span className="format-hint">
                    {formData.language === 'chinese' ? (
                      <>Format: <code>hanzi=pinyin=nghĩa</code> hoặc <code>hanzi_phồn_thể=hanzi_giản_thể=pinyin=nghĩa</code></>
                    ) : (
                      <>Format: <code>kanji=hiragana=nghĩa</code> hoặc <code>hiragana=nghĩa</code></>
                    )}
                  </span>
                </label>
                <textarea
                  className="batch-input"
                  value={batchText}
                  onChange={(e) => {
                    setBatchText(e.target.value);
                    const { vocabularies, errors } = parseVocabularyBatch(e.target.value, formData.language || 'japanese');
                    setBatchPreview(vocabularies);
                    setBatchError(errors.length > 0 ? errors.join('\n') : null);
                  }}
                  placeholder={formData.language === 'chinese' ?
                    `你好=nǐ hǎo=Xin chào
谢谢=xiè xie=Cảm ơn
再见=zài jiàn=Tạm biệt
学习=xué xí=Học tập` :
                    `私=わたし=Tôi
学生=がくせい=Học sinh
こんにちは=Xin chào (ban ngày)
はじめまして=Lần đầu gặp mặt`}
                  rows={10}
                  required
                />
                <div className="format-example">
                  <strong>Ví dụ {formData.language === 'chinese' ? 'tiếng Trung' : 'tiếng Nhật'}:</strong>
                  <pre>{formData.language === 'chinese' ?
                    `你好=nǐ hǎo=Xin chào
谢谢=xiè xie=Cảm ơn
再见=zài jiàn=Tạm biệt
学习=xué xí=Học tập` :
                    `私=わたし=Tôi
学生=がくせい=Học sinh
こんにちは=Xin chào
はじめまして=Lần đầu gặp mặt`}</pre>
                </div>
              </div>

              {batchError && (
                <div className="error-message">
                  <strong>⚠️ Lỗi:</strong>
                  <pre>{batchError}</pre>
                </div>
              )}

              {batchPreview.length > 0 && !batchError && (
                <div className="batch-preview">
                  <div className="preview-header">
                    <strong>✅ Preview ({batchPreview.length} từ vựng):</strong>
                  </div>
                  <div className="preview-list">
                    {batchPreview.map((vocab, idx) => (
                      <div key={idx} className="preview-item">
                        <span className="preview-kanji">
                          {formData.language === 'chinese' ?
                            (vocab.traditional ? `${vocab.traditional} / ${vocab.simplified || vocab.word}` : (vocab.simplified || vocab.word)) :
                            (vocab.kanji || '-')}
                        </span>
                        <span className="preview-hiragana">
                          {formData.language === 'chinese' ? (vocab.pinyin || '-') : (vocab.hiragana || '-')}
                        </span>
                        <span className="preview-meaning">{vocab.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Độ khó mặc định</label>
                <div className="difficulty-selector">
                  <button
                    type="button"
                    className={`diff-option easy ${formData.difficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'easy' })}
                  >
                    <span className="diff-emoji">🌱</span>
                    <span>Dễ</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-option medium ${formData.difficulty === 'medium' || !formData.difficulty ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'medium' })}
                  >
                    <span className="diff-emoji">🌿</span>
                    <span>Thường</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-option hard ${formData.difficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'hard' })}
                  >
                    <span className="diff-emoji">🌳</span>
                    <span>Khó</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {type === 'vocabulary' && item && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map((l: any) => {
                    const course = courses.find((c: any) => c.id === l.course_id);
                    return (
                      <option key={l.id} value={l.id}>
                        {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>Từ (Hiragana) *</label>
                <input
                  type="text"
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Kanji</label>
                <input
                  type="text"
                  value={formData.kanji || ''}
                  onChange={(e) => setFormData({ ...formData, kanji: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Hiragana *</label>
                <input
                  type="text"
                  value={formData.hiragana}
                  onChange={(e) => setFormData({ ...formData, hiragana: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nghĩa *</label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ví dụ</label>
                <input
                  type="text"
                  value={formData.example || ''}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Dịch ví dụ</label>
                <input
                  type="text"
                  value={formData.example_translation || ''}
                  onChange={(e) => setFormData({ ...formData, example_translation: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Độ khó / Mức độ ưu tiên</label>
                <div className="difficulty-selector">
                  <button
                    type="button"
                    className={`diff-option easy ${formData.difficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'easy' })}
                  >
                    <span className="diff-emoji">🌱</span>
                    <span>Dễ</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-option medium ${formData.difficulty === 'medium' || !formData.difficulty ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'medium' })}
                  >
                    <span className="diff-emoji">🌿</span>
                    <span>Thường</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-option hard ${formData.difficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'hard' })}
                  >
                    <span className="diff-emoji">🌳</span>
                    <span>Khó</span>
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '2rem' }}>
                <label className={`modern-checkbox-card ${formData.is_difficult ? 'active' : ''}`}>
                  <div className="modern-checkbox-content">
                    <span className="modern-checkbox-title">🚨 Từ vựng quan trọng / khó</span>
                    <span className="modern-checkbox-desc">Đánh dấu để ưu tiên ôn tập thường xuyên hơn</span>
                  </div>
                  <div className="modern-switch">
                    <input
                      type="checkbox"
                      checked={formData.is_difficult || false}
                      onChange={(e) => setFormData({ ...formData, is_difficult: e.target.checked })}
                    />
                    <span className="modern-slider"></span>
                  </div>
                </label>
              </div>
            </>
          )}

          {type === 'kanji' && !item && (
            <div className="form-group">
              <label>Chế độ thêm</label>
              <div className="import-mode-selector">
                <button
                  type="button"
                  className={`mode-btn ${importMode === 'single' ? 'active' : ''}`}
                  onClick={() => {
                    setImportMode('single');
                    setBatchText('');
                    setBatchPreview([]);
                    setBatchError(null);
                  }}
                >
                  ➕ Thêm từng kanji
                </button>
                <button
                  type="button"
                  className={`mode-btn ${importMode === 'batch' ? 'active' : ''}`}
                  onClick={() => {
                    setImportMode('batch');
                    setFormData({ ...formData, character: '', meaning: '', onyomi: [], kunyomi: [] });
                  }}
                >
                  📋 Import hàng loạt
                </button>
              </div>
            </div>
          )}

          {type === 'kanji' && importMode === 'single' && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map((l: any) => {
                    const course = courses.find((c: any) => c.id === l.course_id);
                    return (
                      <option key={l.id} value={l.id}>
                        {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>Kanji *</label>
                <input
                  type="text"
                  value={formData.character}
                  onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                  required
                  maxLength={1}
                />
              </div>
              <div className="form-group">
                <label>Nghĩa *</label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Âm On (音読み) - cách nhau bằng dấu phẩy</label>
                <input
                  type="text"
                  value={Array.isArray(formData.onyomi) ? formData.onyomi.join(', ') : formData.onyomi || ''}
                  onChange={(e) => setFormData({ ...formData, onyomi: e.target.value })}
                  placeholder="シ, ジ"
                />
              </div>
              <div className="form-group">
                <label>Âm Kun (訓読み) - cách nhau bằng dấu phẩy</label>
                <input
                  type="text"
                  value={Array.isArray(formData.kunyomi) ? formData.kunyomi.join(', ') : formData.kunyomi || ''}
                  onChange={(e) => setFormData({ ...formData, kunyomi: e.target.value })}
                  placeholder="わたし, わたくし"
                />
              </div>
              <div className="form-group">
                <label>Số nét</label>
                <input
                  type="number"
                  value={formData.stroke_count || 0}
                  onChange={(e) => setFormData({ ...formData, stroke_count: parseInt(e.target.value) })}
                />
              </div>
            </>
          )}

          {type === 'kanji' && importMode === 'batch' && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map((l: any) => {
                    const course = courses.find((c: any) => c.id === l.course_id);
                    return (
                      <option key={l.id} value={l.id}>
                        {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Nhập kanji (mỗi dòng một kanji) *
                  <span className="format-hint">
                    Format: <code>kanji=nghĩa</code> hoặc <code>kanji=nghĩa=onyomi|kunyomi=số_nét</code>
                  </span>
                </label>
                <textarea
                  className="batch-input"
                  value={batchText}
                  onChange={(e) => {
                    setBatchText(e.target.value);
                    const { kanjis, errors } = parseKanjiBatch(e.target.value);
                    setBatchPreview(kanjis);
                    setBatchError(errors.length > 0 ? errors.join('\n') : null);
                  }}
                  placeholder={`私=Tôi, riêng tư
学=Học
生=Sinh sống, sống
時=Thời gian, giờ`}
                  rows={10}
                  required
                />
                <div className="format-example">
                  <strong>Ví dụ:</strong>
                  <pre>{`私=Tôi, riêng tư
学=Học
生=Sinh sống, sống
時=Thời gian, giờ

Hoặc với đọc âm:
私=Tôi, riêng tư=シ|わたし=7
学=Học=ガク|まなぶ=8`}</pre>
                </div>
              </div>

              {batchError && (
                <div className="error-message">
                  <strong>⚠️ Lỗi:</strong>
                  <pre>{batchError}</pre>
                </div>
              )}

              {batchPreview.length > 0 && !batchError && (
                <div className="batch-preview">
                  <div className="preview-header">
                    <strong>✅ Preview ({batchPreview.length} kanji):</strong>
                  </div>
                  <div className="preview-list">
                    {batchPreview.map((kanji, idx) => (
                      <div key={idx} className="preview-item kanji-preview-item">
                        <span className="preview-kanji">{kanji.character}</span>
                        <span className="preview-meaning">{kanji.meaning}</span>
                        <div className="preview-details">
                          <div>On: {kanji.onyomi.length > 0 ? kanji.onyomi.join(', ') : '-'}</div>
                          <div>Kun: {kanji.kunyomi.length > 0 ? kanji.kunyomi.join(', ') : '-'}</div>
                          {kanji.stroke_count && <div>Nét: {kanji.stroke_count}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {type === 'kanji' && item && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map((l: any) => {
                    const course = courses.find((c: any) => c.id === l.course_id);
                    return (
                      <option key={l.id} value={l.id}>
                        {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>Kanji *</label>
                <input
                  type="text"
                  value={formData.character}
                  onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                  required
                  maxLength={1}
                />
              </div>
              <div className="form-group">
                <label>Nghĩa *</label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Âm On (音読み) - cách nhau bằng dấu phẩy</label>
                <input
                  type="text"
                  value={Array.isArray(formData.onyomi) ? formData.onyomi.join(', ') : formData.onyomi || ''}
                  onChange={(e) => setFormData({ ...formData, onyomi: e.target.value })}
                  placeholder="シ, ジ"
                />
              </div>
              <div className="form-group">
                <label>Âm Kun (訓読み) - cách nhau bằng dấu phẩy</label>
                <input
                  type="text"
                  value={Array.isArray(formData.kunyomi) ? formData.kunyomi.join(', ') : formData.kunyomi || ''}
                  onChange={(e) => setFormData({ ...formData, kunyomi: e.target.value })}
                  placeholder="わたし, わたくし"
                />
              </div>
              <div className="form-group">
                <label>Số nét</label>
                <input
                  type="number"
                  value={formData.stroke_count || 0}
                  onChange={(e) => setFormData({ ...formData, stroke_count: parseInt(e.target.value) })}
                />
              </div>
            </>
          )}

          {type === 'grammar' && !item && (
            <div className="form-group">
              <label>Chế độ thêm</label>
              <div className="import-mode-selector">
                <button
                  type="button"
                  className={`mode-btn ${importMode === 'single' ? 'active' : ''}`}
                  onClick={() => {
                    setImportMode('single');
                    setBatchText('');
                    setBatchPreview([]);
                    setBatchError(null);
                  }}
                >
                  ➕ Thêm từng mẫu câu
                </button>
                <button
                  type="button"
                  className={`mode-btn ${importMode === 'batch' ? 'active' : ''}`}
                  onClick={() => {
                    setImportMode('batch');
                    setFormData({ ...formData, pattern: '', meaning: '', explanation: '' });
                  }}
                >
                  📋 Import hàng loạt
                </button>
              </div>
            </div>
          )}

          {type === 'grammar' && importMode === 'single' && !item && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({
                      ...formData,
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label>Mẫu câu *</label>
                <input
                  type="text"
                  value={formData.pattern}
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nghĩa *</label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                  style={{ fontSize: '1rem', fontWeight: '600', padding: '0.75rem', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="form-group">
                <label>Giải thích</label>
                <textarea
                  value={formData.explanation || ''}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows={3}
                  placeholder="Giải thích chi tiết cách dùng mẫu ngữ pháp này..."
                />
              </div>
              <div className="form-group">
                <label>
                  Ví dụ
                  <button
                    type="button"
                    onClick={() => {
                      const language = formData.language || 'japanese';
                      const exampleFormat = language === 'chinese'
                        ? `[\n  {\n    "chinese": "我正在学习中文。",\n    "pinyin": "Wǒ zhèngzài xuéxí Zhōngwén.",\n    "translation": "Tôi đang học tiếng Trung."\n  }\n]`
                        : `[\n  {\n    "japanese": "コーヒーを飲みたいです。",\n    "romaji": "Kōhī o nomitai desu.",\n    "translation": "Tôi muốn uống cà phê."\n  }\n]`;
                      const jsonText = prompt(`Dán JSON examples (array) cho ${language === 'chinese' ? 'tiếng Trung' : 'tiếng Nhật'}:\n\n${exampleFormat}`);
                      if (jsonText) {
                        try {
                          const parsed = JSON.parse(jsonText);
                          const examplesArray = Array.isArray(parsed) ? parsed : [parsed];
                          const mappedExamples = examplesArray.map((ex: any) => {
                            if (language === 'chinese') {
                              return {
                                japanese: ex.chinese || ex.japanese || '',
                                romaji: ex.pinyin || ex.romaji || '',
                                translation: ex.translation || ''
                              };
                            } else {
                              return {
                                japanese: ex.japanese || '',
                                romaji: ex.romaji || '',
                                translation: ex.translation || ''
                              };
                            }
                          }).filter((ex: any) => ex.japanese && ex.translation);
                          setFormData({ ...formData, examples: [...(formData.examples || []), ...mappedExamples] });
                          showToast(`Đã thêm ${mappedExamples.length} ví dụ!`, 'success');
                        } catch (err) {
                          showToast('Lỗi parse JSON. Vui lòng kiểm tra lại format.', 'error');
                        }
                      }
                    }}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    📥 Import JSON
                  </button>
                </label>
                <div style={{ marginTop: '0.5rem' }}>
                  {(formData.examples || []).map((ex: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Ví dụ {idx + 1}</strong>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples.splice(idx, 1);
                            setFormData({ ...formData, examples: newExamples });
                          }}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label>{formData.language === 'chinese' ? 'Câu tiếng Trung' : 'Câu tiếng Nhật'}</label>
                        <input
                          type="text"
                          value={ex.japanese || ''}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[idx] = { ...newExamples[idx], japanese: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          placeholder={formData.language === 'chinese' ? '我正在学习中文。' : '今日は暑いです'}
                          style={{ fontFamily: formData.language === 'chinese' ? '"Noto Sans SC", sans-serif' : '"Noto Sans JP", sans-serif' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label>{formData.language === 'chinese' ? 'Pinyin' : 'Romaji'} (tùy chọn)</label>
                        <input
                          type="text"
                          value={ex.romaji || ''}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[idx] = { ...newExamples[idx], romaji: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          placeholder={formData.language === 'chinese' ? 'Wǒ zhèngzài xuéxí Zhōngwén.' : 'Kyou wa atsui desu'}
                        />
                      </div>
                      <div className="form-group">
                        <label>Dịch tiếng Việt</label>
                        <input
                          type="text"
                          value={ex.translation || ''}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[idx] = { ...newExamples[idx], translation: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          placeholder="Hôm nay nóng"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => addExample('grammar')}
                  >
                    ➕ Thêm ví dụ
                  </button>
                </div>
              </div>
            </>
          )}

          {type === 'grammar' && importMode === 'batch' && !item && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({
                      ...formData,
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Nhập ngữ pháp *
                  <span className="format-hint" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <strong>Format 1 (JSON - khuyến nghị):</strong> Dán JSON array với đầy đủ pattern, meaning, explanation và examples. Xem hướng dẫn JSON ở trên.
                    <br />
                    <strong>Format 2 (Text đơn giản):</strong> Mỗi dòng một mẫu: <code>pattern=nghĩa</code> hoặc <code>pattern=nghĩa=giải_thích</code>
                  </span>
                </label>
                <textarea
                  className="batch-input"
                  value={batchText}
                  onChange={(e) => {
                    const text = e.target.value;
                    setBatchText(text);

                    // Try to parse as JSON first
                    const trimmedText = text.trim();
                    if (trimmedText.startsWith('[') || trimmedText.startsWith('{')) {
                      try {
                        const json = JSON.parse(trimmedText);
                        const jsonArray = Array.isArray(json) ? json : [json];
                        const language = formData.language || 'japanese';
                        const grammars = jsonArray.map((item: any) => {
                          // Map examples based on language
                          let examples = [];
                          if (item.examples && Array.isArray(item.examples)) {
                            examples = item.examples.map((ex: any) => {
                              if (language === 'chinese') {
                                // Chinese format: chinese -> japanese, pinyin -> romaji
                                return {
                                  japanese: ex.chinese || ex.japanese || '',
                                  romaji: ex.pinyin || ex.romaji || '',
                                  translation: ex.translation || ''
                                };
                              } else {
                                // Japanese format: keep as is
                                return {
                                  japanese: ex.japanese || '',
                                  romaji: ex.romaji || '',
                                  translation: ex.translation || ''
                                };
                              }
                            });
                          }
                          return {
                            pattern: item.pattern || '',
                            meaning: item.meaning || '',
                            explanation: item.explanation || '',
                            examples: examples
                          };
                        });
                        setBatchPreview(grammars);
                        setBatchError(null);
                        return;
                      } catch (err) {
                        // If JSON parse fails, fall back to text format
                      }
                    }

                    // Parse as text format
                    const { grammars, errors } = parseGrammarBatch(text);
                    setBatchPreview(grammars);
                    setBatchError(errors.length > 0 ? errors.join('\n') : null);
                  }}
                  placeholder={`です=Là (cách nói lịch sự)
ます=Động từ thể lịch sự
ません=Phủ định thể lịch sự`}
                  rows={10}
                  required
                />
                <div className="format-example">
                  <strong>Ví dụ Format 2 (Text):</strong>
                  <pre>{`です=Là (cách nói lịch sự)
ます=Động từ thể lịch sự
ません=Phủ định thể lịch sự`}</pre>
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.875rem' }}>
                    <strong>💡 Lưu ý:</strong> Để import đầy đủ cả examples, hãy dùng Format 1 (JSON). Format 2 chỉ import pattern, meaning và explanation.
                  </div>
                </div>
              </div>

              {batchError && (
                <div className="error-message">
                  <strong>⚠️ Lỗi:</strong>
                  <pre>{batchError}</pre>
                </div>
              )}

              {batchPreview.length > 0 && !batchError && (
                <div className="batch-preview">
                  <div className="preview-header">
                    <strong>✅ Preview ({batchPreview.length} ngữ pháp):</strong>
                  </div>
                  <div className="preview-list">
                    {batchPreview.map((grammar: any, idx: number) => (
                      <div key={idx} className="preview-item grammar-preview-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center' }}>
                          <span className="preview-pattern" style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--primary-color)' }}>{grammar.pattern}</span>
                          <span className="preview-meaning" style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{grammar.meaning}</span>
                        </div>
                        {grammar.explanation && (
                          <span className="preview-explanation" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{grammar.explanation}</span>
                        )}
                        <div style={{ marginTop: '0.5rem', width: '100%' }}>
                          {grammar.examples && Array.isArray(grammar.examples) && grammar.examples.length > 0 ? (
                            <div style={{ padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Ví dụ ({grammar.examples.length}):</strong>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const jsonText = prompt(`Dán JSON examples cho "${grammar.pattern}":\n\n${formData.language === 'chinese'
                                      ? `[\n  {\n    "chinese": "我正在学习中文。",\n    "pinyin": "Wǒ zhèngzài xuéxí Zhōngwén.",\n    "translation": "Tôi đang học tiếng Trung."\n  }\n]`
                                      : `[\n  {\n    "japanese": "コーヒーを飲みたいです。",\n    "romaji": "Kōhī o nomitai desu.",\n    "translation": "Tôi muốn uống cà phê."\n  }\n]`}`);
                                    if (jsonText) {
                                      try {
                                        const parsed = JSON.parse(jsonText);
                                        const examplesArray = Array.isArray(parsed) ? parsed : [parsed];
                                        const language = formData.language || 'japanese';
                                        const mappedExamples = examplesArray.map((ex: any) => {
                                          if (language === 'chinese') {
                                            return {
                                              japanese: ex.chinese || ex.japanese || '',
                                              romaji: ex.pinyin || ex.romaji || '',
                                              translation: ex.translation || ''
                                            };
                                          } else {
                                            return {
                                              japanese: ex.japanese || '',
                                              romaji: ex.romaji || '',
                                              translation: ex.translation || ''
                                            };
                                          }
                                        }).filter((ex: any) => ex.japanese && ex.translation);

                                        const newPreview = [...batchPreview];
                                        newPreview[idx] = { ...newPreview[idx], examples: [...(grammar.examples || []), ...mappedExamples] };
                                        setBatchPreview(newPreview);
                                        showToast(`Đã thêm ${mappedExamples.length} ví dụ cho "${grammar.pattern}"!`, 'success');
                                      } catch (err) {
                                        showToast('Lỗi parse JSON. Vui lòng kiểm tra lại format.', 'error');
                                      }
                                    }
                                  }}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.7rem',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }}
                                >
                                  ➕ Thêm
                                </button>
                              </div>
                              {grammar.examples.slice(0, 2).map((ex: any, exIdx: number) => (
                                <div key={exIdx} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                  <div style={{ fontFamily: formData.language === 'chinese' ? '"Noto Sans SC", sans-serif' : '"Noto Sans JP", sans-serif', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                    {ex.japanese || ex.chinese || ''}
                                  </div>
                                  {ex.romaji || ex.pinyin ? (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                      {ex.romaji || ex.pinyin}
                                    </div>
                                  ) : null}
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    {ex.translation || ''}
                                  </div>
                                </div>
                              ))}
                              {grammar.examples.length > 2 && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  ... và {grammar.examples.length - 2} ví dụ khác
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-color)', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Chưa có ví dụ</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const jsonText = prompt(`Dán JSON examples cho "${grammar.pattern}":\n\n${formData.language === 'chinese'
                                    ? `[\n  {\n    "chinese": "我正在学习中文。",\n    "pinyin": "Wǒ zhèngzài xuéxí Zhōngwén.",\n    "translation": "Tôi đang học tiếng Trung."\n  }\n]`
                                    : `[\n  {\n    "japanese": "コーヒーを飲みたいです。",\n    "romaji": "Kōhī o nomitai desu.",\n    "translation": "Tôi muốn uống cà phê."\n  }\n]`}`);
                                  if (jsonText) {
                                    try {
                                      const parsed = JSON.parse(jsonText);
                                      const examplesArray = Array.isArray(parsed) ? parsed : [parsed];
                                      const language = formData.language || 'japanese';
                                      const mappedExamples = examplesArray.map((ex: any) => {
                                        if (language === 'chinese') {
                                          return {
                                            japanese: ex.chinese || ex.japanese || '',
                                            romaji: ex.pinyin || ex.romaji || '',
                                            translation: ex.translation || ''
                                          };
                                        } else {
                                          return {
                                            japanese: ex.japanese || '',
                                            romaji: ex.romaji || '',
                                            translation: ex.translation || ''
                                          };
                                        }
                                      }).filter((ex: any) => ex.japanese && ex.translation);

                                      const newPreview = [...batchPreview];
                                      newPreview[idx] = { ...newPreview[idx], examples: mappedExamples };
                                      setBatchPreview(newPreview);
                                      showToast(`Đã thêm ${mappedExamples.length} ví dụ cho "${grammar.pattern}"!`, 'success');
                                    } catch (err) {
                                      showToast('Lỗi parse JSON. Vui lòng kiểm tra lại format.', 'error');
                                    }
                                  }
                                }}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.75rem',
                                  background: 'var(--primary-color)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                              >
                                📥 Import JSON
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {type === 'grammar' && item && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map((l: any) => {
                    const course = courses.find((c: any) => c.id === l.course_id);
                    return (
                      <option key={l.id} value={l.id}>
                        {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>Mẫu câu *</label>
                <input
                  type="text"
                  value={formData.pattern}
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nghĩa *</label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Giải thích</label>
                <textarea
                  value={formData.explanation || ''}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Ví dụ</label>
                <div style={{ marginTop: '0.5rem' }}>
                  {(formData.examples || []).map((ex: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>Ví dụ {idx + 1}</strong>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples.splice(idx, 1);
                            setFormData({ ...formData, examples: newExamples });
                          }}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label>Câu tiếng Nhật</label>
                        <input
                          type="text"
                          value={ex.japanese || ''}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[idx] = { ...newExamples[idx], japanese: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          placeholder="今日は暑いです"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label>Romaji (tùy chọn)</label>
                        <input
                          type="text"
                          value={ex.romaji || ''}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[idx] = { ...newExamples[idx], romaji: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          placeholder="Kyou wa atsui desu"
                        />
                      </div>
                      <div className="form-group">
                        <label>Dịch tiếng Việt</label>
                        <input
                          type="text"
                          value={ex.translation || ''}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[idx] = { ...newExamples[idx], translation: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          placeholder="Hôm nay nóng"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => addExample('grammar')}
                  >
                    ➕ Thêm ví dụ
                  </button>
                </div>
              </div>
            </>
          )}

          {type === 'listening' && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({
                      ...formData,
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Audio File</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Validate file type
                      if (!validateFileType(file, ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'])) {
                        showToast('Chỉ chấp nhận file audio (MP3, WAV, OGG)', 'error');
                        return;
                      }

                      // Validate file size (10MB)
                      if (!validateFileSize(file, 10)) {
                        showToast('File quá lớn. Tối đa 10MB', 'error');
                        return;
                      }

                      setUploadingAudio(true);
                      const result = await uploadAudio(file);
                      setUploadingAudio(false);

                      if (result.error) {
                        showToast('Lỗi upload: ' + result.error, 'error');
                      } else {
                        setFormData({ ...formData, audio_url: result.url });
                        showToast('Upload thành công!', 'success');
                      }
                    }}
                    disabled={uploadingAudio}
                  />
                  {uploadingAudio && <span>Đang upload...</span>}
                </div>
                {formData.audio_url && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    URL: <a href={formData.audio_url} target="_blank" rel="noopener noreferrer">{formData.audio_url}</a>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>URL Audio (hoặc nhập URL trực tiếp)</label>
                <input
                  type="text"
                  value={formData.audio_url || ''}
                  onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label>Image File</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Validate file type
                      if (!validateFileType(file, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'])) {
                        showToast('Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF)', 'error');
                        return;
                      }

                      // Validate file size (5MB)
                      if (!validateFileSize(file, 5)) {
                        showToast('File quá lớn. Tối đa 5MB', 'error');
                        return;
                      }

                      setUploadingImage(true);
                      const result = await uploadImage(file, 'listening');
                      setUploadingImage(false);

                      if (result.error) {
                        showToast('Lỗi upload: ' + result.error, 'error');
                      } else {
                        setFormData({ ...formData, image_url: result.url });
                        showToast('Upload thành công!', 'success');
                      }
                    }}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <span>Đang upload...</span>}
                </div>
                {formData.image_url && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img src={formData.image_url} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }} />
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      URL: <a href={formData.image_url} target="_blank" rel="noopener noreferrer">{formData.image_url}</a>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>URL Image (hoặc nhập URL trực tiếp)</label>
                <input
                  type="text"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label>Transcript *</label>
                <textarea
                  value={formData.transcript}
                  onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                  required
                  rows={5}
                />
              </div>
              {!item && (
                <div className="form-group">
                  <label>Dán JSON từ AI (Bài nghe)</label>
                  <textarea
                    value={aiJsonText}
                    onChange={(e) => setAiJsonText(e.target.value)}
                    rows={4}
                    placeholder='Dán JSON {"title": "...", "transcript": "...", "questions": [...]}'
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ marginTop: '0.5rem' }}
                    onClick={handleParseAiJson}
                  >
                    🔁 Parse JSON vào form
                  </button>
                  {aiJsonStatus && (
                    <div style={{ marginTop: '0.5rem', color: 'var(--success-color)', fontSize: '0.875rem' }}>
                      {aiJsonStatus}
                    </div>
                  )}
                </div>
              )}
              <div className="form-group">
                <label>Câu hỏi (tùy chọn)</label>
                <div style={{ marginTop: '0.5rem' }}>
                  {(formData.questions || []).map((q: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>Câu hỏi {idx + 1}</strong>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            const newQuestions = [...(formData.questions || [])];
                            newQuestions.splice(idx, 1);
                            setFormData({ ...formData, questions: newQuestions });
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                      {(() => {
                        const options = Array.isArray(q.options) ? [...q.options] : [];
                        while (options.length < 4) options.push('');
                        return (
                          <>
                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                              <label>Câu hỏi</label>
                              <input
                                type="text"
                                value={q.question || ''}
                                onChange={(e) => {
                                  const newQuestions = [...(formData.questions || [])];
                                  newQuestions[idx] = { ...newQuestions[idx], question: e.target.value };
                                  setFormData({ ...formData, questions: newQuestions });
                                }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                              <label>Đáp án A / B / C / D</label>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {['A', 'B', 'C', 'D'].map((label, optIdx) => (
                                  <div key={optIdx} className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Đáp án {label}</label>
                                    <input
                                      type="text"
                                      value={options[optIdx] || ''}
                                      onChange={(e) => {
                                        const newQuestions = [...(formData.questions || [])];
                                        const qOptions = Array.isArray(newQuestions[idx].options) ? [...newQuestions[idx].options] : [];
                                        while (qOptions.length < 4) qOptions.push('');
                                        qOptions[optIdx] = e.target.value;
                                        newQuestions[idx] = {
                                          ...newQuestions[idx],
                                          options: qOptions,
                                        };
                                        setFormData({ ...formData, questions: newQuestions });
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Đáp án đúng (A / B / C / D)</label>
                              <select
                                value={q.correct_answer !== undefined ? q.correct_answer : 0}
                                onChange={(e) => {
                                  const newQuestions = [...(formData.questions || [])];
                                  newQuestions[idx] = {
                                    ...newQuestions[idx],
                                    correct_answer: parseInt(e.target.value) || 0
                                  };
                                  setFormData({ ...formData, questions: newQuestions });
                                }}
                              >
                                <option value={0}>A</option>
                                <option value={1}>B</option>
                                <option value={2}>C</option>
                                <option value={3}>D</option>
                              </select>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        questions: [...(formData.questions || []), { question: '', options: [], correct_answer: 0 }]
                      });
                    }}
                  >
                    ➕ Thêm câu hỏi
                  </button>
                </div>
              </div>
            </>
          )}

          {type === 'games' && !item && (
            <>
              <div className="form-group">
                <label>Chế độ thêm</label>
                <div className="import-mode-selector">
                  <button
                    type="button"
                    className={`mode-btn ${importMode === 'single' ? 'active' : ''}`}
                    onClick={() => {
                      setImportMode('single');
                      setBatchText('');
                      setBatchPreview([]);
                      setBatchError(null);
                    }}
                  >
                    ➕ Thêm từng câu
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${importMode === 'batch' ? 'active' : ''}`}
                    onClick={() => {
                      setImportMode('batch');
                      setFormData({ ...formData, sentence: '', translation: '', words: [], correct_order: [] });
                    }}
                  >
                    📋 Import hàng loạt
                  </button>
                </div>
              </div>
            </>
          )}

          {type === 'games' && importMode === 'single' && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({
                      ...formData,
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label>Câu tiếng Nhật *</label>
                <input
                  type="text"
                  value={formData.sentence}
                  onChange={(e) => setFormData({ ...formData, sentence: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Dịch *</label>
                <input
                  type="text"
                  value={formData.translation}
                  onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Các từ (cách nhau bằng dấu phẩy) *</label>
                <input
                  type="text"
                  value={Array.isArray(formData.words) ? formData.words.join(', ') : formData.words || ''}
                  onChange={(e) => setFormData({ ...formData, words: e.target.value })}
                  placeholder="私, は, 学生, です"
                  required
                />
              </div>
              <div className="form-group">
                <label>Thứ tự đúng (số, cách nhau bằng dấu phẩy) *</label>
                <input
                  type="text"
                  value={Array.isArray(formData.correct_order) ? formData.correct_order.join(', ') : formData.correct_order || ''}
                  onChange={(e) => setFormData({ ...formData, correct_order: e.target.value })}
                  placeholder="0, 1, 2, 3"
                  required
                />
              </div>
              <div className="form-group">
                <label>Gợi ý</label>
                <input
                  type="text"
                  value={formData.hint || ''}
                  onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                />
              </div>
              {!item && (
                <div className="form-group">
                  <label>Dán JSON từ AI (1 câu game)</label>
                  <textarea
                    value={aiJsonText}
                    onChange={(e) => setAiJsonText(e.target.value)}
                    rows={4}
                    placeholder='Dán JSON {"sentence": "...", "translation": "...", "words": [...], "correct_order": [...]}'
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ marginTop: '0.5rem' }}
                    onClick={handleParseAiJson}
                  >
                    🔁 Parse JSON vào form
                  </button>
                  {aiJsonStatus && (
                    <div style={{ marginTop: '0.5rem', color: 'var(--success-color)', fontSize: '0.875rem' }}>
                      {aiJsonStatus}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {type === 'games' && importMode === 'batch' && !item && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({
                      ...formData,
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Nhập các câu sắp xếp (mỗi dòng một câu) *
                  <span className="format-hint">
                    Format: <code>câu_tiếng_Nhật=nghĩa_tiếng_Việt</code><br />
                    Lưu ý: hãy tách sẵn câu tiếng Nhật bằng khoảng trắng theo từng từ, ví dụ:
                    <code>私 は 学生 です=Tôi là học sinh</code>
                  </span>
                </label>
                <textarea
                  className="batch-input"
                  value={batchText}
                  onChange={(e) => {
                    setBatchText(e.target.value);
                    const { games, errors } = parseSentenceGameBatch(e.target.value);
                    setBatchPreview(games);
                    setBatchError(errors.length > 0 ? errors.join('\n') : null);
                  }}
                  placeholder={`私 は 学生 です=Tôi là học sinh
これは 本 です=Đây là quyển sách
明日 は 日曜日 です=Ngày mai là chủ nhật`}
                  rows={10}
                  required
                />
                {batchError && (
                  <div className="error-message">
                    <strong>⚠️ Lỗi:</strong>
                    <pre>{batchError}</pre>
                  </div>
                )}
                {batchPreview.length > 0 && !batchError && (
                  <div className="batch-preview">
                    <div className="preview-header">
                      <strong>✅ Preview ({batchPreview.length} câu):</strong>
                    </div>
                    <div className="preview-list">
                      {batchPreview.map((game, idx) => (
                        <div key={idx} className="preview-item">
                          <span className="preview-pattern">{game.sentence}</span>
                          <span className="preview-meaning">{game.translation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {type === 'roleplay' && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({
                      ...formData,
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>

              {!item && (
                <div className="form-group">
                  <label>Template nhanh (dễ)</label>
                  <div className="template-buttons">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          title: 'Chào hỏi lần đầu gặp mặt',
                          description: 'Hội thoại chào hỏi cơ bản khi gặp người mới lần đầu.',
                          scenario: 'Hai người gặp nhau lần đầu trong lớp học tiếng Nhật.',
                          character_a: 'A (Bạn)',
                          character_b: 'B (Bạn mới)',
                          character_a_script: [
                            'はじめまして。わたしは [Tên] です。',
                            'どうぞよろしくおねがいします。'
                          ],
                          character_b_script: [
                            'はじめまして。[Tên] さん。わたしは [Tên bạn B] です。',
                            'こちらこそ、よろしくおねがいします。'
                          ],
                          vocabulary_hints: [
                            'はじめまして - Rất hân hạnh được gặp bạn',
                            'わたしは〜です - Tôi là ~',
                            'どうぞよろしくおねがいします - Rất mong được giúp đỡ'
                          ],
                          grammar_points: ['はじめまして', 'N は N です'],
                          difficulty: 'easy'
                        });
                      }}
                    >
                      👋 Chào hỏi
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          title: 'Gọi món ở quán ăn',
                          description: 'Hội thoại đơn giản khi gọi món ở quán ăn.',
                          scenario: 'Bạn đến một quán ăn và gọi món với nhân viên.',
                          character_a: 'A (Khách)',
                          character_b: 'B (Nhân viên)',
                          character_a_script: [
                            'すみません。メニューをください。',
                            'カレーをひとつください。',
                            'みずもおねがいします。'
                          ],
                          character_b_script: [
                            'はい、しょうしょうおまちください。',
                            'かしこまりました。',
                            'はい、どうぞ。'
                          ],
                          vocabulary_hints: [
                            'すみません - Xin lỗi/cho tôi hỏi',
                            'メニュー - Menu',
                            '〜をください - Cho tôi ~',
                            'みず - Nước',
                            'しょうしょうおまちください - Vui lòng đợi một chút'
                          ],
                          grammar_points: ['〜をください', '〜も おねがいします'],
                          difficulty: 'easy'
                        });
                      }}
                    >
                      🍛 Gọi món
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          title: 'Mua sắm ở cửa hàng tiện lợi',
                          description: 'Hội thoại cơ bản khi thanh toán ở cửa hàng tiện lợi.',
                          scenario: 'Bạn mua vài món ở cửa hàng tiện lợi và thanh toán tại quầy.',
                          character_a: 'A (Khách)',
                          character_b: 'B (Nhân viên)',
                          character_a_script: [
                            'これとこれをください。',
                            'ポイントカードはありません。',
                            'レジぶくろはいりません。'
                          ],
                          character_b_script: [
                            'いらっしゃいませ。',
                            'ポイントカードはおもちですか。',
                            'ぜんぶで５００えんです。',
                            'ありがとうございました。'
                          ],
                          vocabulary_hints: [
                            'これ - Cái này',
                            'いらっしゃいませ - Xin chào quý khách',
                            'ポイントカード - Thẻ tích điểm',
                            'レジぶくろ - Túi nylon',
                            '〜はいりません - Không cần ~'
                          ],
                          grammar_points: ['これ/それ', '〜は ありません', '〜はいりません'],
                          difficulty: 'easy'
                        });
                      }}
                    >
                      🛒 Mua sắm
                    </button>
                  </div>
                  <div className="format-hint">
                    Chọn một template để tự động điền sẵn hội thoại. Bạn có thể chỉnh lại nội dung cho phù hợp.
                  </div>
                </div>
              )}

              {!item && (
                <div className="form-group">
                  <label>Dán JSON từ AI (Roleplay)</label>
                  <textarea
                    value={aiJsonText}
                    onChange={(e) => setAiJsonText(e.target.value)}
                    rows={5}
                    placeholder='Dán JSON roleplay với các key: title, description, scenario, character_a/b, character_a_script, character_b_script, vocabulary_hints, grammar_points, difficulty, image_url'
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ marginTop: '0.5rem' }}
                    onClick={handleParseAiJson}
                  >
                    🔁 Parse JSON vào form
                  </button>
                  {aiJsonStatus && (
                    <div style={{ marginTop: '0.5rem', color: 'var(--success-color)', fontSize: '0.875rem' }}>
                      {aiJsonStatus}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Tình huống *</label>
                <textarea
                  value={formData.scenario}
                  onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
                  required
                  rows={3}
                  placeholder="Mô tả tình huống roleplay..."
                />
              </div>
              <div className="form-group">
                <label>Nhân vật A *</label>
                <input
                  type="text"
                  value={formData.character_a}
                  onChange={(e) => setFormData({ ...formData, character_a: e.target.value })}
                  required
                  placeholder="Ví dụ: Khách hàng, Bạn, Học sinh..."
                />
              </div>
              <div className="form-group">
                <label>Nhân vật B *</label>
                <input
                  type="text"
                  value={formData.character_b}
                  onChange={(e) => setFormData({ ...formData, character_b: e.target.value })}
                  required
                  placeholder="Ví dụ: Nhân viên, Giáo viên, Bạn bè..."
                />
              </div>
              <div className="form-group">
                <label>Script nhân vật A (mỗi dòng một câu) *</label>
                <textarea
                  value={Array.isArray(formData.character_a_script) ? formData.character_a_script.join('\n') : formData.character_a_script || ''}
                  onChange={(e) => setFormData({ ...formData, character_a_script: e.target.value.split('\n').filter(l => l.trim()) })}
                  required
                  rows={5}
                  placeholder="Xin chào&#10;Tôi muốn đặt bàn cho 2 người&#10;Cảm ơn"
                />
                <div className="format-hint">
                  Mỗi dòng là một câu của nhân vật A
                </div>
              </div>
              <div className="form-group">
                <label>Script nhân vật B (mỗi dòng một câu) *</label>
                <textarea
                  value={Array.isArray(formData.character_b_script) ? formData.character_b_script.join('\n') : formData.character_b_script || ''}
                  onChange={(e) => setFormData({ ...formData, character_b_script: e.target.value.split('\n').filter(l => l.trim()) })}
                  required
                  rows={5}
                  placeholder="Xin chào, chào mừng đến nhà hàng&#10;Vâng, để tôi kiểm tra&#10;Đã đặt xong"
                />
                <div className="format-hint">
                  Mỗi dòng là một câu của nhân vật B
                </div>
              </div>
              <div className="form-group">
                <label>Gợi ý từ vựng (cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={Array.isArray(formData.vocabulary_hints) ? formData.vocabulary_hints.join(', ') : formData.vocabulary_hints || ''}
                  onChange={(e) => setFormData({ ...formData, vocabulary_hints: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Xin chào, đặt bàn, cảm ơn"
                />
              </div>
              <div className="form-group">
                <label>Điểm ngữ pháp (cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={Array.isArray(formData.grammar_points) ? formData.grammar_points.join(', ') : formData.grammar_points || ''}
                  onChange={(e) => setFormData({ ...formData, grammar_points: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="です, ます, ません"
                />
              </div>
              <div className="form-group">
                <label>Độ khó</label>
                <select
                  value={formData.difficulty || 'medium'}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              <div className="form-group">
                <label>Image File</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (!validateFileType(file, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'])) {
                        alert('Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF)');
                        return;
                      }

                      if (!validateFileSize(file, 5)) {
                        alert('File quá lớn. Tối đa 5MB');
                        return;
                      }

                      setUploadingImage(true);
                      const result = await uploadImage(file, 'roleplay');
                      setUploadingImage(false);

                      if (result.error) {
                        showToast('Lỗi upload: ' + result.error, 'error');
                      } else {
                        setFormData({ ...formData, image_url: result.url });
                        showToast('Upload thành công!', 'success');
                      }
                    }}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <span>Đang upload...</span>}
                </div>
                {formData.image_url && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img src={formData.image_url} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }} />
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      URL: <a href={formData.image_url} target="_blank" rel="noopener noreferrer">{formData.image_url}</a>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>URL Image (hoặc nhập URL trực tiếp)</label>
                <input
                  type="text"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" title="Lưu (Ctrl/Cmd + S)">
              {item ? 'Cập nhật' : 'Tạo mới'}
              <span className="keyboard-shortcut">⌘S</span>
            </button>
            <button type="button" className="btn btn-outline" onClick={onCancel} title="Hủy (Esc)">
              Hủy
              <span className="keyboard-shortcut">Esc</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function getTypeLabel(type: TabType): string {
  const labels: Record<TabType, string> = {
    courses: 'Khóa học',
    lessons: 'Bài học',
    vocabulary: 'Từ vựng',
    kanji: 'Kanji',
    grammar: 'Ngữ pháp',
    listening: 'Bài tập nghe',
    games: 'Game sắp xếp câu',
    roleplay: 'Roleplay',
    users: 'Người dùng',
  };
  return labels[type];
}

export default AdminPanel;
