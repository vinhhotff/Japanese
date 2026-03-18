import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssignmentById, getAllSubmissions } from '../services/assignmentService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import '../styles/teacher-dashboard-premium.css';

const SubmissionList = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const { user, isTeacher } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'submitted' | 'graded'>('all');

    useEffect(() => {
        if (assignmentId && isTeacher) {
            loadData();
        } else if (!assignmentId && isTeacher) {
            setLoading(false);
            setAssignment(null);
            setSubmissions([]);
        }
    }, [assignmentId, isTeacher]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [asgData, subsData] = await Promise.all([
                getAssignmentById(assignmentId!),
                getAllSubmissions(assignmentId)
            ]);
            setAssignment(asgData);
            setSubmissions(subsData.data || []);
        } catch (e) {
            console.error(e);
            showToast('Lỗi tải danh sách nộp bài', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredSubmissions = submissions.filter(s => {
        if (filter === 'all') return true;
        return s.status === filter;
    });

    if (!isTeacher) {
        return <div className="p-8 text-center text-red-500 font-bold">Bạn không có quyền truy cập trang này.</div>;
    }

    return (
        <div className="teacher-dashboard-container">
            {/* Premium Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="teacher-header"
            >
                <div className="teacher-title-area">
                    <button onClick={() => navigate('/teacher')} className="grading-back-btn light">
                        ← Quay lại
                    </button>
                    <div>
                        <h1>📊 Danh sách bài nộp</h1>
                        <span className="teacher-badge">Bài tập: {assignment?.title || 'Đang tải...'}</span>
                    </div>
                </div>
                <div className="teacher-actions">
                    <button
                        onClick={() => navigate(`/teacher/assignments/edit/${assignmentId}`)}
                        className="teacher-btn-secondary"
                    >
                        ✏️ Chỉnh sửa bài tập
                    </button>
                </div>
            </motion.header>

            <main className="teacher-main-content">
                <div className="submission-list-toolbar">
                    <div className="submission-list-tabs" role="tablist" aria-label="Lọc bài nộp">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={filter === 'all'}
                            onClick={() => setFilter('all')}
                            className={filter === 'all' ? 'active' : ''}
                        >
                            Tất cả
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={filter === 'submitted'}
                            onClick={() => setFilter('submitted')}
                            className={filter === 'submitted' ? 'active' : ''}
                        >
                            Đợi chấm
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={filter === 'graded'}
                            onClick={() => setFilter('graded')}
                            className={filter === 'graded' ? 'active' : ''}
                        >
                            Đã chấm
                        </button>
                    </div>
                    <div className="submission-list-count">
                        Tổng cộng: <strong>{filteredSubmissions.length}</strong> bài nộp
                    </div>
                </div>

                <div className="admin-table-container">
                    {loading ? (
                        <div className="submission-list-loading">
                            <div className="submission-list-spinner" aria-hidden />
                            <p className="submission-list-loading-text">Đang tải danh sách...</p>
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <div className="submission-list-empty">
                            <p className="submission-list-empty-text">Chưa có bài nộp nào phù hợp với bộ lọc.</p>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Học sinh</th>
                                    <th>Trạng thái</th>
                                    <th>Điểm số</th>
                                    <th>Ngày nộp</th>
                                    <th className="text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {filteredSubmissions.map((sub, idx) => (
                                        <motion.tr
                                            key={sub.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-teacher-primary text-white rounded-full flex items-center justify-center font-bold">
                                                        {(sub.profiles?.full_name || sub.profiles?.email || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">{sub.profiles?.full_name || 'Chưa đặt tên'}</div>
                                                        <div className="text-xs text-slate-500">{sub.profiles?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${sub.status}`}>
                                                    {sub.status === 'submitted' ? '📥 Đợi chấm' :
                                                        sub.status === 'graded' ? '✅ Đã chấm' :
                                                            sub.status === 'returned' ? '📬 Đã trả' : sub.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="font-mono font-bold text-lg">
                                                    {sub.score !== null ? `${sub.score}/${assignment?.max_score || 100}` : '---'}
                                                </div>
                                            </td>
                                            <td className="text-slate-500 font-medium">
                                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('vi-VN', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '---'}
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    onClick={() => navigate(`/teacher/grading/${sub.id}`)}
                                                    className="teacher-btn-card btn-primary"
                                                    style={{ width: 'auto', padding: '0.4rem 1.2rem' }}
                                                >
                                                    {sub.status === 'graded' ? 'Sửa điểm' : 'Chấm bài'} &rarr;
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SubmissionList;
