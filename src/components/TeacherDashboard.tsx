import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { getTeacherAssignments as getTeachingAssignments } from '../services/adminService';
import { getTeacherClasses, createClass as createClassService, getClassStudents, removeStudent, deleteClass } from '../services/classService';
import { createHomework, getTeacherHomework } from '../services/homeworkService';
import { getTeacherAssignments as getMediaAssignments, deleteAssignment } from '../services/assignmentService';
import { supabase } from '../config/supabase';
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
import { motion, AnimatePresence } from 'framer-motion';

const TeacherDashboard = () => {
    const { user, isTeacher, signOut, profile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [assignmentsList, setAssignmentsList] = useState<any[]>([]); // Media assignments list
    const [homeworkList, setHomeworkList] = useState<any[]>([]); // Fast homework list
    const [myAssignments, setMyAssignments] = useState<any[]>([]); // teaching assignments (courses)
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Class State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassLevel, setNewClassLevel] = useState('');
    const [newClassLang, setNewClassLang] = useState<'japanese' | 'chinese'>('japanese');

    // View Students State
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [selectedClassStudents, setSelectedClassStudents] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Assign Homework State
    const [showHomeworkModal, setShowHomeworkModal] = useState(false);
    const [selectedClassHomework, setSelectedClassHomework] = useState<any>(null);
    const [homeworkForm, setHomeworkForm] = useState({ title: '', description: '', due_date: '' });

    // Content Management State
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
        if (user?.email) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            // 1. Fetch academic data & teacher assignments (courses)
            const [classesData, coursesData, teacherAsgnData, hwData, asgData] = await Promise.all([
                getTeacherClasses(user.id),
                getCourses(),
                getTeachingAssignments(user.email),
                getTeacherHomework(user.id),
                getMediaAssignments(user.id) // Need to import or use assignmentService
            ]);

            // 2. Map teaching assignments to course objects
            const courseMap = new Map();
            teacherAsgnData.forEach((assign: any) => {
                const matchedCourse = coursesData?.find((c: any) =>
                    c.id === assign.course_id || (c.level === assign.level && c.language === assign.language)
                );
                if (matchedCourse && !courseMap.has(matchedCourse.id)) {
                    courseMap.set(matchedCourse.id, {
                        ...assign,
                        ...matchedCourse,
                        assignment_id: assign.id
                    });
                }
            });

            const resolvedCourses = Array.from(courseMap.values());
            setMyAssignments(resolvedCourses);
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

    const handleCreateClass = async () => {
        if (!newClassName || !newClassLevel) {
            showToast('Vui lòng điền tên lớp và cấp độ', 'warning');
            return;
        }

        try {
            await createClassService({
                name: newClassName,
                level: newClassLevel,
                language: newClassLang,
                teacher_id: user!.id
            });
            showToast('Tạo lớp thành công!', 'success');
            setShowCreateModal(false);
            setNewClassName('');
            loadData();
        } catch (e) {
            showToast('Lỗi tạo lớp', 'error');
        }
    };

    const handleViewStudents = async (cls: any) => {
        setSelectedClassStudents(cls);
        setShowStudentsModal(true);
        setStudents([]);
        setLoadingStudents(true);
        try {
            const list = await getClassStudents(cls.id);
            setStudents(list);
        } catch (e) {
            showToast('Lỗi tải danh sách học sinh', 'error');
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!selectedClassStudents) return;
        if (!confirm('Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?')) return;

        try {
            await removeStudent(selectedClassStudents.id, studentId);
            showToast('Đã xóa học sinh khỏi lớp', 'success');
            // Refresh student list
            const list = await getClassStudents(selectedClassStudents.id);
            setStudents(list);
        } catch (e) {
            console.error(e);
            showToast('Lỗi khi xóa học sinh', 'error');
        }
    };

    const handleDeleteClass = async (classId: string, className: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa lớp "${className}"? Tất cả học sinh và bài tập của lớp này sẽ bị xóa.`)) return;

        try {
            await deleteClass(classId);
            showToast('Đã xóa lớp học thành công', 'success');
            loadData();
        } catch (e) {
            console.error(e);
            showToast('Lỗi khi xóa lớp học: ' + (e as Error).message, 'error');
        }
    };

    const handleOpenHomework = (cls: any) => {
        navigate(`/teacher/assignments/new?classId=${cls.id}`);
    };

    const handleSubmitHomework = async () => {
        if (!homeworkForm.title) return showToast('Vui lòng nhập tiêu đề', 'warning');
        try {
            await createHomework({
                class_id: selectedClassHomework.id,
                teacher_id: user!.id,
                title: homeworkForm.title,
                description: homeworkForm.description,
                due_date: homeworkForm.due_date ? new Date(homeworkForm.due_date).toISOString() : undefined,
            });
            showToast('Giao bài tập thành công!', 'success');
            setShowHomeworkModal(false);
        } catch (e) {
            console.error(e);
            showToast('Lỗi giao bài', 'error');
        }
    };

    // ================= CONTENT MANAGEMENT HANDLERS =================
    const handleOpenContentManager = () => {
        if (!myAssignments || myAssignments.length === 0) return showToast('Bạn chưa được phân công khóa học nào', 'warning');
        setShowContentModal(true);
        setContentViewMode('courses');
        setContentData(myAssignments);
    };

    const handleSelectContentCourse = async (course: any) => {
        setSelectedContentCourse(course);
        setContentViewMode('lessons');
        setLoadingContent(true);
        try {
            const list = await getLessons(course.id);
            list.sort((a: any, b: any) => a.lesson_number - b.lesson_number);
            setContentData(list);
        } catch (e) {
            showToast('Lỗi tải bài học', 'error');
        } finally {
            setLoadingContent(false);
        }
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
            let data = [];
            switch (type) {
                case 'vocabulary': data = await getVocabulary(lessonId); break;
                case 'kanji': data = await getKanji(lessonId); break;
                case 'grammar': data = await getGrammar(lessonId); break;
                case 'listening': data = await getListeningExercises(lessonId); break;
                case 'games': data = await getSentenceGames(lessonId); break;
                case 'roleplay': data = await getRoleplayScenarios(lessonId); break;
            }
            setContentData(data);
        } catch (e) {
            showToast('Lỗi tải nội dung', 'error');
        } finally {
            setLoadingContent(false);
        }
    };

    const handleTabChange = (tab: TabType) => {
        setActiveContentTab(tab);
        if (selectedContentLesson) {
            loadLessonContent(selectedContentLesson.id, tab);
        }
    };

    const handleSaveContent = async (id: string | null, data: any) => {
        try {
            let result: any;
            const isNew = !id;

            if (isNew && selectedContentLesson) {
                data.lesson_id = selectedContentLesson.id;
            }

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
        } catch (e) {
            console.error(e);
            showToast('Lỗi lưu dữ liệu: ' + (e as any).message, 'error');
        }
    };

    const handleDeleteContent = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
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
        } catch (e) {
            showToast('Lỗi xóa dữ liệu', 'error');
        }
    };

    if (!isTeacher) {
        return <div className="p-8 text-center">Bạn không có quyền truy cập trang này.</div>;
    }

    return (
        <div className="teacher-dashboard-container">
            {/* High-End Header */}
            <motion.header
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="teacher-header"
            >
                <div className="teacher-title-area">
                    <div className="teacher-logo-icon">🎓</div>
                    <div>
                        <h1>Teacher Panel</h1>
                        <span className="teacher-badge">
                            GV: {profile?.full_name || user?.email?.split('@')[0]}
                        </span>
                    </div>
                </div>
                <div className="teacher-header-actions">
                    <Link to="/" className="teacher-btn btn-secondary">
                        <span>🏠</span>
                        <span className="hidden-mobile">Về trang chủ</span>
                    </Link>
                    <button onClick={signOut} className="teacher-btn btn-danger">
                        <span>🚪</span>
                        <span className="hidden-mobile">Đăng xuất</span>
                    </button>
                </div>
            </motion.header>

            <main className="teacher-main-content">
                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="teacher-stats-container"
                >
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: 'var(--teacher-primary)' }}>🏫</div>
                        <div className="stat-content">
                            <h4>Lớp học</h4>
                            <p>{classes.length}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: 'var(--teacher-secondary)' }}>👥</div>
                        <div className="stat-content">
                            <h4>Học sinh</h4>
                            <p>{classes.reduce((acc, c) => acc + (c.student_count || 0), 0)}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: 'var(--teacher-accent)' }}>📝</div>
                        <div className="stat-content">
                            <h4>Bài tập</h4>
                            <p>{assignmentsList.length + homeworkList.length}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Section 1: My Courses */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="teacher-section"
                >
                    <div className="teacher-section-header">
                        <h2 className="teacher-section-title">
                            <span>📚</span> Phân công giảng dạy
                        </h2>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {myAssignments.length === 0 ? (
                            <div className="no-data-card" style={{ width: '100%' }}>
                                <div className="stat-icon" style={{ fontSize: '3rem' }}>🚫</div>
                                <h3>Chưa có phân công</h3>
                                <p>Bạn chưa được phân công khóa học nào. Vui lòng liên hệ Admin để nhận giáo trình.</p>
                            </div>
                        ) : (
                            myAssignments.map((a, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    className="teacher-badge"
                                    style={{
                                        padding: '1rem 2rem',
                                        background: 'var(--teacher-glass)',
                                        fontSize: '1.1rem',
                                        border: '1px solid var(--teacher-primary)'
                                    }}
                                >
                                    {a.language === 'japanese' ? '🇯🇵' : '🇨🇳'} {a.title || a.level}
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.section>

                {/* Section 2: My Classes */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="teacher-section"
                >
                    <div className="teacher-section-header">
                        <h2 className="teacher-section-title">
                            <span>🏫</span> Lớp học đang phụ trách
                        </h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="teacher-btn btn-primary"
                        >
                            <span>➕</span> Tạo lớp học mới
                        </button>
                    </div>

                    {classes.length === 0 ? (
                        <div className="no-data-card">
                            <div className="stat-icon" style={{ fontSize: '3rem' }}>🏫</div>
                            <h3>Chưa có lớp học</h3>
                            <p>Hãy tạo lớp mới để bắt đầu quản lý học sinh và giao bài tập.</p>
                            <button onClick={() => setShowCreateModal(true)} className="teacher-btn btn-primary">Tạo lớp ngay</button>
                        </div>
                    ) : (
                        <div className="teacher-grid">
                            {classes.map((cls, idx) => (
                                <motion.div
                                    key={cls.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="teacher-card"
                                >
                                    <div className="teacher-card-header">
                                        <h3 className="teacher-card-title">{cls.name}</h3>
                                        <span className="teacher-card-badge">
                                            {cls.language === 'japanese' ? 'JP' : 'CN'} {cls.level}
                                        </span>
                                    </div>

                                    <div className="teacher-card-info">
                                        <div className="info-item">
                                            <span>🔑</span>
                                            <span>Mã lớp: <strong>{cls.code}</strong></span>
                                        </div>
                                        <div className="info-item">
                                            <span>📅</span>
                                            <span>Tạo ngày: {new Date(cls.created_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>

                                    <div className="teacher-card-actions">
                                        <button onClick={() => handleViewStudents(cls)} className="teacher-btn btn-secondary">
                                            <span>👥</span> Học sinh
                                        </button>
                                        <button onClick={() => handleOpenHomework(cls)} className="teacher-btn btn-primary">
                                            <span>📝</span> Giao bài
                                        </button>
                                        <button onClick={() => handleDeleteClass(cls.id, cls.name)} className="teacher-btn btn-danger">
                                            <span>🗑️</span> Xóa
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.section>

                {/* Section 3: Homework & Media */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="teacher-section"
                >
                    <div className="teacher-section-header">
                        <h2 className="teacher-section-title">
                            <span>⚡</span> Quản lý Hoạt động
                        </h2>
                        <Link to="/teacher/assignments/new" className="teacher-btn btn-primary">
                            <span>🎥</span> Tạo bài tập Media
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Column: Fast Homework */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <span>📝</span> Bài tập nhanh
                            </h3>
                            {homeworkList.length === 0 ? (
                                <div className="no-data-card" style={{ padding: '2rem' }}>
                                    <p>Chưa có bài tập nhanh nào được giao.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {homeworkList.map((hw) => (
                                        <motion.div
                                            key={hw.id}
                                            whileHover={{ x: 10 }}
                                            className="teacher-grid-item-compact"
                                        >
                                            <div className="teacher-item-main">
                                                <div className="teacher-item-title">{hw.title}</div>
                                                <div className="teacher-item-meta">
                                                    Lớp: {hw.classes?.name} • Hạn: {hw.due_date ? new Date(hw.due_date).toLocaleDateString('vi-VN') : 'Không hạn'}
                                                </div>
                                            </div>
                                            <div className="teacher-item-actions">
                                                <Link to={`/assignments/${hw.id}`} className="teacher-btn-icon" title="Chi tiết">👁️</Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Column: Media Assignments */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <span>🎥</span> Bài tập Media
                            </h3>
                            {assignmentsList.length === 0 ? (
                                <div className="no-data-card" style={{ padding: '2rem' }}>
                                    <p>Chưa có bài tập Media nào được tạo.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {assignmentsList.map((asg) => (
                                        <motion.div
                                            key={asg.id}
                                            whileHover={{ x: 10 }}
                                            className="teacher-grid-item-compact"
                                        >
                                            <div className="teacher-item-main">
                                                <div className="teacher-item-title">{asg.title}</div>
                                                <div className="teacher-item-meta">
                                                    {asg.questions?.length || 0} câu hỏi • {new Date(asg.created_at).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                            <div className="teacher-item-actions">
                                                <button onClick={() => navigate(`/teacher/assignments/edit/${asg.id}`)} className="teacher-btn-icon">✏️</button>
                                                <button onClick={() => navigate(`/teacher/submissions/${asg.id}`)} className="teacher-btn-icon" style={{ color: 'var(--teacher-primary)' }}>👥</button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('Xóa bài tập này?')) {
                                                            await deleteAssignment(asg.id);
                                                            loadData();
                                                        }
                                                    }}
                                                    className="teacher-btn-icon"
                                                    style={{ color: 'var(--teacher-accent)' }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* Section 4: Content Manager Hero */}
                {myAssignments.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="teacher-section"
                    >
                        <div className="teacher-card" style={{
                            background: 'var(--teacher-gradient)',
                            color: 'white',
                            padding: '4rem',
                            textAlign: 'center',
                            alignItems: 'center'
                        }}>
                            <div className="stat-icon" style={{ fontSize: '4rem', background: 'rgba(255,255,255,0.2)', marginBottom: '1.5rem' }}>🛠️</div>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Xây dựng Nội dung Giáo trình</h2>
                            <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '700px', marginBottom: '2.5rem' }}>
                                Bạn có quyền hạn cao cấp để tùy chỉnh từ vựng, ngữ pháp và bài tập cho các khóa học mình phụ trách.
                                Hãy tạo nên những bài học chất lượng nhất cho học sinh của bạn.
                            </p>
                            <button
                                onClick={handleOpenContentManager}
                                className="teacher-btn"
                                style={{ background: 'white', color: 'var(--teacher-surface)', fontSize: '1.2rem', padding: '1.2rem 3rem' }}
                            >
                                Bắt đầu chỉnh sửa ngay ✨
                            </button>
                        </div>
                    </motion.section>
                )}
            </main>

            {/* Premium Float Action Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="btn-float-add"
                style={{ border: 'none' }}
            >
                +
            </motion.button>

            {/* Modals Container */}
            <AnimatePresence>
                {/* Create Class Modal */}
                {showCreateModal && (
                    <div className="premium-modal-overlay">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="premium-modal-content"
                        >
                            <div className="premium-modal-header">
                                <h3>🏫 Tạo lớp học mới</h3>
                                <button onClick={() => setShowCreateModal(false)} className="premium-modal-close">✕</button>
                            </div>
                            <div className="premium-modal-body">
                                <div className="space-y-6">
                                    <div className="form-group">
                                        <label className="admin-label">Tên lớp học</label>
                                        <input
                                            type="text"
                                            value={newClassName}
                                            onChange={e => setNewClassName(e.target.value)}
                                            className="search-input"
                                            style={{ width: '100%', border: '2px solid var(--border-color)' }}
                                            placeholder="VD: N5 Cấp tốc - Tối 2-4-6"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="admin-label">Lựa chọn Giáo trình</label>
                                        <select
                                            value={newClassLevel}
                                            onChange={e => {
                                                setNewClassLevel(e.target.value);
                                                if (e.target.value.startsWith('N')) setNewClassLang('japanese');
                                                if (e.target.value.startsWith('HSK')) setNewClassLang('chinese');
                                            }}
                                            className="search-input"
                                            style={{ width: '100%', border: '2px solid var(--border-color)', appearance: 'none' }}
                                        >
                                            {myAssignments.map(a => (
                                                <option key={a.assignment_id || a.level} value={a.level}>
                                                    {a.title || a.level} ({a.language === 'japanese' ? 'JP' : 'CN'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setShowCreateModal(false)} className="teacher-btn-secondary" style={{ flex: 1, color: 'var(--text-primary)' }}>Hủy</button>
                                        <button onClick={handleCreateClass} className="teacher-btn-card btn-primary" style={{ flex: 2, fontSize: '1rem' }}>Xác nhận tạo lớp</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* View Students Modal */}
                {showStudentsModal && selectedClassStudents && (
                    <div className="premium-modal-overlay">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="premium-modal-content"
                            style={{ maxWidth: '800px' }}
                        >
                            <div className="premium-modal-header">
                                <h3>👥 Học sinh lớp {selectedClassStudents.name}</h3>
                                <button onClick={() => setShowStudentsModal(false)} className="premium-modal-close">✕</button>
                            </div>
                            <div className="premium-modal-body">
                                {loadingStudents ? (
                                    <div className="py-20 text-center"><div className="animate-spin h-10 w-10 border-4 border-teacher-primary rounded-full border-t-transparent mx-auto"></div></div>
                                ) : students.length === 0 ? (
                                    <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                        <p className="text-slate-500 font-medium">Lớp học hiện chưa có học viên nào tham gia.</p>
                                    </div>
                                ) : (
                                    <div className="admin-table-container">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Học viên</th>
                                                    <th>Email</th>
                                                    <th>Ngày tham gia</th>
                                                    <th className="text-right">Hành động</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map((stu, i) => (
                                                    <tr key={i}>
                                                        <td>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-teacher-primary text-white rounded-full flex items-center justify-center font-bold">
                                                                    {(stu.full_name || stu.email || '?')[0].toUpperCase()}
                                                                </div>
                                                                <span className="font-bold">{stu.full_name || 'Chưa đặt tên'}</span>
                                                            </div>
                                                        </td>
                                                        <td>{stu.email}</td>
                                                        <td className="text-slate-500 font-medium">{new Date(stu.joined_at).toLocaleDateString('vi-VN')}</td>
                                                        <td className="text-right">
                                                            <button
                                                                onClick={() => handleRemoveStudent(stu.user_id)}
                                                                className="teacher-btn-card btn-outline"
                                                                style={{ padding: '0.4rem 0.8rem', color: '#ef4444', borderColor: '#fee2e2' }}
                                                                title="Xóa khỏi lớp"
                                                            >
                                                                🗑️ Xóa
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Assign Homework Modal */}
                {showHomeworkModal && selectedClassHomework && (
                    <div className="premium-modal-overlay">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="premium-modal-content"
                        >
                            <div className="premium-modal-header">
                                <h3>📝 Giao bài tập</h3>
                                <button onClick={() => setShowHomeworkModal(false)} className="premium-modal-close">✕</button>
                            </div>
                            <div className="premium-modal-body">
                                <p className="mb-6 text-slate-500 font-medium">Lớp: <span className="text-teacher-primary">{selectedClassHomework.name}</span></p>
                                <div className="space-y-6">
                                    <div className="form-group">
                                        <label className="admin-label">Tiêu đề bài tập *</label>
                                        <input
                                            type="text"
                                            value={homeworkForm.title}
                                            onChange={e => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
                                            className="search-input"
                                            style={{ width: '100%', border: '2px solid var(--border-color)' }}
                                            placeholder="VD: Luyện tập Kanji bài 1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="admin-label">Yêu cầu chi tiết</label>
                                        <textarea
                                            value={homeworkForm.description}
                                            onChange={e => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                                            className="search-input"
                                            style={{ width: '100%', border: '2px solid var(--border-color)', height: '120px', resize: 'none' }}
                                            placeholder="Ghi chú thêm cho học sinh..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="admin-label">Hạn nộp bài</label>
                                        <input
                                            type="datetime-local"
                                            value={homeworkForm.due_date}
                                            onChange={e => setHomeworkForm({ ...homeworkForm, due_date: e.target.value })}
                                            className="search-input"
                                            style={{ width: '100%', border: '2px solid var(--border-color)' }}
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setShowHomeworkModal(false)} className="teacher-btn-secondary" style={{ flex: 1, color: 'var(--text-primary)' }}>Hủy</button>
                                        <button onClick={handleSubmitHomework} className="teacher-btn-card btn-indigo" style={{ flex: 2, fontSize: '1rem' }}>Giao ngay</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Content Manager Modal (Fullscreen) */}
                {showContentModal && (
                    <div className="premium-modal-overlay fullscreen">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="premium-modal-content fullscreen"
                        >
                            <div className="premium-modal-header" style={{ borderRadius: 0 }}>
                                <div className="teacher-title-area">
                                    <h3>✏️ Content Manager</h3>
                                    {selectedContentCourse && <span className="teacher-badge">Khoá: {selectedContentCourse.title}</span>}
                                    {selectedContentLesson && <span className="teacher-badge">Bài: {selectedContentLesson.title}</span>}
                                </div>
                                <button onClick={() => setShowContentModal(false)} className="premium-modal-close">✕</button>
                            </div>

                            <div className="premium-modal-body" style={{ height: 'calc(100% - 80px)', overflowY: 'hidden', padding: 0 }}>
                                {contentViewMode === 'courses' && (
                                    <div className="p-8">
                                        <h2 className="teacher-section-title mb-6">Chọn khoá học để chỉnh sửa</h2>
                                        <div className="teacher-grid">
                                            {contentData.map(course => (
                                                <motion.div
                                                    key={course.id}
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => handleSelectContentCourse(course)}
                                                    className="teacher-card cursor-pointer group"
                                                >
                                                    <div className="teacher-card-header">
                                                        <h4 className="teacher-card-title group-hover:text-teacher-primary transition-colors">{course.title}</h4>
                                                        <span className="teacher-card-badge">{course.level}</span>
                                                    </div>
                                                    <p className="text-slate-500 text-sm">{course.description || 'Chưa có mô tả khoá học.'}</p>
                                                    <div className="mt-4 flex justify-end">
                                                        <span className="text-teacher-primary font-bold">Chỉnh sửa bài học &rarr;</span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {contentViewMode === 'lessons' && (
                                    <div className="p-8">
                                        <button onClick={() => { setContentViewMode('courses'); setContentData(myAssignments); }} className="content-back-btn mb-6">
                                            &larr; Trở lại danh sách khoá
                                        </button>
                                        <div className="admin-table-container">
                                            <table className="admin-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '100px' }}>STT</th>
                                                        <th>Tên bài học</th>
                                                        <th className="text-right">Hành động</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {contentData.map(lesson => (
                                                        <tr key={lesson.id}>
                                                            <td className="font-mono text-slate-400">#{lesson.lesson_number}</td>
                                                            <td className="font-bold">{lesson.title}</td>
                                                            <td className="text-right">
                                                                <button
                                                                    onClick={() => handleSelectContentLesson(lesson)}
                                                                    className="teacher-btn-card btn-outline"
                                                                    style={{ display: 'inline-flex', width: 'auto', padding: '0.5rem 1.5rem' }}
                                                                >
                                                                    Quản lý nội dung &rarr;
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {contentViewMode === 'content' && (
                                    <div className="content-manager-fullscreen">
                                        {/* Content Tabs Header */}
                                        <div className="content-tabs-container">
                                            <button onClick={() => handleSelectContentCourse(selectedContentCourse)} className="content-back-btn">
                                                &larr; Danh sách bài
                                            </button>

                                            <div className="content-tabs-scroll">
                                                {['vocabulary', 'kanji', 'grammar', 'listening', 'games', 'roleplay'].map(tab => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => handleTabChange(tab as TabType)}
                                                        className={`content-tab-btn ${activeContentTab === tab ? 'active' : ''}`}
                                                    >
                                                        {getTypeLabel(tab as TabType)}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="content-action-buttons">
                                                <button
                                                    onClick={() => { setEditingContentItem(null); setShowAdminForm(true); }}
                                                    className="teacher-btn-card btn-indigo"
                                                    style={{ width: 'auto', padding: '0.65rem 1.5rem' }}
                                                >
                                                    <span>+</span> Thêm mới
                                                </button>
                                            </div>
                                        </div>

                                        <div className="content-scroll-area">
                                            {loadingContent ? (
                                                <div className="py-20 text-center"><div className="animate-spin h-10 w-10 border-4 border-teacher-primary rounded-full border-t-transparent mx-auto"></div></div>
                                            ) : contentData.length === 0 ? (
                                                <div className="content-empty-state">
                                                    <div className="content-empty-icon">📂</div>
                                                    <p>Chưa có dữ liệu cho phần này.</p>
                                                    <button
                                                        onClick={() => { setEditingContentItem(null); setShowAdminForm(true); }}
                                                        className="content-back-btn"
                                                        style={{ color: 'var(--teacher-primary)' }}
                                                    >
                                                        Thêm bản ghi đầu tiên &rarr;
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="content-grid">
                                                    {contentData.map((item, idx) => (
                                                        <motion.div
                                                            key={item.id || idx}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="teacher-card group"
                                                        >
                                                            <div className="mb-4">
                                                                <h4 className="teacher-card-title" style={{ fontSize: '1.25rem' }}>
                                                                    {item.word || item.character || item.pattern || item.title || item.sentence || 'Dữ liệu'}
                                                                </h4>
                                                                <p className="text-secondary font-bold mt-2" style={{ color: 'var(--teacher-primary)' }}>
                                                                    {item.meaning || item.explanation || item.description || ''}
                                                                </p>
                                                            </div>
                                                            <div className="teacher-card-actions">
                                                                <button onClick={() => { setEditingContentItem(item); setShowAdminForm(true); }} className="teacher-btn-card btn-outline">✏️ Edit</button>
                                                                <button onClick={() => handleDeleteContent(item.id)} className="teacher-btn-card btn-outline" style={{ color: '#ef4444' }}>🗑️ Delete</button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {showAdminForm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
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
        </div>
    );
};

export default TeacherDashboard;
