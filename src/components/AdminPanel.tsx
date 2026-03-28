import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
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
import { getAllUserRoles, assignRole, assignTeacherToCourse, removeRole, getUserRole } from '../services/adminService';
import AdminHelpGuide from './AdminHelpGuide';
import Pagination from './common/Pagination';
import '../styles/admin-panel-complete.css';

import AdminForm, { TabType } from './AdminForm';

const TAB_LABELS: Record<string, string> = {
  vocabulary: 'Từ vựng',
  kanji: 'Kanji',
  grammar: 'Ngữ pháp',
  listening: 'Nghe',
  games: 'Game',
  roleplay: 'Roleplay',
  courses: 'Khóa học',
  lessons: 'Bài học',
  users: 'Người dùng',
};

const AdminPanel = () => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<'languages' | 'levels' | 'courses' | 'lessons' | 'content' | 'users' | 'classes'>('languages');
  const [selectedLanguage, setSelectedLanguage] = useState<'japanese' | 'chinese' | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('vocabulary');

  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  // User Management
  const [userEmailInput, setUserEmailInput] = useState('');
  const [assignTeacherEmail, setAssignTeacherEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | 'admin'>('student');
  const [userActiveTab, setUserActiveTab] = useState<'list' | 'roles' | 'assignments'>('list');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [assignCourseLang, setAssignCourseLang] = useState('japanese');
  const [assignCourseLevel, setAssignCourseLevel] = useState('N5');
  const [assignCourseId, setAssignCourseId] = useState('');
  const [allCourses, setAllCourses] = useState<any[]>([]);

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
      const res = await getCourses();
      const filteredCourses = (res || []).filter((c: any) =>
        c.language === selectedLanguage && c.level === selectedLevel
      );
      setCourses(filteredCourses);
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
      const [usersRes, coursesRes] = await Promise.all([
        getAllUserRoles(),
        getCourses()
      ]);
      setData(usersRes || []);
      setFilteredData(usersRes || []);
      setAllCourses(coursesRes || []);
    } catch (e: any) {
      showToast('Lỗi tải user/khóa học: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

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
    setActiveTab('vocabulary');
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
  };

  const handleBackToLessons = () => {
    setSelectedLesson(null);
    setViewMode('lessons');
  };

  const handleCreate = async (formData: any) => {
    try {
      if (viewMode === 'lessons' && selectedCourse) {
        formData.course_id = selectedCourse.id;
        formData.level = selectedCourse.level;
        await createLesson(formData);
        loadLessonsForCourse(selectedCourse.id);
      } else if (viewMode === 'content' && selectedLesson) {
        formData.lesson_id = selectedLesson.id;
        if (activeTab === 'vocabulary') {
          if (Array.isArray(formData)) {
            for (const item of formData) await createVocabulary({ ...item, lesson_id: selectedLesson.id, language: selectedLesson.language });
          } else await createVocabulary({ ...formData, language: selectedLesson.language });
        } else if (activeTab === 'kanji') {
          if (Array.isArray(formData)) {
            for (const item of formData) await createKanji({ ...item, lesson_id: selectedLesson.id, language: selectedLesson.language });
          } else await createKanji({ ...formData, language: selectedLesson.language });
        } else if (activeTab === 'grammar') {
          if (Array.isArray(formData)) {
            for (const item of formData) await createGrammar({ ...item, lesson_id: selectedLesson.id, language: selectedLesson.language });
          } else await createGrammar({ ...formData, language: selectedLesson.language });
        } else if (activeTab === 'listening') await createListeningExercise(formData);
        else if (activeTab === 'games') await createSentenceGame(formData);
        else if (activeTab === 'roleplay') await createRoleplayScenario(formData);
        loadContent();
      } else if (viewMode === 'courses') {
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
      else if (viewMode === 'lessons') {
        const { course, ...updateData } = formData;
        await updateLesson(id, updateData);
        if (selectedCourse) loadLessonsForCourse(selectedCourse.id);
      } else if (viewMode === 'content') {
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
        await removeRole(id);
        loadUsers();
      }
      showToast('Xóa thành công', 'success');
    } catch (e: any) {
      showToast('Lỗi xóa: ' + e.message, 'error');
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const isContentView = viewMode === 'content';
  const isUserView = viewMode === 'users';
  const isNavContent = viewMode !== 'users' && viewMode !== 'languages';
  const langBadgeClass = selectedLanguage === 'japanese' ? 'jp' : selectedLanguage === 'chinese' ? 'cn' : '';
  const levelBadgeClass = selectedLanguage === 'japanese' ? 'jp' : 'cn';
  const levelCardClass = selectedLanguage === 'japanese' ? 'admin-level-card-jp' : 'admin-level-card-cn';
  const courseBadgeClass = selectedLanguage === 'japanese' ? 'course-card-badge-jp' : 'course-card-badge-cn';

  // ---- Render ----
  const renderBreadcrumbs = () => (
    <div className="admin-breadcrumb-bar">
      <Link to="/" className="admin-bc-item">🏠 Trang chủ</Link>
      <span className="admin-bc-sep">›</span>
      <span className="admin-bc-item" onClick={handleBackToLanguages}>Admin</span>
      <span className="admin-bc-sep">›</span>
      {viewMode === 'levels' ? (
        <span className="admin-bc-item current">
          {selectedLanguage === 'japanese' ? '🇯🇵 Tiếng Nhật' : '🇨🇳 Tiếng Trung'}
        </span>
      ) : (
        <>
          <span className="admin-bc-item" onClick={handleBackToLevels}>
            {selectedLanguage === 'japanese' ? '🇯🇵 Tiếng Nhật' : '🇨🇳 Tiếng Trung'}
          </span>
          {selectedLevel && (
            <>
              <span className="admin-bc-sep">›</span>
              <span className="admin-bc-item" onClick={handleBackToCourses}>
                Cấp độ {selectedLevel}
              </span>
            </>
          )}
          {selectedCourse && (
            <>
              <span className="admin-bc-sep">›</span>
              <span className="admin-bc-item" onClick={handleBackToLessons}>
                {selectedCourse.title}
              </span>
            </>
          )}
          {selectedLesson && (
            <>
              <span className="admin-bc-sep">›</span>
              <span className="admin-bc-item current">{selectedLesson.title}</span>
            </>
          )}
        </>
      )}
      <span className="admin-bc-spacer" />
      {selectedLanguage && (
        <span className={`admin-badge-lang ${langBadgeClass}`}>
          {selectedLanguage === 'japanese' ? '🇯🇵' : '🇨🇳'}{' '}
          {selectedLanguage === 'japanese' ? 'Tiếng Nhật' : 'Tiếng Trung'}
        </span>
      )}
    </div>
  );

  const renderControlsBar = () => (
    <div className="admin-ctrl">
      {isContentView ? (
        <div className="admin-tab-list">
          {(['vocabulary', 'kanji', 'grammar', 'listening', 'games', 'roleplay'] as TabType[]).map(tab => (
            <button
              key={tab}
              className={`admin-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      ) : isUserView ? (
        <div className="admin-subtab">
          <button
            className={`admin-subtab-btn ${userActiveTab === 'list' ? 'active' : ''}`}
            onClick={() => setUserActiveTab('list')}
          >
            👥 Thành viên
          </button>
          <button
            className={`admin-subtab-btn ${userActiveTab === 'roles' ? 'active' : ''}`}
            onClick={() => setUserActiveTab('roles')}
          >
            🛡️ Phân quyền
          </button>
          <button
            className={`admin-subtab-btn ${userActiveTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setUserActiveTab('assignments')}
          >
            📜 Phân công
          </button>
        </div>
      ) : (
        <span className="admin-ctrl-section-title">
          {viewMode === 'levels' && 'Chọn cấp độ'}
          {viewMode === 'courses' && `Khóa học — Cấp độ ${selectedLevel}`}
          {viewMode === 'lessons' && `Bài học: ${selectedCourse?.title}`}
        </span>
      )}

      <span className="admin-ctrl-spacer" />

      <div className="admin-search">
        <span className="admin-search-icon">🔍</span>
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {(viewMode === 'courses' || viewMode === 'lessons' || viewMode === 'content') && (
        <button className="admin-btn-add" onClick={() => { setEditingItem(null); setShowForm(true); }}>
          <span className="plus">+</span> Thêm mới
        </button>
      )}
    </div>
  );

  // ---- User Management ----
  const renderUserManagement = () => {
    if (userActiveTab === 'roles') return (
      <div className="admin-users-layout">
        <div className="admin-user-card">
          <div className="admin-user-card-head">
            <div className="admin-user-card-title">
              <span className="admin-user-card-title-icon">🛡️</span>
              Kiểm soát quyền truy cập
            </div>
          </div>
          <div className="admin-user-card-body">
            <div className="admin-form-row">
              <label className="admin-form-label">Email tài khoản</label>
              <input
                type="email"
                className="admin-form-input"
                placeholder="name@example.com"
                value={userEmailInput}
                onChange={e => setUserEmailInput(e.target.value)}
              />
            </div>
            <div className="admin-form-row">
              <label className="admin-form-label">Vai trò hệ thống</label>
              <div className="admin-role-picker">
                {(['student', 'teacher', 'admin'] as const).map(role => (
                  <button
                    key={role}
                    className={`admin-role-opt ${selectedRole === role ? 'selected' : ''}`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <span className="admin-role-opt-icon">
                      {role === 'student' ? '🌟' : role === 'teacher' ? '👨‍🏫' : '⚡'}
                    </span>
                    <span className="admin-role-opt-label">
                      {role === 'student' ? 'Học viên' : role === 'teacher' ? 'Giảng viên' : 'Admin'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                if (!userEmailInput) { showToast('Vui lòng nhập email', 'error'); return; }
                try {
                  await assignRole(userEmailInput, selectedRole);
                  showToast('Đã phân quyền thành công', 'success');
                  loadUsers();
                  setUserEmailInput('');
                } catch (e: any) {
                  showToast('Lỗi: ' + e.message, 'error');
                }
              }}
              className="admin-btn-primary blue"
              style={{ marginTop: '0.5rem' }}
            >
              ✓ Cập nhật quyền truy cập
            </motion.button>
          </div>
        </div>
      </div>
    );

    if (userActiveTab === 'assignments') return (
      <div className="admin-users-layout">
        <div className="admin-user-card">
          <div className="admin-user-card-head">
            <div className="admin-user-card-title">
              <span className="admin-user-card-title-icon">📜</span>
              Điều phối giảng dạy
            </div>
          </div>
          <div className="admin-user-card-body">
            <div className="admin-form-row">
              <label className="admin-form-label">Giảng viên</label>
              <select
                className="admin-form-input"
                value={assignTeacherEmail}
                onChange={e => setAssignTeacherEmail(e.target.value)}
              >
                <option value="">— Chọn giảng viên —</option>
                {data.filter((u: any) => u.role === 'teacher').length > 0 ? (
                  data.filter((u: any) => u.role === 'teacher').map((t: any) => (
                    <option key={t.id || t.email} value={t.email}>{t.email}</option>
                  ))
                ) : (
                  <option disabled>Chưa có giảng viên nào</option>
                )}
              </select>
            </div>
            <div className="admin-assign-grid">
              <div className="admin-form-row">
                <label className="admin-form-label">Ngôn ngữ</label>
                <select
                  className="admin-form-input"
                  value={assignCourseLang}
                  onChange={e => { setAssignCourseLang(e.target.value); setAssignCourseId(''); }}
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="admin-form-row">
                <label className="admin-form-label">Khóa học cụ thể</label>
                <select
                  className="admin-form-input"
                  value={assignCourseId}
                  onChange={e => {
                    setAssignCourseId(e.target.value);
                    const matched = allCourses.find(c => c.id === e.target.value);
                    if (matched) setAssignCourseLevel(matched.level);
                  }}
                >
                  <option value="">— Chọn khóa —</option>
                  {allCourses.filter(c => c.language === assignCourseLang).map(c => (
                    <option key={c.id} value={c.id}>{c.title || 'Không tên'} ({c.level})</option>
                  ))}
                </select>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                if (!assignTeacherEmail) { showToast('Chọn giảng viên', 'error'); return; }
                if (!assignCourseId) { showToast('Chọn khóa học', 'warning'); return; }
                try {
                  const role = await getUserRole(assignTeacherEmail);
                  if (role !== 'teacher' && role !== 'admin') {
                    showToast('Tài khoản này chưa phải Giảng viên', 'error');
                    return;
                  }
                  await assignTeacherToCourse(assignTeacherEmail, assignCourseLang, assignCourseLevel, assignCourseId);
                  showToast(`Đã phân công cho: ${assignTeacherEmail}`, 'success');
                  setAssignTeacherEmail('');
                  setAssignCourseId('');
                } catch (e: any) {
                  showToast('Lỗi: ' + e.message, 'error');
                }
              }}
              className="admin-btn-primary green"
            >
              ✓ Xác nhận phân công
            </motion.button>
          </div>
        </div>
      </div>
    );

    // userActiveTab === 'list'
    const roleFilteredData = roleFilter === 'all'
      ? filteredData
      : filteredData.filter((u: any) => u.role === roleFilter);
    const roleCurrentItems = roleFilteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    const roleTotalPages = Math.ceil(roleFilteredData.length / itemsPerPage);

    return (
      <div className="admin-user-card">
        <div className="admin-user-card-head">
          <div className="admin-user-card-title">
            <span className="admin-user-card-title-icon">👥</span>
            Danh sách người dùng
          </div>
          <span className="admin-table-head-count">{roleFilteredData.length} thành viên</span>
        </div>

        {/* Filter + Back bar */}
        <div className="admin-user-filter-bar">
          <button
            className={`admin-filter-role-btn ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setRoleFilter('all'); setCurrentPage(1); }}
          >
            👥 Tất cả
          </button>
          <button
            className={`admin-filter-role-btn ${roleFilter === 'student' ? 'active' : ''}`}
            onClick={() => { setRoleFilter('student'); setCurrentPage(1); }}
          >
            🌟 Học viên
          </button>
          <button
            className={`admin-filter-role-btn ${roleFilter === 'teacher' ? 'active' : ''}`}
            onClick={() => { setRoleFilter('teacher'); setCurrentPage(1); }}
          >
            👨‍🏫 Giảng viên
          </button>
          <button
            className={`admin-filter-role-btn ${roleFilter === 'admin' ? 'active' : ''}`}
            onClick={() => { setRoleFilter('admin'); setCurrentPage(1); }}
          >
            ⚡ Admin
          </button>
          <button
            className="admin-user-back-btn"
            onClick={() => setViewMode('languages')}
          >
            ← Quay về
          </button>
        </div>

        <div style={{ padding: '0 1.5rem' }}>
          {roleCurrentItems.length > 0 ? roleCurrentItems.map((userRole: any) => (
            <div key={userRole.id || userRole.email} className="admin-user-row">
              <div className={`user-row-avatar ${userRole.role || 'student'}`}>
                {userRole.email?.charAt(0).toUpperCase()}
              </div>
              <div className="user-row-info">
                <div className="user-row-email">{userRole.email}</div>
                <div className="user-row-id">UID: {userRole.id?.slice(0, 12) || 'SYSTEM'}</div>
              </div>
              <div className="user-row-role">
                <span className={`role-pill ${userRole.role || 'student'}`}>
                  {userRole.role === 'admin' ? '⚡' : userRole.role === 'teacher' ? '💎' : '🌟'}{' '}
                  {userRole.role === 'admin' ? 'Admin' : userRole.role === 'teacher' ? 'GV' : 'Học viên'}
                </span>
              </div>
              <div className="user-row-actions">
                <button
                  className="admin-btn-icon"
                  title="Sửa quyền"
                  onClick={() => {
                    setUserEmailInput(userRole.email);
                    setSelectedRole(userRole.role || 'student');
                    setUserActiveTab('roles');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  ✏️
                </button>
                <button
                  className="admin-btn-icon delete"
                  title="Xóa quyền"
                  onClick={async () => {
                    if (window.confirm(`Xóa quyền của ${userRole.email}?`)) {
                      try {
                        await removeRole(userRole.email);
                        showToast('Đã xóa quyền', 'success');
                        loadUsers();
                      } catch (e: any) {
                        showToast('Lỗi: ' + e.message, 'error');
                      }
                    }
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          )) : (
            <div className="admin-empty" style={{ margin: '2rem 0', borderStyle: 'dashed' }}>
              <div className="admin-empty-icon">🔍</div>
              <h3>Không tìm thấy</h3>
              <p>Không có người dùng nào khớp tiêu chí.</p>
            </div>
          )}
        </div>
        {roleTotalPages > 1 && (
          <div className="admin-pagination">
            <span className="admin-pagination-info">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, roleFilteredData.length)} / {roleFilteredData.length}
            </span>
            <div className="admin-pagination-btns">
              <button className="admin-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
              {Array.from({ length: roleTotalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  className={`admin-page-btn ${currentPage === n ? 'active' : ''}`}
                  onClick={() => setCurrentPage(n)}
                >
                  {n}
                </button>
              ))}
              <button className="admin-page-btn" disabled={currentPage === roleTotalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---- Lang Selection ----
  const renderLanguages = () => (
    <div>
      <div className="admin-lang-header">
        <h2>Chọn ngôn ngữ quản lý</h2>
        <p>Chọn ngôn ngữ bạn muốn quản lý nội dung học tập</p>
      </div>
      <div className="admin-lang-grid">
        {/* Japanese */}
        <div onClick={() => handleSelectLanguage('japanese')} className="admin-lang-card admin-lang-card-jp">
          <div className="lang-card-deco">日本</div>
          <div className="lang-card-icon lang-card-icon-jp">🇯🇵</div>
          <h3 className="lang-card-name">
            Tiếng Nhật
            <span className="lang-card-badge lang-card-badge-jp">JLPT</span>
          </h3>
          <p className="lang-card-desc">Quản lý khóa học <strong>N5 → N1</strong> và tài liệu giảng dạy tiếng Nhật.</p>
          <div className="lang-card-cta">
            Bắt đầu quản lý
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <div className="lang-card-accent lang-card-accent-jp" />
        </div>

        {/* Chinese */}
        <div onClick={() => handleSelectLanguage('chinese')} className="admin-lang-card admin-lang-card-cn">
          <div className="lang-card-deco">中文</div>
          <div className="lang-card-icon lang-card-icon-cn">🇨🇳</div>
          <h3 className="lang-card-name">
            Tiếng Trung
            <span className="lang-card-badge lang-card-badge-cn">HSK</span>
          </h3>
          <p className="lang-card-desc">Quản lý khóa học <strong>HSK1 → HSK6</strong> và tài liệu học tập tiếng Trung.</p>
          <div className="lang-card-cta">
            Bắt đầu quản lý
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <div className="lang-card-accent lang-card-accent-cn" />
        </div>
      </div>
    </div>
  );

  // ---- Levels ----
  const renderLevels = () => {
    const levels = selectedLanguage === 'japanese'
      ? ['N5', 'N4', 'N3', 'N2', 'N1']
      : ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'];
    return (
      <div>
        <div className="admin-levels-header">
          <h2>
            {selectedLanguage === 'japanese' ? '🇯🇵' : '🇨🇳'}{' '}
            {selectedLanguage === 'japanese' ? 'Chọn cấp độ JLPT' : 'Chọn cấp độ HSK'}
          </h2>
          <p>Chọn cấp độ để quản lý các khóa học tương ứng</p>
        </div>
        <div className="admin-level-grid">
          {levels.map(level => (
            <div
              key={level}
              onClick={() => handleSelectLevel(level)}
              className={`admin-level-card ${levelCardClass}`}
            >
              <div className="admin-level-num">{level}</div>
              <div className="admin-level-label">
                {selectedLanguage === 'japanese' ? 'Level' : 'Grade'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---- Courses ----
  const renderCourses = () => {
    if (currentItems.length === 0) return (
      <div className="admin-course-grid">
        <div className="admin-empty">
          <div className="admin-empty-icon">📚</div>
          <h3>Chưa có khóa học nào</h3>
          <p>Hãy tạo khóa học đầu tiên cho cấp độ này.</p>
          <button className="admin-btn-add" style={{ margin: '0 auto' }} onClick={() => { setEditingItem(null); setShowForm(true); }}>
            <span className="plus">+</span> Thêm khóa học
          </button>
        </div>
      </div>
    );
    return (
      <div className="admin-course-grid">
        {currentItems.map((course: any) => (
          <div key={course.id} className="admin-course-card" onClick={() => handleSelectCourse(course)}>
            <div className="course-card-top">
              <h3 className="course-card-title">{course.title}</h3>
              <span className={`course-card-badge ${courseBadgeClass}`}>{course.level}</span>
            </div>
            <p className="course-card-desc">
              {course.description || 'Chưa có mô tả cho khóa học này.'}
            </p>
            <div className="course-card-price">
              💰 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price || 0)}
            </div>
            <div className="course-card-footer">
              <button className="admin-btn-manage" onClick={e => { e.stopPropagation(); handleSelectLesson(course); }}>
                📚 Xem bài học
              </button>
              <div className="course-card-actions" onClick={e => e.stopPropagation()}>
                <button
                  className="admin-btn-icon"
                  title="Sửa"
                  onClick={e => { e.stopPropagation(); setEditingItem(course); setShowForm(true); }}
                >
                  ✏️
                </button>
                <button
                  className="admin-btn-icon delete"
                  title="Xóa"
                  onClick={e => { e.stopPropagation(); handleDelete(course.id); }}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ---- Lessons ----
  const renderLessons = () => (
    <div className="admin-table-card">
      <div className="admin-table-head">
        <div className="admin-table-head-left">
          <span className="admin-table-head-icon">📖</span>
          <span className="admin-table-head-title">Bài học ({filteredData.length})</span>
        </div>
        <button className="admin-btn-add" onClick={() => { setEditingItem(null); setShowForm(true); }}>
          <span className="plus">+</span> Thêm bài học
        </button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>Bài số</th>
            <th>Tên bài học</th>
            <th>Mô tả</th>
            <th style={{ width: '140px', textAlign: 'center' }}>Quản lý</th>
            <th style={{ width: '130px', textAlign: 'right' }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? currentItems.map((lesson: any) => (
            <tr key={lesson.id}>
              <td className="cell-num">#{lesson.lesson_number}</td>
              <td>
                <div className="cell-title">{lesson.title}</div>
                <div className="cell-sub">{lesson.description || 'Chưa có mô tả'}</div>
              </td>
              <td>
                <div className="cell-sub" style={{ WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', display: '-webkit-box', overflow: 'hidden' }}>
                  {lesson.description || '—'}
                </div>
              </td>
              <td style={{ textAlign: 'center' }}>
                <button className="admin-btn-manage" onClick={() => handleSelectLesson(lesson)}>
                  📝 Quản lý
                </button>
              </td>
              <td>
                <div className="cell-actions">
                  <button className="admin-btn-icon" title="Sửa" onClick={() => { setEditingItem(lesson); setShowForm(true); }}>✏️</button>
                  <button className="admin-btn-icon delete" title="Xóa" onClick={() => handleDelete(lesson.id)}>🗑️</button>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="admin-empty-icon">📭</div>
                <p style={{ color: 'var(--admin-text-muted)', margin: '0.5rem 0 0' }}>Chưa có bài học nào.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="admin-pagination">
          <span className="admin-pagination-info">
            {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredData.length)} / {filteredData.length}
          </span>
          <div className="admin-pagination-btns">
            <button className="admin-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} className={`admin-page-btn ${currentPage === n ? 'active' : ''}`} onClick={() => setCurrentPage(n)}>{n}</button>
            ))}
            <button className="admin-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
          </div>
        </div>
      )}
    </div>
  );

  // ---- Content ----
  const renderContent = () => {
    const tabCols: Record<string, string[]> = {
      vocabulary: ['Từ vựng / Pinyin', 'Nghĩa / Ví dụ', 'Độ khó', 'Hành động'],
      kanji: ['Ký tự', 'Nghĩa / Âm đọc', 'Số nét', 'Hành động'],
      grammar: ['Cấu trúc / Nghĩa', 'Giải thích', 'Hành động'],
      listening: ['Nội dung', 'Hành động'],
      games: ['Nội dung', 'Hành động'],
      roleplay: ['Nội dung', 'Hành động'],
    };
    const cols = tabCols[activeTab] || ['Nội dung', 'Hành động'];
    const colWidths: Record<string, string[]> = {
      vocabulary: ['25%', '40%', '15%', '20%'],
      kanji: ['15%', '40%', '20%', '25%'],
      grammar: ['30%', '50%', '20%'],
      listening: ['85%', '15%'],
      games: ['85%', '15%'],
      roleplay: ['85%', '15%'],
    };
    const widths = colWidths[activeTab] || ['85%', '15%'];

    const renderCell = (item: any) => {
      if (activeTab === 'vocabulary') return (
        <>
          <td data-label="Từ vựng">
            <div className="cell-vocab-word">{item.word}</div>
            {item.kanji && <div className="cell-vocab-sub">Kanji: {item.kanji}</div>}
            <div className="cell-vocab-sub" style={{ fontFamily: 'monospace', color: 'var(--admin-red)' }}>{item.hiragana}</div>
          </td>
          <td data-label="Nghĩa">
            <div style={{ fontWeight: 600 }}>{item.meaning}</div>
            {item.example && <div className="cell-vocab-example">VD: {item.example}</div>}
          </td>
          <td data-label="Độ khó" style={{ textAlign: 'center' }}>
            <span className={`badge-diff ${item.difficulty || 'easy'}`}>
              {item.difficulty === 'easy' ? 'Dễ' : item.difficulty === 'hard' ? 'Khó' : 'Thường'}
            </span>
          </td>
          <td data-label="Hành động">
            <div className="cell-actions">
              <button className="admin-btn-icon" onClick={() => { setEditingItem(item); setShowForm(true); }}>✏️</button>
              <button className="admin-btn-icon delete" onClick={() => handleDelete(item.id)}>🗑️</button>
            </div>
          </td>
        </>
      );
      if (activeTab === 'kanji') return (
        <>
          <td data-label="Ký tự">
            <div className="cell-kanji-char">{item.character}</div>
          </td>
          <td data-label="Nghĩa">
            <div className="cell-kanji-meaning">{item.meaning}</div>
            {item.onyomi && <div className="cell-kanji-reading on">On: {Array.isArray(item.onyomi) ? item.onyomi.join(', ') : item.onyomy}</div>}
            {item.kunyomi && <div className="cell-kanji-reading kun">Kun: {Array.isArray(item.kunyomi) ? item.kunyomi.join(', ') : item.kunyomi}</div>}
          </td>
          <td data-label="Số nét" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{item.stroke_count}</div>
          </td>
          <td data-label="Hành động">
            <div className="cell-actions">
              <button className="admin-btn-icon" onClick={() => { setEditingItem(item); setShowForm(true); }}>✏️</button>
              <button className="admin-btn-icon delete" onClick={() => handleDelete(item.id)}>🗑️</button>
            </div>
          </td>
        </>
      );
      if (activeTab === 'grammar') return (
        <>
          <td data-label="Cấu trúc">
            <span className="cell-grammar-pattern">{item.pattern}</span>
            <div className="cell-grammar-meaning">{item.meaning}</div>
          </td>
          <td data-label="Giải thích">
            <div style={{ fontSize: '0.825rem', color: 'var(--admin-text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {item.explanation}
            </div>
            {item.examples?.length > 0 && (
              <div style={{ fontSize: '0.725rem', color: 'var(--admin-blue)', marginTop: '0.25rem' }}>({item.examples.length} ví dụ)</div>
            )}
          </td>
          <td data-label="Hành động">
            <div className="cell-actions">
              <button className="admin-btn-icon" onClick={() => { setEditingItem(item); setShowForm(true); }}>✏️</button>
              <button className="admin-btn-icon delete" onClick={() => handleDelete(item.id)}>🗑️</button>
            </div>
          </td>
        </>
      );
      return (
        <>
          <td data-label="Nội dung" style={{ fontWeight: 600 }}>
            {item.title || item.sentence || item.question || item.content || '—'}
          </td>
          <td data-label="Hành động">
            <div className="cell-actions">
              <button className="admin-btn-icon" onClick={() => { setEditingItem(item); setShowForm(true); }}>✏️</button>
              <button className="admin-btn-icon delete" onClick={() => handleDelete(item.id)}>🗑️</button>
            </div>
          </td>
        </>
      );
    };

    return (
      <div className="admin-table-card">
        <div className="admin-table-head">
          <div className="admin-table-head-left">
            <span className="admin-table-head-icon">📝</span>
            <span className="admin-table-head-title">{TAB_LABELS[activeTab]} ({filteredData.length})</span>
          </div>
          <button className="admin-btn-add" onClick={() => { setEditingItem(null); setShowForm(true); }}>
            <span className="plus">+</span> Thêm {TAB_LABELS[activeTab].toLowerCase()}
          </button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              {cols.map((col, i) => (
                <th key={i} style={{ width: widths[i] || 'auto', textAlign: i === cols.length - 1 ? 'right' : 'left' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? currentItems.map((item: any) => (
              <tr key={item.id}>{renderCell(item)}</tr>
            )) : (
              <tr>
                <td colSpan={cols.length} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="admin-empty-icon">📦</div>
                  <p style={{ color: 'var(--admin-text-muted)', margin: '0.5rem 0 0' }}>Chưa có dữ liệu. Bấm "Thêm mới" để bắt đầu.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="admin-pagination">
            <span className="admin-pagination-info">
              {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredData.length)} / {filteredData.length}
            </span>
            <div className="admin-pagination-btns">
              <button className="admin-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} className={`admin-page-btn ${currentPage === n ? 'active' : ''}`} onClick={() => setCurrentPage(n)}>{n}</button>
              ))}
              <button className="admin-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---- Main ----
  return (
    <div className="admin-wrap">
      {/* ---- Topbar ---- */}
      <header className="admin-topbar">
        <Link to="/" className="admin-logo">
          <div className="admin-logo-icon">⚙️</div>
          <div>
            <div className="admin-logo-text">Admin Panel</div>
            <div className="admin-logo-sub">Quản trị hệ thống</div>
          </div>
        </Link>

        <nav className="admin-topnav">
          <button
            className={`admin-nav-btn ${viewMode === 'users' ? 'active' : ''}`}
            onClick={() => setViewMode('users')}
          >
            👥 Người dùng
          </button>
          <button
            className={`admin-nav-btn ${!['users'].includes(viewMode) ? 'active' : ''}`}
            onClick={handleBackToLanguages}
          >
            📚 Nội dung
          </button>
        </nav>

        <div className="admin-topbar-actions">
          {selectedLanguage && (
            <span className={`admin-badge-lang ${langBadgeClass}`}>
              {selectedLanguage === 'japanese' ? '🇯🇵' : '🇨🇳'}{' '}
              {selectedLanguage === 'japanese' ? 'Tiếng Nhật' : 'Tiếng Trung'}
            </span>
          )}
          <button className="admin-btn-ghost" onClick={signOut} title="Đăng xuất">
            🚪
          </button>
        </div>
      </header>

      {/* ---- Page ---- */}
      <main className="admin-page">
        {/* Breadcrumbs */}
        {viewMode !== 'languages' && renderBreadcrumbs()}

        {/* Controls */}
        {isNavContent && renderControlsBar()}

        {/* Loading */}
        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" />
            <span className="admin-loading-text">Đang tải dữ liệu...</span>
          </div>
        ) : isUserView ? (
          renderUserManagement()
        ) : viewMode === 'languages' ? (
          renderLanguages()
        ) : viewMode === 'levels' ? (
          renderLevels()
        ) : viewMode === 'courses' ? (
          renderCourses()
        ) : viewMode === 'lessons' ? (
          renderLessons()
        ) : (
          renderContent()
        )}

        {totalPages > 1 && viewMode !== 'lessons' && !isUserView && (
          <div style={{ marginTop: '1.5rem' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredData.length}
            />
          </div>
        )}
      </main>

      {/* Modals */}
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

      {showHelpGuide && (
        <AdminHelpGuide type={activeTab} onClose={() => setShowHelpGuide(false)} />
      )}
    </div>
  );
};

export default AdminPanel;
