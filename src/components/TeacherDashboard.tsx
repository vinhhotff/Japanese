import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { getTeacherAssignments as getTeachingAssignments } from '../services/adminService';
import { getTeacherClasses, createClass as createClassService, getClassStudents, removeStudent, deleteClass } from '../services/classService';
import { createHomework, getTeacherHomework } from '../services/homeworkService';
import { getTeacherAssignments as getMediaAssignments, deleteAssignment } from '../services/assignmentService';
import AdminForm, { TabType, getTypeLabel } from './AdminForm';
import {
    getLessons, createLesson, updateLesson, deleteLesson,
    getVocabulary, createVocabulary, updateVocabulary, deleteVocabulary,
    getKanji, createKanji, updateKanji, deleteKanji,
    getGrammar, createGrammar, updateGrammar, deleteGrammar,
    getListeningExercises, createListeningExercise, updateListeningExercise, deleteListeningExercise,
    getSentenceGames, createSentenceGame, updateSentenceGame, deleteSentenceGame,
    getRoleplayScenarios, createRoleplayScenario, updateRoleplayScenario, deleteRoleplayScenario,
    getCourses
} from '../services/supabaseService';
import '../styles/teacher-dashboard-premium.css';

const CONTENT_TABS: TabType[] = ['vocabulary', 'kanji', 'grammar', 'listening', 'games', 'roleplay'];

