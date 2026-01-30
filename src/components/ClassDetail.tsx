import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { leaveClass } from '../services/classService';
import { getLessons } from '../services/supabaseService.v2';
import { getMySubmissions } from '../services/assignmentService';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingElements from './FloatingElements';
import '../styles/class-detail-premium.css';

const ClassDetail: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const { user, profile, isAdmin, isTeacher: isTeacherUser } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [classInfo, setClassInfo] = useState<any>(null);
    const [courseInfo, setCourseInfo] = useState<any>(null);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<Record<string, any>>({});
    const [materialsByCourse, setMaterialsByCourse] = useState<Record<string, { course: any; lessons: any[] }>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'homework' | 'materials'>('homework');

    const isTeacher = isTeacherUser || isAdmin;

    useEffect(() => {
        if (classId) {
            loadClassData();
        }
    }, [classId]);

    const loadClassData = async () => {
        setLoading(true);
        try {
            // 1. Get Class Info with course relationship
            const { data: cls, error: clsError } = await supabase
                .from('classes')
                .select(`
                    *,
                    course:courses(*)
                `)
                .eq('id', classId)
                .single();

            if (clsError) throw clsError;

            // 2. Get Teacher Profile
            let teacherProfile = null;
            if (cls.teacher_id) {
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', cls.teacher_id)
                    .maybeSingle();
                teacherProfile = prof;
            }

            // 3. Get Homework & Materials
            const lessonsData = await getLessons(undefined, cls.language, cls.level, 1, 100);

            // 4. Group lessons by course
            const lessonsByCourse: Record<string, { course: any; lessons: any[] }> = {};
            if (lessonsData.data) {
                lessonsData.data.forEach((lesson: any) => {
                    const courseId = lesson.course_id || lesson.course?.id || 'no-course';
                    const course = lesson.course || { id: 'no-course', title: 'Tài liệu bổ sung', description: 'Các bài học lẻ ngoài khóa học' };

                    if (!lessonsByCourse[courseId]) {
                        lessonsByCourse[courseId] = {
                            course: course,
                            lessons: []
                        };
                    }
                    lessonsByCourse[courseId].lessons.push(lesson);
                });
            }

            // 5. Get Assignments
            let assignmentsData = [];
            const lessonIds = lessonsData.data?.filter((l: any) => l.id).map((l: any) => l.id) || [];

            let assignmentsQuery = supabase
                .from('assignments')
                .select(`
                    *,
                    lesson:lessons(*, course:courses(*))
                `)
                .eq('is_published', true)
                .order('due_date', { ascending: true });

            if (lessonIds.length > 0) {
                assignmentsQuery = assignmentsQuery.or(`class_id.eq.${classId},lesson_id.in.(${lessonIds.join(',')})`);
            } else {
                assignmentsQuery = assignmentsQuery.eq('class_id', classId);
            }

            const { data: assignmentsRes } = await assignmentsQuery;
            assignmentsData = assignmentsRes || [];

            // 6. Get submission statuses
            let submissionsMap: Record<string, any> = {};
            if (user && !isTeacher && assignmentsData) {
                const { data: mySubs } = await supabase
                    .from('assignment_submissions')
                    .select('*')
                    .eq('user_id', user.id)
                    .in('assignment_id', assignmentsData.map(a => a.id));

                mySubs?.forEach(sub => {
                    submissionsMap[sub.assignment_id] = sub;
                });
            }

            setAssignments(assignmentsData || []);
            setSubmissions(submissionsMap);
            setMaterialsByCourse(lessonsByCourse);
            setCourseInfo(cls.course);
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
        <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
            <p className="text-slate-500 font-bold">Đang tải thông tin lớp học...</p>
        </div>
    );

    if (!classInfo) return null;

    return (
        <div className={`class-detail-premium ${classInfo.language === 'japanese' ? 'jp-theme' : 'cn-theme'}`} data-language={classInfo.language}>
            {/* Cultural SVG Background Pattern */}
            <svg className="cultural-pattern" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <defs>
                    {classInfo.language === 'japanese' ? (
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
                <rect width="100%" height="100%" fill={`url(#${classInfo.language === 'japanese' ? 'sakura' : 'chinese'}-pattern)`} />
                <rect width="100%" height="100%" fill={`url(#${classInfo.language === 'japanese' ? 'jp' : 'cn'}-glow)`} />
            </svg>
            <FloatingElements language={classInfo.language} />

            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-class-header"
            >
                <div className="header-accent-bar"></div>

                <div className="class-meta-top">
                    <div className="class-level-pill">
                        {classInfo.language === 'japanese' ? '🇯🇵' : '🇨🇳'} {classInfo.level}
                    </div>
                    <div className="class-code-display">CODE: {classInfo.code}</div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="flex-1">
                        <h1 className="class-title-large">{classInfo.name}</h1>
                        {courseInfo && (
                            <p className="text-slate-600 mt-2 text-lg font-semibold">
                                📚 {courseInfo.title}
                            </p>
                        )}
                        <div className="flex items-center gap-4 mt-4">
                            <p className="text-slate-500 flex items-center gap-2 font-medium">
                                <span className="text-xl">👨‍🏫</span>
                                <span>Giáo viên: </span>
                                <span className="text-slate-800 font-bold">{classInfo.teacher?.full_name || 'N/A'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={handleLeaveClass} className="px-6 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all">
                            Rời lớp
                        </button>
                    </div>
                </div>
            </motion.div>

            <div className="premium-tabs">
                <button
                    onClick={() => setActiveTab('homework')}
                    className={`premium-tab-btn ${activeTab === 'homework' ? 'active' : ''}`}
                >
                    📝 <span>Bài tập</span>
                </button>
                <button
                    onClick={() => setActiveTab('materials')}
                    className={`premium-tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
                >
                    📚 <span>Tài liệu</span>
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'homework' && (
                    <motion.div
                        key="homework"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="premium-grid"
                    >
                        {assignments.map((assignment, idx) => {
                            const submission = submissions[assignment.id];
                            const isSubmitted = !!submission;
                            return (
                                <div
                                    key={assignment.id}
                                    className="material-card assignment-card clickable"
                                    onClick={() => navigate(`/assignments/${assignment.id}`)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="material-type">Hạn: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}</div>
                                        {isSubmitted && <span className="status-badge submitted">Đã nộp</span>}
                                    </div>
                                    <h3 className="material-title">{assignment.title}</h3>
                                    <p className="material-preview">{assignment.description}</p>
                                    <div className="mt-4 pt-4 border-t flex justify-end">
                                        <span className="text-primary font-bold">Làm bài ngay →</span>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}

                {activeTab === 'materials' && (
                    <motion.div
                        key="materials"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        {Object.entries(materialsByCourse).map(([id, { course, lessons }]) => (
                            <div key={id} className="course-group mb-20">
                                <div className="course-header-section">
                                    <div className="course-header-content">
                                        <div className="course-icon-wrapper">📖</div>
                                        <div>
                                            <h2 className="course-title">{course.title}</h2>
                                            <p className="course-description">{course.description}</p>
                                        </div>
                                        <div className="course-stats-badge">
                                            <span className="course-stats-number">{lessons.length}</span>
                                            <span className="course-stats-label">bài học</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="premium-grid">
                                    {lessons.map((lesson) => (
                                        <div
                                            key={lesson.id}
                                            className="material-card lesson-card clickable"
                                            onClick={() => navigate(`/${classInfo.language}/lessons/${lesson.id}`)}
                                        >
                                            <div className="lesson-card-header">
                                                <div className="lesson-number-badge">L{lesson.lesson_number}</div>
                                            </div>
                                            <div className="lesson-card-body">
                                                <h3 className="lesson-card-title">{lesson.title}</h3>
                                                <p className="lesson-card-description">{lesson.description}</p>
                                            </div>
                                            <div className="lesson-card-footer">
                                                <span>Nhấp để xem chi tiết</span>
                                                <span className="lesson-card-arrow">→</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClassDetail;
