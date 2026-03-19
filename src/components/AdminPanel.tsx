import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { getAllUserRoles, assignRole, assignTeacherToCourse, removeRole, getUserRole } from '../services/adminService';
import AdminHelpGuide from './AdminHelpGuide';
import Pagination from './common/Pagination';
import '../App.css';
import '../styles/admin-panel.css';
import '../styles/admin-panel-complete.css';
import '../styles/admin-help-guide.css';

import AdminForm, { getTypeLabel, TabType } from './AdminForm';
import AllClasses from './AllClasses';

const AdminPanel = () => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();

  // Navigation State
  // 'languages': Select Japanese/Chinese
  // 'courses': List of courses for selected language (N1, N2.. or HSK1, HSK2..)
  // 'lessons': List of lessons in selectedCourse
  // 'content': Content of selectedLesson
  // 'users': User Management
  // 'classes': All Classes Management
  const [viewMode, setViewMode] = useState<'languages' | 'levels' | 'courses' | 'lessons' | 'content' | 'users' | 'classes'>('languages');
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
  const [assignTeacherEmail, setAssignTeacherEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | 'admin'>('student');
  const [userActiveTab, setUserActiveTab] = useState<'list' | 'roles' | 'assignments'>('list');
  const [assignCourseLang, setAssignCourseLang] = useState('japanese');
  const [assignCourseLevel, setAssignCourseLevel] = useState('N5');
  const [assignCourseId, setAssignCourseId] = useState('');
  const [allCourses, setAllCourses] = useState<any[]>([]); // For assignment dropdown

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
      else if (viewMode === 'lessons') {
        // Remove joined relation fields that cause schema errors
        const { course, ...updateData } = formData;
        await updateLesson(id, updateData);
        if (selectedCourse) loadLessonsForCourse(selectedCourse.id);
      }
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
  // Helper render cho Users tab
  const renderUserManagement = () => {
    return (
      <motion.div
        className="user-management"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {userActiveTab === 'roles' && (
            <motion.div
              key="roles-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <div className="admin-form-card">

                {/* ===== TITLE ===== */}
                <div className="admin-form-header">
                  <div className="admin-form-icon">🛡️</div>
                  <h3 className="admin-form-title">
                    Kiểm soát quyền truy cập
                  </h3>
                </div>

                {/* ===== FORM BODY ===== */}
                <div className="admin-form-body">

                  {/* EMAIL */}
                  <div className="form-group">
                    <label className="admin-label">
                      Email tài khoản người dùng
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={userEmailInput}
                      onChange={e => setUserEmailInput(e.target.value)}
                      className="admin-input-base"
                    />
                  </div>

                  {/* ROLE */}
                  <div className="form-group">
                    <label className="admin-label">
                      Vai trò hệ thống
                    </label>

                    <div className="role-grid">
                      <button
                        onClick={() => setSelectedRole('student')}
                        className={`admin-role-option student ${selectedRole === 'student' ? 'selected' : ''
                          }`}
                      >
                        <span className="role-icon">🌟</span>
                        <span className="role-text">Học viên</span>
                      </button>

                      <button
                        onClick={() => setSelectedRole('teacher')}
                        className={`admin-role-option teacher ${selectedRole === 'teacher' ? 'selected' : ''
                          }`}
                      >
                        <span className="role-icon">👨‍🏫</span>
                        <span className="role-text">Giảng viên</span>
                      </button>

                      <button
                        onClick={() => setSelectedRole('admin')}
                        className={`admin-role-option admin ${selectedRole === 'admin' ? 'selected' : ''
                          }`}
                      >
                        <span className="role-icon">⚖️</span>
                        <span className="role-text">Quản trị viên</span>
                      </button>
                    </div>
                  </div>

                  {/* ACTION */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={async () => {
                      if (!userEmailInput) {
                        showToast('Vui lòng nhập email', 'error');
                        return;
                      }
                      try {
                        await assignRole(userEmailInput, selectedRole);
                        showToast('Đã phân quyền thành công', 'success');
                        loadUsers();
                        setUserEmailInput('');
                      } catch (e: any) {
                        showToast('Lỗi: ' + e.message, 'error');
                      }
                    }}
                    className="admin-button-premium blue"
                  >
                    Cập nhật quyền truy cập
                  </motion.button>

                </div>
              </div>
            </motion.div>

          )}

          {userActiveTab === 'assignments' && (
            <motion.div
              key="assignments-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <div className="admin-form-card">
                {/* ===== TITLE ===== */}
                <div className="admin-form-header">
                  <div className="admin-form-icon">📜</div>
                  <h3 className="admin-form-title">
                    Điều phối giảng dạy
                  </h3>
                </div>

                {/* ===== FORM BODY ===== */}
                <div className="admin-form-body">
                  <div className="form-group">
                    <label className="admin-label">Email giảng viên</label>
                    <select
                      value={assignTeacherEmail}
                      onChange={e => setAssignTeacherEmail(e.target.value)}
                      className="admin-input-base"
                      style={{ appearance: 'none' }}
                    >
                      <option value="">-- Chọn giảng viên --</option>
                      {data.filter((u: any) => u.role === 'teacher').length > 0 ? (
                        data.filter((u: any) => u.role === 'teacher').map((t: any) => (
                          <option key={t.id || t.email} value={t.email}>
                            {t.email}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Chưa có giảng viên nào</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-8">
                    <div className="form-group">
                      <label className="admin-label">Khóa học</label>
                      <select
                        value={assignCourseLang}
                        onChange={e => setAssignCourseLang(e.target.value)}
                        className="admin-input-base"
                        style={{ appearance: 'none' }}
                      >
                        <option value="japanese">🇯🇵 Tiếng Nhật</option>
                        <option value="chinese">🇨🇳 Tiếng Trung</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="admin-label">Khóa giáo trình (Cụ thể)</label>
                      <select
                        value={assignCourseId}
                        onChange={e => {
                          const courseId = e.target.value;
                          setAssignCourseId(courseId);
                          // Sync level for display/legacy
                          const matched = allCourses.find(c => c.id === courseId);
                          if (matched) setAssignCourseLevel(matched.level);
                        }}
                        className="admin-input-base"
                        style={{ appearance: 'none' }}
                      >
                        <option value="">-- Chọn khóa học thực tế --</option>
                        {allCourses
                          .filter(c => c.language === assignCourseLang)
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              {c.title || 'Không tên'} ({c.level})
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={async () => {
                      if (!assignTeacherEmail) { showToast('Vui lòng nhập email giảng viên', 'error'); return; }
                      if (!assignCourseId) { showToast('Vui lòng chọn khóa học cụ thể', 'warning'); return; }
                      try {
                        const role = await getUserRole(assignTeacherEmail);
                        if (role !== 'teacher' && role !== 'admin') {
                          showToast('Tài khoản này chưa phải là Giảng viên. Vui lòng cấp quyền trước.', 'error');
                          return;
                        }

                        await assignTeacherToCourse(assignTeacherEmail, assignCourseLang, assignCourseLevel, assignCourseId);
                        showToast(`Đã phân công thành công cho: ${assignTeacherEmail}`, 'success');
                        setAssignTeacherEmail('');
                        setAssignCourseId('');
                        // Refresh assignments list if it existed (currently only state based)
                      } catch (e: any) {
                        showToast('Lỗi: ' + e.message, 'error');
                      }
                    }}
                    className="admin-button-premium green"
                  >
                    Xác nhận phân công giảng dạy
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {userActiveTab === 'list' && (
            <motion.div
              key="list-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="admin-table-container">

                {/* ===== HEADER ===== */}
                <div className="admin-table-header">
                  <h3 className="admin-title">
                    <span>👥</span>
                    Danh sách người dùng hệ thống
                  </h3>

                  <span className="admin-count">
                    {filteredData.length} Thành viên
                  </span>
                </div>

                {/* ===== TABLE ===== */}
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Thông tin người dùng</th>
                        <th>Vai trò hiện tại</th>
                        <th className="text-right">Hành động</th>
                      </tr>
                    </thead>

                    <tbody>
                      <AnimatePresence mode="popLayout">

                        {currentItems.length > 0 ? (
                          currentItems.map((userRole: any, index: number) => (
                            <motion.tr
                              key={userRole.id || userRole.email}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ delay: index * 0.04 }}
                              className="admin-row"
                            >
                              {/* USER INFO */}
                              <td>
                                <div className="user-info">
                                  <div className={`user-avatar ${userRole.role}`}>
                                    {userRole.email.charAt(0).toUpperCase()}
                                  </div>

                                  <div className="user-text">
                                    <span className="user-email">{userRole.email}</span>
                                    <span className="user-id">
                                      UID: {userRole.id ? userRole.id.slice(0, 12) : 'SYSTEM'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* ROLE */}
                              <td>
                                <div className={`role-badge ${userRole.role}`}>
                                  <span>
                                    {userRole.role === 'admin'
                                      ? '⚡'
                                      : userRole.role === 'teacher'
                                        ? '💎'
                                        : '🌟'}
                                  </span>
                                  {userRole.role === 'admin'
                                    ? 'Administrator'
                                    : userRole.role === 'teacher'
                                      ? 'Instructor'
                                      : 'Student'}
                                </div>
                              </td>

                              {/* ACTION */}
                              <td>
                                <div className="action-group">
                                  <motion.button
                                    whileHover={{ scale: 1.1, rotate: -6 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                      setUserEmailInput(userRole.email);
                                      setSelectedRole(userRole.role);
                                      setUserActiveTab('roles');
                                    }}
                                    className="btn-action edit"
                                    title="Chỉnh sửa quyền"
                                  >
                                    ✏️
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.1, rotate: 6 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={async () => {
                                      if (window.confirm(`Bạn có chắc muốn xóa quyền của ${userRole.email}?`)) {
                                        try {
                                          await removeRole(userRole.email);
                                          showToast('Đã xóa quyền thành công', 'success');
                                          loadUsers();
                                        } catch (e: any) {
                                          showToast('Lỗi: ' + e.message, 'error');
                                        }
                                      }
                                    }}
                                    className="btn-action delete"
                                    title="Xoá quyền"
                                  >
                                    🗑️
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3}>
                              <div className="empty-state">
                                <div className="empty-icon">🔍</div>
                                <h4>Không tìm thấy kết quả</h4>
                                <p>
                                  Rất tiếc, chúng tôi không tìm thấy người dùng nào khớp
                                  với tiêu chí tìm kiếm của bạn.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}

                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* ===== FOOTER ===== */}
                <div className="admin-table-footer">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredData.length}
                  />
                </div>
              </div>
            </motion.div>

          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <h1>Admin Panel</h1>
            {viewMode === 'content' && <span className="admin-badge">{selectedLesson?.title}</span>}
          </div>
          <nav className="admin-header-nav">
            <button 
              onClick={() => setViewMode('users')} 
              className={`admin-header-btn ${viewMode === 'users' ? 'active' : ''}`}
            >
              Quản lý User
            </button>
            <button 
              onClick={handleBackToLanguages} 
              className={`admin-header-btn ${viewMode !== 'users' ? 'active' : ''}`}
            >
              Quản lý Nội dung
            </button>
            <button className="admin-header-btn logout-btn" onClick={signOut}>
              Đăng xuất
            </button>
          </nav>
        </div>
      </header>

      <div className="admin-content">
        {viewMode !== 'users' && renderBreadcrumbs()}

        {/* CONTROLS BAR (Search, Add, Tabs) */}
        {viewMode !== 'languages' && (
          <div className="controls-bar">
            {viewMode === 'content' ? (
              <div className="admin-tabs">
                {['vocabulary', 'kanji', 'grammar', 'listening', 'games', 'roleplay'].map(tab => (
                  <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab as TabType)}>
                    {getLabel(tab)}
                  </button>
                ))}
              </div>
            ) : viewMode === 'users' ? (
              <div className="admin-tabs">
                <button
                  className={`tab-btn ${userActiveTab === 'list' ? 'active' : ''}`}
                  onClick={() => setUserActiveTab('list')}
                >
                  👥 Thành viên
                </button>
                <button
                  className={`tab-btn ${userActiveTab === 'roles' ? 'active' : ''}`}
                  onClick={() => setUserActiveTab('roles')}
                >
                  🛡️ Phân quyền
                </button>
                <button
                  className={`tab-btn ${userActiveTab === 'assignments' ? 'active' : ''}`}
                  onClick={() => setUserActiveTab('assignments')}
                >
                  📜 Phân công
                </button>
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
                  <h2 className="responsive-title admin-text-primary" style={{
                    fontWeight: '800',
                    marginBottom: '0.5rem'
                  }}> Chọn ngôn ngữ</h2>
                  <p className="admin-text-secondary" style={{ fontSize: '1.1rem' }}>Chọn ngôn ngữ bạn muốn quản lý nội dung</p>
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
                    className="lang-card-japanese"
                    style={{
                      borderRadius: '24px',
                      padding: '2.5rem',
                      cursor: 'pointer'
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

                    <h3 className="admin-text-primary" style={{
                      fontSize: '1.75rem',
                      fontWeight: '800',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      Tiếng Nhật
                      <span className="lang-badge jp" style={{
                        fontSize: '0.75rem',
                        background: 'linear-gradient(135deg, #ef4444, #f97316)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontWeight: '600'
                      }}>JLPT</span>
                    </h3>

                    <p className="admin-text-secondary" style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
                      Quản lý khóa học <strong>N5 → N1</strong> và tài liệu giảng dạy tiếng Nhật.
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
                    className="lang-card-chinese"
                    style={{
                      borderRadius: '24px',
                      padding: '2.5rem',
                      cursor: 'pointer'
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
                  <h2 className="admin-text-primary" style={{ fontSize: '2rem', fontWeight: '800' }}>
                    {selectedLanguage === 'japanese' ? '🇯🇵 Chọn cấp độ JLPT' : '🇨🇳 Chọn cấp độ HSK'}
                  </h2>
                  <p className="admin-text-secondary">Chọn cấp độ để quản lý các khóa học tương ứng</p>
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
                      className="level-selection-card"
                      style={{
                        padding: '2rem 1.5rem',
                        borderRadius: '20px',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.borderColor = selectedLanguage === 'japanese' ? '#ef4444' : '#ea580c';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '[data-theme="dark"]' === document.documentElement.getAttribute('data-theme') ? '#334155' : '#e2e8f0';
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
                    className="course-card"
                    style={{
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 className="admin-text-primary" style={{ fontSize: '1.25rem', fontWeight: '700', flex: 1 }}>{course.title}</h3>
                      <span className="course-badge" style={{
                        background: selectedLanguage === 'japanese' ? '#fee2e2' : '#ffedd5',
                        color: selectedLanguage === 'japanese' ? '#ef4444' : '#ea580c',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '800'
                      }}>{course.level}</span>
                    </div>

                    <p className="admin-text-secondary" style={{
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '2.7rem',
                      marginBottom: '0.5rem'
                    }}>{course.description || 'Chưa có mô tả cho khóa học này.'}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>💰</span>
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: 'var(--success-color)'
                      }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price || 0)}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 'auto',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border-color)'
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
                  <div className="admin-card-base" style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    borderRadius: '24px',
                    borderStyle: 'dashed'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                    <h3 className="admin-text-primary" style={{ fontSize: '1.25rem', fontWeight: '700' }}>Chưa có khóa học nào</h3>
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
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredData.length}
                />
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
                          <div className="font-bold admin-text-primary group-hover:text-red-600 transition-colors text-lg">{lesson.title}</div>
                          <div className="text-xs admin-text-secondary md:hidden">{lesson.description}</div>
                        </td>
                        <td data-label="Mô tả" className="admin-text-secondary italic text-sm">{lesson.description || 'Chưa có mô tả'}</td>
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
                      <tr><td colSpan={5} className="text-center py-12 admin-text-secondary">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        Chưa có bài học nào được tạo cho khóa học này.
                      </td></tr>
                    )}
                  </tbody>
                </table>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredData.length}
                />

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
                              <div className="font-bold text-xl admin-text-primary">{item.word}</div>
                              {item.kanji && <div className="text-sm admin-text-secondary">Kanji: {item.kanji}</div>}
                              <div className="text-xs font-mono text-red-500 bg-red-50 dark:bg-red-900/20 inline-block px-1 rounded mt-1">{item.hiragana}</div>
                            </td>
                            <td data-label="Nghĩa">
                              <div className="font-semibold admin-text-primary">{item.meaning}</div>
                              {item.example && (
                                <div className="text-xs admin-text-secondary mt-1 italic">
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
                              <div className="text-4xl font-bold bg-slate-50 dark:bg-slate-800 w-16 h-16 flex items-center justify-center rounded-xl border border-slate-100 dark:border-slate-700">{item.character}</div>
                            </td>
                            <td data-label="Ý nghĩa">
                              <div className="font-bold admin-text-primary text-lg">{item.meaning}</div>
                              <div className="text-sm text-red-500">On: {Array.isArray(item.onyomi) ? item.onyomi.join(', ') : item.onyomi}</div>
                              <div className="text-sm text-blue-500">Kun: {Array.isArray(item.kunyomi) ? item.kunyomi.join(', ') : item.kunyomi}</div>
                            </td>
                            <td data-label="Số nét" style={{ textAlign: 'center' }}>
                              <div className="text-2xl font-bold admin-text-secondary">{item.stroke_count}</div>
                              <div className="text-xs admin-text-secondary opacity-60">nét</div>
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
                              <div className="font-bold text-lg text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded inline-block">{item.pattern}</div>
                              <div className="text-sm admin-text-primary font-semibold mt-1">{item.meaning}</div>
                            </td>
                            <td data-label="Giải thích">
                              <div className="text-sm admin-text-secondary line-clamp-2">{item.explanation}</div>
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
                            <td data-label="Nội dung" className="font-medium admin-text-primary">{item.title || item.sentence || item.question || 'Nội dung bài học'}</td>
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
                      <tr><td colSpan={5} className="text-center py-12 admin-text-secondary">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                        Danh mục này chưa có dữ liệu. Hãy bấm "Thêm Mới" để bắt đầu.
                      </td></tr>
                    )}
                  </tbody>
                </table>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredData.length}
                />

              </div>
            )}
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


export default AdminPanel;