const TeacherDashboard = () => {
    const { user, isTeacher, signOut, profile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
    const [homeworkList, setHomeworkList] = useState<any[]>([]);
    const [myAssignments, setMyAssignments] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Class Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassLevel, setNewClassLevel] = useState('');
    const [newClassLang, setNewClassLang] = useState<'japanese' | 'chinese'>('japanese');

    // View Students Modal
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [selectedClassStudents, setSelectedClassStudents] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Content Manager
    const [showContentModal, setShowContentModal] = useState(false);
    const [contentViewMode, setContentViewMode] = useState<'courses' | 'lessons' | 'content'>('courses');
    const [selectedContentCourse, setSelectedContentCourse] = useState<any>(null);
    const [selectedContentLesson, setSelectedContentLesson] = useState<any>(null);
    const [activeContentTab, setActiveContentTab] = useState<TabType>('vocabulary');
    const [contentData, setContentData] = useState<any[]>([]);
    const [loadingContent, setLoadingContent] = useState(false);
    const [editingContentItem, setEditingContentItem] = useState<any>(null);
    const [showAdminForm, setShowAdminForm] = useState(false);

    useEffect(() => {
        if (user?.email) loadData();
    }, [user]);

    const loadData = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            const [classesData, coursesData, teacherAsgnData, hwData, asgData] = await Promise.all([
                getTeacherClasses(user.id),
                getCourses(),
                getTeachingAssignments(user.email),
                getTeacherHomework(user.id),
                getMediaAssignments(user.id)
            ]);

            const courseMap = new Map();
            teacherAsgnData.forEach((assign: any) => {
                const matchedCourse = coursesData?.find((c: any) =>
                    c.id === assign.course_id || (c.level === assign.level && c.language === assign.language)
                );
                if (matchedCourse && !courseMap.has(matchedCourse.id)) {
                    courseMap.set(matchedCourse.id, { ...assign, ...matchedCourse, assignment_id: assign.id });
                }
            });

            const resolvedCourses = Array.from(courseMap.values());
            
            // 3. Load lesson counts for each course
            const coursesWithLessons = await Promise.all(
                resolvedCourses.map(async (course: any) => {
                    try {
                        const lessons = await getLessons(course.id);
                        return {
                            ...course,
                            lessonCount: lessons?.length || 0,
                            lessons: lessons || []
                        };
                    } catch (e) {
                        console.error(`Error loading lessons for course ${course.id}:`, e);
                        return {
                            ...course,
                            lessonCount: 0,
                            lessons: []
                        };
                    }
                })
            );
            
            setMyAssignments(coursesWithLessons);
            setClasses(classesData || []);
            setHomeworkList(hwData || []);
            setAssignmentsList(asgData || []);

            if (resolvedCourses.length > 0) {
                setNewClassLevel(resolvedCourses[0].level);
                setNewClassLang(resolvedCourses[0].language);
            }
        } catch (e) {
            console.error(e);
            showToast('Lỗi tải dữ liệu giáo viên', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ---- Class Handlers ----
    const handleCreateClass = async () => {
        if (!newClassName || !newClassLevel) { showToast('Điền tên lớp và cấp độ', 'warning'); return; }
        try {
            await createClassService({ name: newClassName, level: newClassLevel, language: newClassLang, teacher_id: user!.id });
            showToast('Tạo lớp thành công!', 'success');
            setShowCreateModal(false);
            setNewClassName('');
            loadData();
        } catch (e) { showToast('Lỗi tạo lớp', 'error'); }
    };

    const handleViewStudents = async (cls: any) => {
        setSelectedClassStudents(cls);
        setShowStudentsModal(true);
        setStudents([]);
        setLoadingStudents(true);
        try {
            const list = await getClassStudents(cls.id);
            setStudents(list);
        } catch (e) { showToast('Lỗi tải danh sách học sinh', 'error'); }
        finally { setLoadingStudents(false); }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!selectedClassStudents) return;
        if (!confirm('Xóa học sinh này khỏi lớp?')) return;
        try {
            await removeStudent(selectedClassStudents.id, studentId);
            showToast('Đã xóa học sinh khỏi lớp', 'success');
            const list = await getClassStudents(selectedClassStudents.id);
            setStudents(list);
        } catch (e) { showToast('Lỗi khi xóa học sinh', 'error'); }
    };

    const handleDeleteClass = async (classId: string, className: string) => {
        if (!confirm(`Xóa lớp "${className}"?`)) return;
        try {
            await deleteClass(classId);
            showToast('Đã xóa lớp học thành công', 'success');
            loadData();
        } catch (e) { showToast('Lỗi xóa lớp: ' + (e as Error).message, 'error'); }
    };

    const handleOpenHomework = (cls: any) => {
        navigate(`/teacher/assignments/new?classId=${cls.id}`);
    };

    // ---- Content Manager ----
    const handleOpenContentManager = () => {
        if (!myAssignments || myAssignments.length === 0) return showToast('Chưa được phân công khóa học nào', 'warning');
        setShowContentModal(true);
        setContentViewMode('courses');
        setContentData(myAssignments);
    };

    const handleSelectContentCourse = async (course: any) => {
        setSelectedContentCourse(course);
        setContentViewMode('lessons');
        setLoadingContent(true);
        try {
            // Use cached lessons if available, otherwise fetch
            let list = course.lessons || [];
            if (list.length === 0 && course.id) {
                list = await getLessons(course.id);
            }
            list.sort((a: any, b: any) => (a.lesson_number || 0) - (b.lesson_number || 0));
            setContentData(list);
        } catch (e) { showToast('Lỗi tải bài học', 'error'); }
        finally { setLoadingContent(false); }
    };

    const handleSelectContentLesson = async (lesson: any) => {
        setSelectedContentLesson(lesson);
        setContentViewMode('content');
        setActiveContentTab('vocabulary');
        loadLessonContent(lesson.id, 'vocabulary');
    };

    const loadLessonContent = async (lessonId: string, type: TabType) => {
        setLoadingContent(true);
        try {
            let data: any[] = [];
            switch (type) {
                case 'vocabulary': data = await getVocabulary(lessonId); break;
                case 'kanji': data = await getKanji(lessonId); break;
                case 'grammar': data = await getGrammar(lessonId); break;
                case 'listening': data = await getListeningExercises(lessonId); break;
                case 'games': data = await getSentenceGames(lessonId); break;
                case 'roleplay': data = await getRoleplayScenarios(lessonId); break;
            }
            setContentData(data);
        } catch (e) { showToast('Lỗi tải nội dung', 'error'); }
        finally { setLoadingContent(false); }
    };

    const handleTabChange = (tab: TabType) => {
        setActiveContentTab(tab);
        if (selectedContentLesson) loadLessonContent(selectedContentLesson.id, tab);
    };

    const handleSaveContent = async (id: string | null, data: any) => {
        try {
            let result: any;
            const isNew = !id;
            if (isNew && selectedContentLesson) data.lesson_id = selectedContentLesson.id;
            switch (activeContentTab) {
                case 'vocabulary': result = isNew ? await createVocabulary(data) : await updateVocabulary(id!, data); break;
                case 'kanji': result = isNew ? await createKanji(data) : await updateKanji(id!, data); break;
                case 'grammar': result = isNew ? await createGrammar(data) : await updateGrammar(id!, data); break;
                case 'listening': result = isNew ? await createListeningExercise(data) : await updateListeningExercise(id!, data); break;
                case 'games': result = isNew ? await createSentenceGame(data) : await updateSentenceGame(id!, data); break;
                case 'roleplay': result = isNew ? await createRoleplayScenario(data) : await updateRoleplayScenario(id!, data); break;
            }
            if (result?.error) throw result.error;
            showToast(isNew ? 'Tạo thành công' : 'Cập nhật thành công', 'success');
            setShowAdminForm(false);
            setEditingContentItem(null);
            if (selectedContentLesson) loadLessonContent(selectedContentLesson.id, activeContentTab);
        } catch (e) { showToast('Lỗi: ' + (e as any).message, 'error'); }
    };

    const handleDeleteContent = async (id: string) => {
        if (!confirm('Xóa bản ghi này?')) return;
        try {
            let result: any;
            switch (activeContentTab) {
                case 'vocabulary': result = await deleteVocabulary(id); break;
                case 'kanji': result = await deleteKanji(id); break;
                case 'grammar': result = await deleteGrammar(id); break;
                case 'listening': result = await deleteListeningExercise(id); break;
                case 'games': result = await deleteSentenceGame(id); break;
                case 'roleplay': result = await deleteRoleplayScenario(id); break;
            }
            if (result?.error) throw result.error;
            showToast('Xóa thành công', 'success');
            if (selectedContentLesson) loadLessonContent(selectedContentLesson.id, activeContentTab);
        } catch (e) { showToast('Lỗi xóa', 'error'); }
    };

    const totalStudents = classes.reduce((acc, c) => acc + (c.student_count || 0), 0);
    const langBadge = (lang: string) => lang === 'japanese' ? 'jp' : 'cn';

    // ---- Render Helpers ----
    const renderStudentModal = () => (
        <div className="td-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowStudentsModal(false); }}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="td-modal wide"
            >
                <div className="td-modal-head">
                    <div className="td-modal-title">
                        <span>👥</span>
                        Học sinh lớp {selectedClassStudents?.name}
                        <span className={`td-cm-chip ${langBadge(selectedClassStudents?.language)}`}>
                            {selectedClassStudents?.language === 'japanese' ? '🇯🇵' : '🇨🇳'} {selectedClassStudents?.level}
                        </span>
                    </div>
                    <button className="td-modal-close" onClick={() => setShowStudentsModal(false)}>✕</button>
                </div>
                <div className="td-modal-body">
                    {loadingStudents ? (
                        <div className="td-loading"><div className="td-spinner" /><span className="td-loading-text">Đang tải...</span></div>
                    ) : students.length === 0 ? (
                        <div className="td-empty" style={{ borderStyle: 'dashed' }}>
                            <span className="td-empty-icon">🎓</span>
                            <h3>Chưa có học viên</h3>
                            <p>Lớp học hiện chưa có học viên nào tham gia.</p>
                        </div>
                    ) : (
                        students.map((stu) => (
                            <div key={stu.user_id} className="td-student-row">
                                <div className="td-student-avatar">
                                    {(stu.full_name || stu.email || '?')[0].toUpperCase()}
                                </div>
                                <div className="td-student-info">
                                    <div className="td-student-name">{stu.full_name || 'Chưa đặt tên'}</div>
                                    <div className="td-student-email">{stu.email}</div>
                                </div>
                                <div className="td-student-date">{new Date(stu.joined_at).toLocaleDateString('vi-VN')}</div>
                                <button
                                    className="td-btn-icon danger"
                                    title="Xóa khỏi lớp"
                                    onClick={() => handleRemoveStudent(stu.user_id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );

    const renderCreateModal = () => (
        <div className="td-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="td-modal"
            >
                <div className="td-modal-head">
                    <div className="td-modal-title">
                        <span>🏫</span> Tạo lớp học mới
                    </div>
                    <button className="td-modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
                </div>
                <div className="td-modal-body">
                    <div className="td-form-group">
                        <label>Tên lớp học</label>
                        <input
                            type="text"
                            className="td-form-input"
                            placeholder="VD: N5 Cấp tốc – Tối 2-4-6"
                            value={newClassName}
                            onChange={e => setNewClassName(e.target.value)}
                        />
                    </div>
                    <div className="td-form-group">
                        <label>Giáo trình</label>
                        <select
                            className="td-form-select"
                            value={newClassLevel}
                            onChange={e => {
                                setNewClassLevel(e.target.value);
                                if (e.target.value.startsWith('N')) setNewClassLang('japanese');
                                if (e.target.value.startsWith('HSK')) setNewClassLang('chinese');
                            }}
                        >
                            {myAssignments.map(a => (
                                <option key={a.assignment_id || a.level} value={a.level}>
                                    {a.title || a.level} ({a.language === 'japanese' ? '🇯🇵' : '🇨🇳'})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="td-form-hint">
                        Ngôn ngữ sẽ được tự động xác định dựa trên cấp độ bạn chọn.
                    </div>
                </div>
                <div className="td-modal-foot">
                    <button className="td-btn td-btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
                    <button className="td-btn td-btn-primary" onClick={handleCreateClass}>Xác nhận tạo lớp</button>
                </div>
            </motion.div>
        </div>
    );

    const renderContentManager = () => {
        if (contentViewMode === 'courses') return (
            <div className="td-cm-body">
                <div>
                    <div className="td-cm-breadcrumb">
                        <span className="td-cm-chip" style={{ fontSize: '0.875rem' }}>✏️ Content Manager</span>
                    </div>
                    <h2 className="td-cm-title">Chọn khóa học để chỉnh sửa</h2>
                    <p className="td-cm-sub">{contentData.length} khóa học khả dụng</p>
                </div>
                <div className="td-cm-course-grid">
                    {contentData.map((course) => (
                        <div
                            key={course.id}
                            onClick={() => handleSelectContentCourse(course)}
                            className="td-cm-course-card"
                        >
                            <div className="td-cm-course-card-top">
                                <span className="td-cm-course-flag">{course.language === 'japanese' ? '🇯🇵' : '🇨🇳'}</span>
                                <span className={`td-cm-course-level ${langBadge(course.language)}`}>{course.level}</span>
                            </div>
                            <h3 className="td-cm-course-title">{course.title}</h3>
                            <p className="td-cm-course-desc">
                                {course.description || 'Chương trình giảng dạy chuẩn hóa, tối ưu cho việc học ngoại ngữ.'}
                            </p>
                            <div className="td-cm-course-cta">
                                Chỉnh sửa nội dung <span>→</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

        if (contentViewMode === 'lessons') return (
            <div className="td-cm-body">
                <div>
                    <div className="td-cm-breadcrumb">
                        <button onClick={() => { setContentViewMode('courses'); setContentData(myAssignments); }}>Khóa học</button>
                        <span className="sep">›</span>
                        <span className="current">{selectedContentCourse?.title}</span>
                    </div>
                    <h2 className="td-cm-title">Danh sách bài học</h2>
                    <p className="td-cm-sub">{contentData.length} bài học</p>
                </div>
                <div className="td-cm-table-card">
                    {loadingContent ? (
                        <div className="td-loading"><div className="td-spinner" /><span className="td-loading-text">Đang tải...</span></div>
                    ) : contentData.length === 0 ? (
                        <div className="td-empty" style={{ margin: '1rem' }}>
                            <span className="td-empty-icon">📭</span>
                            <h3>Chưa có bài học nào</h3>
                            <p>Lớp này chưa có bài học nào được tạo.</p>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }}>STT</th>
                                    <th>Tên bài học</th>
                                    <th>Mô tả</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contentData.map(lesson => (
                                    <tr key={lesson.id} onClick={() => handleSelectContentLesson(lesson)}>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--t-text-muted)' }}>
                                            #{lesson.lesson_number}
                                        </td>
                                        <td style={{ fontWeight: 700 }}>{lesson.title}</td>
                                        <td style={{ color: 'var(--t-text-secondary)', fontSize: '0.825rem' }}>
                                            {lesson.description || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );

        // contentViewMode === 'content'
        return (
            <div className="td-cm-body">
                <div>
                    <div className="td-cm-breadcrumb">
                        <button onClick={() => { setContentViewMode('courses'); setContentData(myAssignments); }}>Khóa học</button>
                        <span className="sep">›</span>
                        <button onClick={() => handleSelectContentCourse(selectedContentCourse)}>{selectedContentCourse?.title}</button>
                        <span className="sep">›</span>
                        <span className="current">{selectedContentLesson?.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h2 className="td-cm-title" style={{ margin: 0 }}>{selectedContentLesson?.title}</h2>
                        <span className="td-cm-chip">{selectedContentLesson?.lesson_number}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="td-cm-tabs">
                    {CONTENT_TABS.map(tab => (
                        <button
                            key={tab}
                            className={`td-cm-tab ${activeContentTab === tab ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab)}
                        >
                            {getTypeLabel(tab)}
                        </button>
                    ))}
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className="td-btn td-btn-primary"
                        onClick={() => { setEditingContentItem(null); setShowAdminForm(true); }}
                    >
                        + Thêm mới
                    </button>
                </div>

                {/* Content */}
                {loadingContent ? (
                    <div className="td-loading"><div className="td-spinner" /><span className="td-loading-text">Đang tải...</span></div>
                ) : contentData.length === 0 ? (
                    <div className="td-empty">
                        <span className="td-empty-icon">📦</span>
                        <h3>Chưa có dữ liệu</h3>
                        <p>Thêm bản ghi đầu tiên để bắt đầu.</p>
                        <button
                            className="td-btn td-btn-primary"
                            style={{ margin: '0 auto' }}
                            onClick={() => { setEditingContentItem(null); setShowAdminForm(true); }}
                        >
                            + Thêm bản ghi
                        </button>
                    </div>
                ) : (
                    <div className="td-cm-content-grid">
                        {contentData.map((item, idx) => {
                            const word = item.word || item.character || item.pattern || item.title || item.sentence || '—';
                            const meaning = item.meaning || item.explanation || item.description || '';
                            const sub = item.hiragana || (item.onyomi ? `On: ${item.onyomi}` : '') || (item.furigana || '');
                            return (
                                <div key={item.id || idx} className="td-cm-content-card">
                                    <div className="td-cm-content-card-head">
                                        <span className="td-cm-content-num">#{idx + 1}</span>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button
                                                className="td-btn-icon"
                                                title="Sửa"
                                                onClick={() => { setEditingContentItem(item); setShowAdminForm(true); }}
                                            >✏️</button>
                                            <button
                                                className="td-btn-icon danger"
                                                title="Xóa"
                                                onClick={() => handleDeleteContent(item.id)}
                                            >🗑️</button>
                                        </div>
                                    </div>
                                    <div className="td-cm-content-word">{word}</div>
                                    {sub && <div className="td-cm-content-sub">{sub}</div>}
                                    {meaning && <div className="td-cm-content-meaning">{meaning}</div>}
                                    {item.example && (
                                        <div className="td-cm-content-example">"{item.example}"</div>
                                    )}
                                    {item.example_sentence && (
                                        <div className="td-cm-content-example">"{item.example_sentence}"</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    if (!isTeacher) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="td-empty">
                    <span className="td-empty-icon">🔒</span>
                    <h3>Không có quyền truy cập</h3>
                    <p>Bạn không có quyền truy cập trang này.</p>
                    <Link to="/" className="td-btn td-btn-primary">Về trang chủ</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="td-wrap">
            {/* ---- Topbar ---- */}
            <header className="td-topbar">
                <Link to="/" className="td-logo">
                    <div className="td-logo-icon">🎓</div>
                    <div>
                        <div className="td-logo-text">Teacher Panel</div>
                        <div className="td-logo-sub">Quản lý giảng dạy</div>
                    </div>
                </Link>

                <nav className="td-topnav">
                    <button className="td-nav-btn active">📚 Quản lý</button>
                </nav>

                <div className="td-topbar-actions">
                    <Link to="/" className="td-btn td-btn-secondary" style={{ height: '36px', padding: '0 0.875rem', fontSize: '0.8rem' }}>
                        🏠 Trang chủ
                    </Link>
                    <button className="td-btn-ghost" onClick={signOut} title="Đăng xuất">🚪</button>
                </div>
            </header>

            {/* ---- Page ---- */}
            <main className="td-page">
                {/* Loading */}
                {loading ? (
                    <div className="td-loading">
                        <div className="td-spinner" />
                        <span className="td-loading-text">Đang tải dữ liệu...</span>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="td-stats">
                            <div className="td-stat-card">
                                <div className="td-stat-icon red">🏫</div>
                                <div>
                                    <div className="td-stat-label">Lớp học</div>
                                    <div className="td-stat-value">{classes.length}</div>
                                </div>
                            </div>
                            <div className="td-stat-card">
                                <div className="td-stat-icon blue">👥</div>
                                <div>
                                    <div className="td-stat-label">Học sinh</div>
                                    <div className="td-stat-value">{totalStudents}</div>
                                </div>
                            </div>
                            <div className="td-stat-card">
                                <div className="td-stat-icon green">📝</div>
                                <div>
                                    <div className="td-stat-label">Bài tập</div>
                                    <div className="td-stat-value">{assignmentsList.length + homeworkList.length}</div>
                                </div>
                            </div>
                        </div>

                        {/* Section 1: Teaching Assignments */}
                        <section className="td-section">
                            <div className="td-section-head">
                                <h2 className="td-section-title">📚 Phân công giảng dạy</h2>
                            </div>
                            {myAssignments.length === 0 ? (
                                <div className="td-empty">
                                    <span className="td-empty-icon">📭</span>
                                    <h3>Chưa có phân công</h3>
                                    <p>Liên hệ Admin để nhận giáo trình.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {myAssignments.map((a) => (
                                        <span
                                            key={a.id || a.level}
                                            className={`td-cm-chip ${langBadge(a.language)}`}
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 700, borderRadius: '99px' }}
                                        >
                                            {a.language === 'japanese' ? '🇯🇵' : '🇨🇳'} {a.title || a.level}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Section 2: Classes */}
                        <section className="td-section">
                            <div className="td-section-head">
                                <h2 className="td-section-title">🏫 Lớp học đang phụ trách</h2>
                                <button className="td-btn td-btn-primary" onClick={() => setShowCreateModal(true)}>
                                    + Tạo lớp mới
                                </button>
                            </div>
                            {classes.length === 0 ? (
                                <div className="td-empty">
                                    <span className="td-empty-icon">🏫</span>
                                    <h3>Chưa có lớp học</h3>
                                    <p>Tạo lớp mới để bắt đầu quản lý học sinh và giao bài tập.</p>
                                    <button className="td-btn td-btn-primary" onClick={() => setShowCreateModal(true)}>
                                        + Tạo lớp ngay
                                    </button>
                                </div>
                            ) : (
                                <div className="td-class-grid">
                                    {classes.map((cls) => (
                                        <div key={cls.id} className="td-class-card">
                                            <div className="td-class-card-top">
                                                <h3 className="td-class-card-title">{cls.name}</h3>
                                                <span className={`td-class-badge ${langBadge(cls.language)}`}>
                                                    {cls.language === 'japanese' ? '🇯🇵' : '🇨🇳'} {cls.level}
                                                </span>
                                            </div>
                                            <div className="td-class-info">
                                                <div className="td-class-info-row">
                                                    <span>🔑</span>
                                                    <span>Mã lớp:</span>
                                                    <strong style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{cls.code}</strong>
                                                </div>
                                                <div className="td-class-info-row">
                                                    <span>📅</span>
                                                    <span>Tạo ngày:</span>
                                                    <span>{new Date(cls.created_at).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <div className="td-class-info-row">
                                                    <span>👥</span>
                                                    <span style={{ fontWeight: 700, color: 'var(--t-text)' }}>
                                                        {cls.student_count || 0} học viên
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="td-class-footer">
                                                <button
                                                    className="td-btn td-btn-secondary"
                                                    onClick={() => handleViewStudents(cls)}
                                                >
                                                    👥 Học sinh
                                                </button>
                                                <button
                                                    className="td-btn td-btn-primary"
                                                    onClick={() => handleOpenHomework(cls)}
                                                >
                                                    📝 Giao bài
                                                </button>
                                                <button
                                                    className="td-btn-icon danger"
                                                    title="Xóa lớp"
                                                    onClick={() => handleDeleteClass(cls.id, cls.name)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Section 3: Assignments */}
                        <section className="td-section">
                            <div className="td-section-head">
                                <h2 className="td-section-title">⚡ Quản lý Hoạt động</h2>
                                <Link to="/teacher/assignments/new" className="td-btn td-btn-primary">
                                    🎥 Tạo bài tập Media
                                </Link>
                            </div>
                            <div className="td-assign-grid">
                                {/* Fast Homework */}
                                <div className="td-assign-card">
                                    <div className="td-assign-card-head">
                                        <span>📝</span> Bài tập nhanh
                                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--t-text-muted)' }}>
                                            {homeworkList.length}
                                        </span>
                                    </div>
                                    <div className="td-assign-card-body">
                                        {homeworkList.length === 0 ? (
                                            <div className="td-assign-empty">
                                                <span className="td-assign-empty-icon">📝</span>
                                                Chưa có bài tập nhanh nào.
                                            </div>
                                        ) : (
                                            homeworkList.map(hw => (
                                                <div key={hw.id} className="td-assign-item">
                                                    <div className="td-assign-item-icon">📝</div>
                                                    <div className="td-assign-item-info">
                                                        <div className="td-assign-item-title">{hw.title}</div>
                                                        <div className="td-assign-item-meta">
                                                            Lớp: {hw.classes?.name} • Hạn: {hw.due_date ? new Date(hw.due_date).toLocaleDateString('vi-VN') : 'Không'}
                                                        </div>
                                                    </div>
                                                    <div className="td-assign-item-actions">
                                                        <Link to={`/assignments/${hw.id}`} className="td-btn td-btn-secondary" style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.775rem' }}>
                                                            Chi tiết
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Media Assignments */}
                                <div className="td-assign-card">
                                    <div className="td-assign-card-head">
                                        <span>🎥</span> Bài tập Media
                                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--t-text-muted)' }}>
                                            {assignmentsList.length}
                                        </span>
                                    </div>
                                    <div className="td-assign-card-body">
                                        {assignmentsList.length === 0 ? (
                                            <div className="td-assign-empty">
                                                <span className="td-assign-empty-icon">🎥</span>
                                                Chưa có bài tập Media nào.
                                            </div>
                                        ) : (
                                            assignmentsList.map(asg => (
                                                <div key={asg.id} className="td-assign-item">
                                                    <div className="td-assign-item-icon">🎥</div>
                                                    <div className="td-assign-item-info">
                                                        <div className="td-assign-item-title">{asg.title}</div>
                                                        <div className="td-assign-item-meta">
                                                            {asg.questions?.length || 0} câu • {new Date(asg.created_at).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </div>
                                                    <div className="td-assign-item-actions">
                                                        <button
                                                            className="td-btn td-btn-secondary"
                                                            style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.775rem' }}
                                                            onClick={() => navigate(`/teacher/submissions/${asg.id}`)}
                                                        >
                                                            Kết quả
                                                        </button>
                                                        <button
                                                            className="td-btn-icon"
                                                            title="Sửa"
                                                            onClick={() => navigate(`/teacher/assignments/edit/${asg.id}`)}
                                                        >✏️</button>
                                                        <button
                                                            className="td-btn-icon danger"
                                                            title="Xóa"
                                                            onClick={async () => {
                                                                if (confirm('Xóa bài tập này?')) {
                                                                    await deleteAssignment(asg.id);
                                                                    loadData();
                                                                }
                                                            }}
                                                        >🗑️</button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Content Manager Hero */}
                        {myAssignments.length > 0 && (
                            <section className="td-section">
                                <div className="td-class-card" style={{
                                    background: 'linear-gradient(135deg, var(--t-primary), #f472b6)',
                                    color: 'white',
                                    textAlign: 'center',
                                    padding: '3rem 2rem',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }} onClick={handleOpenContentManager}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✏️</div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Xây dựng Nội dung Giáo trình</h2>
                                    <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: '0 0 1.5rem', maxWidth: '600px' }}>
                                        Tùy chỉnh từ vựng, ngữ pháp và bài tập cho các khóa học bạn phụ trách.
                                    </p>
                                    <button
                                        className="td-btn"
                                        style={{ background: 'white', color: 'var(--t-primary)', fontSize: '1rem', padding: '0.75rem 2rem', height: 'auto' }}
                                    >
                                        ✨ Bắt đầu chỉnh sửa ngay
                                    </button>
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>

            {/* ---- Modals ---- */}
            <AnimatePresence>
                {showCreateModal && renderCreateModal()}
                {showStudentsModal && renderStudentModal()}
            </AnimatePresence>

            {/* ---- Content Manager Fullscreen ---- */}
            <AnimatePresence>
                {showContentModal && (
                    <motion.div
                        className="td-cm-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="td-cm-topbar">
                            <div className="td-cm-topbar-left">
                                <div style={{ fontSize: '1.1rem' }}>✏️</div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Content Manager</div>
                                    <div style={{ fontSize: '0.725rem', color: 'var(--t-text-muted)' }}>
                                        {selectedContentCourse?.title || 'Chọn khóa học'}
                                    </div>
                                </div>
                            </div>
                            <div className="td-cm-topbar-right">
                                <button className="td-btn-ghost" onClick={() => setShowContentModal(false)} title="Đóng">
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            {renderContentManager()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ---- Admin Form ---- */}
            <AnimatePresence>
                {showAdminForm && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 500 }}>
                        <AdminForm
                            type={activeContentTab}
                            item={editingContentItem}
                            courses={myAssignments}
                            lessons={[]}
                            currentLanguage={selectedContentCourse?.language}
                            currentCourse={selectedContentCourse}
                            currentLevel={selectedContentCourse?.level}
                            currentLesson={selectedContentLesson}
                            onSave={(arg1: any, arg2: any) => arg2 ? handleSaveContent(arg1, arg2) : handleSaveContent(null, arg1)}
                            onCancel={() => setShowAdminForm(false)}
                        />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherDashboard;
