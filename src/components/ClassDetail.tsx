import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { leaveClass } from '../services/classService';
import { getLessons } from '../services/supabaseService.v2';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/class-detail-premium.css';

// ── Types ────────────────────────────────────────────────────────────────────
interface TaskItem {
    id: string;
    source: 'homework' | 'assignment';
    title: string;
    description: string | null;
    due_date: string | null;
    created_at: string;
    status?: string;
    score?: number | null;
    lesson?: { title: string; course?: { title: string } };
    submissions?: any[];
}

interface CourseGroup {
    id: string;
    title: string;
    description: string | null;
    language: string;
    level: string;
    lessons: LessonItem[];
}

interface LessonItem {
    id: string;
    lesson_number: number;
    title: string;
    description: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDaysLeft(dueDate: string | null): { text: string; urgent: boolean; overdue: boolean } {
    if (!dueDate) return { text: 'Không có hạn', urgent: false, overdue: false };
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `Quá hạn ${Math.abs(diffDays)} ngày`, urgent: true, overdue: true };
    if (diffDays === 0) return { text: 'Hết hạn hôm nay', urgent: true, overdue: false };
    if (diffDays === 1) return { text: 'Còn 1 ngày', urgent: true, overdue: false };
    return { text: `Còn ${diffDays} ngày`, urgent: false, overdue: false };
}

function getProgressPercent(tasks: TaskItem[], submissions: Record<string, any>): number {
    if (tasks.length === 0) return 0;
    const done = tasks.filter(t => submissions[t.id]).length;
    return Math.round((done / tasks.length) * 100);
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
};

// ── Component ────────────────────────────────────────────────────────────────
const ClassDetail: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [classInfo, setClassInfo] = useState<any>(null);
    const [assignments, setAssignments] = useState<TaskItem[]>([]);
    const [submissions, setSubmissions] = useState<Record<string, any>>({});
    const [materialsByCourse, setMaterialsByCourse] = useState<Record<string, CourseGroup>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'homework' | 'materials'>('homework');

    const isTeacher = isAdmin;

    useEffect(() => {
        if (classId) loadClassData();
    }, [classId]);

    const loadClassData = async () => {
        setLoading(true);
        try {
            const { data: cls, error: clsError } = await supabase
                .from('classes')
                .select('*, course:courses(*)')
                .eq('id', classId)
                .single();

            if (clsError) throw clsError;

            let teacherProfile: any = null;
            if (cls.teacher_id) {
                const { data: prof } = await supabase
                    .from('profiles').select('full_name, email').eq('id', cls.teacher_id).maybeSingle();
                teacherProfile = prof;
            }

            const lessonsData = await getLessons(undefined, cls.language, cls.level, 1, 100);

            const lessonsByCourse: Record<string, CourseGroup> = {};
            lessonsData.data?.forEach((lesson: any) => {
                const courseId = lesson.course_id || lesson.course?.id || 'no-course';
                const course = lesson.course || { id: 'no-course', title: 'Tài liệu bổ sung', description: 'Các bài học lẻ ngoài khóa học', language: cls.language, level: cls.level };
                if (!lessonsByCourse[courseId]) {
                    lessonsByCourse[courseId] = { id: courseId, title: course.title, description: course.description, language: course.language, level: course.level, lessons: [] };
                }
                lessonsByCourse[courseId].lessons.push({
                    id: lesson.id,
                    lesson_number: lesson.lesson_number,
                    title: lesson.title,
                    description: lesson.description,
                });
            });

            const lessonIds = lessonsData.data?.filter((l: any) => l.id).map((l: any) => l.id) || [];

            const [hwRes, asgRes] = await Promise.all([
                supabase.from('homework').select('*').eq('class_id', classId).order('due_date', { ascending: true }),
                (async () => {
                    let q = supabase.from('assignments').select('*, lesson:lessons(*, course:courses(*))').eq('is_published', true);
                    if (lessonIds.length > 0) q = q.or(`class_id.eq.${classId},lesson_id.in.(${lessonIds.join(',')})`);
                    else q = q.eq('class_id', classId);
                    return await q.order('due_date', { ascending: true });
                })()
            ]);

            const tasks: TaskItem[] = [
                ...(hwRes.data || []).map((h: any) => ({ ...h, source: 'homework' as const })),
                ...(asgRes.data || []).map((a: any) => ({ ...a, source: 'assignment' as const }))
            ].sort((a, b) => {
                const da = new Date(a.due_date || a.created_at).getTime();
                const db = new Date(b.due_date || b.created_at).getTime();
                return da - db;
            });

            let submissionsMap: Record<string, any> = {};
            if (user && !isTeacher && tasks.length > 0) {
                const aIds = tasks.filter(t => t.source === 'assignment').map(t => t.id);
                const hIds = tasks.filter(t => t.source === 'homework').map(t => t.id);
                const [aSubs, hSubs] = await Promise.all([
                    aIds.length ? supabase.from('assignment_submissions').select('*').eq('user_id', user.id).in('assignment_id', aIds) : { data: [] },
                    hIds.length ? supabase.from('homework_submissions').select('*').eq('student_id', user.id).in('homework_id', hIds) : { data: [] }
                ]);
                aSubs.data?.forEach((s: any) => { submissionsMap[s.assignment_id] = s; });
                hSubs.data?.forEach((s: any) => { submissionsMap[s.homework_id] = s; });
            }

            setAssignments(tasks);
            setSubmissions(submissionsMap);
            setMaterialsByCourse(lessonsByCourse);
            setClassInfo({ ...cls, teacher: teacherProfile });
        } catch (error: any) {
            showToast('Lỗi khi tải thông tin lớp: ' + error.message, 'error');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveClass = async () => {
        if (!window.confirm('Rời khỏi lớp học này?')) return;
        try {
            await leaveClass(user!.id, classId!);
            showToast('Đã rời lớp', 'success');
            navigate('/');
        } catch (error: any) {
            showToast('Lỗi: ' + error.message, 'error');
        }
    };

    if (loading) return (
        <div className="cdp-loading">
            <div className="cdp-loading-spinner" />
            <p>Đang tải lớp học...</p>
        </div>
    );

    if (!classInfo) return null;

    const lang = classInfo.language;
    const level = classInfo.level;
    const progress = getProgressPercent(assignments, submissions);
    const pendingTasks = assignments.filter(t => !submissions[t.id]).length;
    const completedTasks = assignments.filter(t => submissions[t.id]).length;

    const isJapanese = lang === 'japanese';
    const accentColor = isJapanese ? '#f43f5e' : '#ef4444';
    const accentLight = isJapanese ? 'rgba(244,63,94,0.1)' : 'rgba(239,68,68,0.1)';
    const accentGlow = isJapanese ? 'rgba(244,63,94,0.3)' : 'rgba(239,68,68,0.3)';
    const languageFlag = isJapanese ? '🇯🇵' : '🇨🇳';

    const pendingTasksList = assignments.filter(t => !submissions[t.id]);
    const completedTasksList = assignments.filter(t => submissions[t.id]);

    return (
        <div className={`cdp-page ${isJapanese ? 'cdp-jp' : 'cdp-cn'}`}>
            {/* ── Hero Header ─────────────────────────────────────── */}
            <motion.div
                className="cdp-hero"
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                {/* Background blobs */}
                <div className="cdp-hero-blob cdp-hero-blob-1" />
                <div className="cdp-hero-blob cdp-hero-blob-2" />

                <div className="cdp-hero-topbar">
                    <div className="cdp-breadcrumb">
                        <Link to="/">Trang chủ</Link>
                        <span>›</span>
                        <span className="cdp-breadcrumb-current">{classInfo.name}</span>
                    </div>
                    <button className="cdp-btn-leave" onClick={handleLeaveClass}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                        </svg>
                        Rời lớp
                    </button>
                </div>

                <div className="cdp-hero-body">
                    <div className="cdp-hero-left">
                        <div className="cdp-lang-badge">
                            <span className="cdp-lang-flag">{languageFlag}</span>
                            <span className="cdp-lang-level">{level}</span>
                            <span className="cdp-lang-sep">·</span>
                            <span className="cdp-lang-name">{isJapanese ? 'Tiếng Nhật' : 'Tiếng Trung'}</span>
                        </div>
                        <h1 className="cdp-hero-title">{classInfo.name}</h1>
                        <p className="cdp-hero-course">{classInfo.course?.title}</p>

                        <div className="cdp-teacher-row">
                            <div className="cdp-teacher-avatar">
                                {classInfo.teacher?.full_name?.charAt(0) || 'T'}
                            </div>
                            <div>
                                <div className="cdp-teacher-label">Giáo viên</div>
                                <div className="cdp-teacher-name">{classInfo.teacher?.full_name || 'Chưa có'}</div>
                            </div>
                        </div>

                        <div className="cdp-class-code">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                            </svg>
                            <span>{classInfo.code}</span>
                        </div>
                    </div>

                    <div className="cdp-hero-right">
                        <div className="cdp-stats-grid">
                            <div className="cdp-stat-card cdp-stat-card--total">
                                <div className="cdp-stat-icon">📋</div>
                                <div className="cdp-stat-num">{assignments.length}</div>
                                <div className="cdp-stat-label">Tổng bài</div>
                            </div>
                            <div className="cdp-stat-card cdp-stat-card--done">
                                <div className="cdp-stat-icon">✅</div>
                                <div className="cdp-stat-num">{completedTasks}</div>
                                <div className="cdp-stat-label">Đã nộp</div>
                            </div>
                            <div className="cdp-stat-card cdp-stat-card--pending">
                                <div className="cdp-stat-icon">⏳</div>
                                <div className="cdp-stat-num">{pendingTasks}</div>
                                <div className="cdp-stat-label">Chưa nộp</div>
                            </div>
                        </div>

                        {assignments.length > 0 && (
                            <div className="cdp-progress-wrap">
                                <div className="cdp-progress-header">
                                    <span>Tiến độ học tập</span>
                                    <span className="cdp-progress-pct">{progress}%</span>
                                </div>
                                <div className="cdp-progress-bar">
                                    <div className="cdp-progress-fill" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ── Tab Navigation ───────────────────────────────────── */}
            <div className="cdp-tabs">
                <button
                    className={`cdp-tab-btn ${activeTab === 'homework' ? 'active' : ''}`}
                    onClick={() => setActiveTab('homework')}
                >
                    <span>📝</span> Bài tập
                    {pendingTasks > 0 && <span className="cdp-tab-badge">{pendingTasks}</span>}
                </button>
                <button
                    className={`cdp-tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
                    onClick={() => setActiveTab('materials')}
                >
                    <span>📚</span> Tài liệu
                </button>
            </div>

            {/* ── Content ─────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {activeTab === 'homework' && (
                    <motion.div
                        key="homework"
                        className="cdp-content"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        {assignments.length === 0 ? (
                            <div className="cdp-empty">
                                <div className="cdp-empty-icon">📭</div>
                                <h3>Chưa có bài tập nào</h3>
                                <p>Giáo viên chưa giao bài tập cho lớp này.</p>
                            </div>
                        ) : (
                            <>
                                {pendingTasksList.length > 0 && (
                                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                                        <div className="cdp-section-label">
                                            <div className="cdp-section-dot cdp-section-dot--pending" />
                                            Chưa nộp <span className="cdp-section-count">{pendingTasksList.length}</span>
                                        </div>
                                        <div className="cdp-task-grid">
                                            {pendingTasksList.map((task, i) => {
                                                const { text, urgent, overdue } = getDaysLeft(task.due_date);
                                                return (
                                                    <motion.div
                                                        key={`${task.source}-${task.id}`}
                                                        variants={itemVariants}
                                                        className={`cdp-task-card ${overdue ? 'cdp-task-card--overdue' : urgent ? 'cdp-task-card--urgent' : ''}`}
                                                        onClick={() => navigate(task.source === 'assignment' ? `/assignments/${task.id}` : `/homework/${task.id}`)}
                                                    >
                                                        <div className="cdp-task-card-top">
                                                            <div className="cdp-task-type">
                                                                <span className="cdp-task-type-icon">{task.source === 'assignment' ? '🎥' : '📝'}</span>
                                                                <span>{task.source === 'assignment' ? 'Media' : 'BTVN'}</span>
                                                            </div>
                                                            <div className={`cdp-task-due ${overdue ? 'cdp-task-due--overdue' : urgent ? 'cdp-task-due--urgent' : ''}`}>
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                                                                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                                                                </svg>
                                                                {text}
                                                            </div>
                                                        </div>
                                                        <h3 className="cdp-task-title">{task.title}</h3>
                                                        {task.description && (
                                                            <p className="cdp-task-desc">{task.description}</p>
                                                        )}
                                                        {task.lesson?.title && (
                                                            <div className="cdp-task-lesson">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                                                                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                                                                </svg>
                                                                {task.lesson.title}
                                                            </div>
                                                        )}
                                                        <div className="cdp-task-footer">
                                                            <span className="cdp-task-action">
                                                                Bắt đầu làm <span>→</span>
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                {completedTasksList.length > 0 && (
                                    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ marginTop: '2.5rem' }}>
                                        <div className="cdp-section-label">
                                            <div className="cdp-section-dot cdp-section-dot--done" />
                                            Đã nộp <span className="cdp-section-count">{completedTasksList.length}</span>
                                        </div>
                                        <div className="cdp-task-grid">
                                            {completedTasksList.map((task) => {
                                                const sub = submissions[task.id];
                                                const isGraded = sub?.status === 'graded';
                                                return (
                                                    <motion.div
                                                        key={`${task.source}-${task.id}`}
                                                        variants={itemVariants}
                                                        className="cdp-task-card cdp-task-card--done"
                                                        onClick={() => navigate(task.source === 'assignment' ? `/assignments/${task.id}` : `/homework/${task.id}`)}
                                                    >
                                                        <div className="cdp-task-card-top">
                                                            <div className="cdp-task-type">
                                                                <span className="cdp-task-type-icon">{task.source === 'assignment' ? '🎥' : '📝'}</span>
                                                                <span>{task.source === 'assignment' ? 'Media' : 'BTVN'}</span>
                                                            </div>
                                                            <div className="cdp-task-status cdp-task-status--done">
                                                                {isGraded ? (
                                                                    <><span className="cdp-score">{sub.score ?? sub.grade}/10</span> Đã chấm</>
                                                                ) : (
                                                                    <>✓ Đã nộp</>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <h3 className="cdp-task-title">{task.title}</h3>
                                                        {task.description && (
                                                            <p className="cdp-task-desc">{task.description}</p>
                                                        )}
                                                        <div className="cdp-task-footer">
                                                            <span className="cdp-task-action cdp-task-action--done">
                                                                Xem lại bài <span>→</span>
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}

                {activeTab === 'materials' && (
                    <motion.div
                        key="materials"
                        className="cdp-content"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        {Object.values(materialsByCourse).length === 0 ? (
                            <div className="cdp-empty">
                                <div className="cdp-empty-icon">📚</div>
                                <h3>Chưa có tài liệu</h3>
                                <p>Khóa học này chưa có bài học nào.</p>
                            </div>
                        ) : (
                            Object.values(materialsByCourse).map((course, ci) => (
                                <div key={course.id} className="cdp-course-section">
                                    <motion.div
                                        className="cdp-course-hero"
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: ci * 0.1 }}
                                    >
                                        <div className="cdp-course-hero-icon">{languageFlag}</div>
                                        <div className="cdp-course-hero-info">
                                            <div className="cdp-course-hero-level">{course.level}</div>
                                            <h2 className="cdp-course-hero-title">{course.title}</h2>
                                            <p className="cdp-course-hero-desc">{course.description}</p>
                                        </div>
                                        <div className="cdp-course-hero-count">
                                            <div className="cdp-count-num">{course.lessons.length}</div>
                                            <div className="cdp-count-label">bài học</div>
                                        </div>
                                    </motion.div>

                                    <div className="cdp-lessons-list">
                                        {course.lessons.map((lesson, li) => (
                                            <motion.div
                                                key={lesson.id}
                                                className="cdp-lesson-row"
                                                initial={{ opacity: 0, x: -12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: ci * 0.1 + li * 0.04 }}
                                                onClick={() => navigate(`/${lang}/lessons/${lesson.id}`)}
                                            >
                                                <div className="cdp-lesson-num">
                                                    <span>{lesson.lesson_number < 10 ? '0' + lesson.lesson_number : lesson.lesson_number}</span>
                                                </div>
                                                <div className="cdp-lesson-info">
                                                    <h4 className="cdp-lesson-title">{lesson.title}</h4>
                                                    {lesson.description && (
                                                        <p className="cdp-lesson-desc">{lesson.description}</p>
                                                    )}
                                                </div>
                                                <div className="cdp-lesson-arrow">→</div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClassDetail;
