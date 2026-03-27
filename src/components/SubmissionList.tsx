import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssignmentById, getAllSubmissions } from '../services/assignmentService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import '../styles/teacher-dashboard-premium.css';

const SubmissionList = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const { isTeacher } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'submitted' | 'graded'>('all');

    useEffect(() => {
        if (assignmentId && isTeacher) loadData();
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
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="td-empty">
                    <span className="td-empty-icon">🔒</span>
                    <h3>Không có quyền truy cập</h3>
                    <Link to="/" className="td-btn td-btn-primary" style={{ margin: '0 auto' }}>Về trang chủ</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="td-wrap">
            {/* Topbar */}
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
                    <button
                        className="td-btn td-btn-secondary"
                        style={{ height: '36px', padding: '0 0.875rem', fontSize: '0.8rem' }}
                        onClick={() => navigate(-1)}
                    >
                        ← Quay lại
                    </button>
                    <button
                        className="td-btn td-btn-primary"
                        style={{ height: '36px', padding: '0 0.875rem', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/teacher/assignments/edit/${assignmentId}`)}
                    >
                        ✏️ Chỉnh sửa
                    </button>
                </div>
            </header>

            {/* Page */}
            <main className="td-page">
                {/* Header */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--t-text)', margin: '0 0 0.375rem' }}>
                        📊 Danh sách bài nộp
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--t-text-secondary)', margin: 0 }}>
                        Bài tập: <strong>{assignment?.title || 'Đang tải...'}</strong>
                    </p>
                </div>

                {/* Filter Tabs + Count */}
                <div className="td-section-head">
                    <div className="td-cm-tabs">
                        {(['all', 'submitted', 'graded'] as const).map(f => (
                            <button
                                key={f}
                                className={`td-cm-tab ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f === 'all' ? '📋 Tất cả' : f === 'submitted' ? '📥 Đợi chấm' : '✅ Đã chấm'}
                            </button>
                        ))}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--t-text-secondary)', fontWeight: 600 }}>
                        {filteredSubmissions.length} / {submissions.length} bài nộp
                    </span>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="td-loading"><div className="td-spinner" /><span className="td-loading-text">Đang tải...</span></div>
                ) : filteredSubmissions.length === 0 ? (
                    <div className="td-empty" style={{ marginTop: '1rem' }}>
                        <span className="td-empty-icon">📭</span>
                        <h3>Không có bài nộp nào</h3>
                        <p>Chưa có bài nộp phù hợp với bộ lọc hiện tại.</p>
                    </div>
                ) : (
                    <div className="td-cm-table-card">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Học sinh</th>
                                    <th>Trạng thái</th>
                                    <th>Điểm</th>
                                    <th>Ngày nộp</th>
                                    <th style={{ textAlign: 'right' }}>Hành động</th>
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
                                            transition={{ delay: idx * 0.04 }}
                                        >
                                            <td>
                                                <div className="td-student-row">
                                                    <div className="td-student-avatar">
                                                        {(sub.profiles?.full_name || sub.profiles?.email || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div className="td-student-info">
                                                        <div className="td-student-name">
                                                            {sub.profiles?.full_name || 'Chưa đặt tên'}
                                                        </div>
                                                        <div className="td-student-email">{sub.profiles?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`td-cm-chip ${sub.status === 'graded' ? '' : sub.status === 'submitted' ? 'jp' : ''}`}
                                                    style={sub.status === 'submitted' ? { background: 'var(--t-amber-bg)', color: 'var(--t-text)', borderColor: 'rgba(245,158,11,0.2)' } :
                                                        sub.status === 'graded' ? { background: 'var(--t-green-bg)', color: 'var(--t-green)', borderColor: 'rgba(16,185,129,0.2)' } : {}}>
                                                    {sub.status === 'submitted' ? '📥 Đợi chấm' :
                                                        sub.status === 'graded' ? '✅ Đã chấm' :
                                                            sub.status === 'returned' ? '📬 Đã trả' : sub.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem' }}>
                                                    {sub.score !== null ? `${sub.score}/${assignment?.max_score || 100}` : '—'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.825rem', color: 'var(--t-text-secondary)', whiteSpace: 'nowrap' }}>
                                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('vi-VN', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                }) : '—'}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    className="td-btn td-btn-primary"
                                                    style={{ height: '34px', padding: '0 0.875rem', fontSize: '0.8rem' }}
                                                    onClick={() => navigate(`/teacher/grading/${sub.id}`)}
                                                >
                                                    {sub.status === 'graded' ? 'Sửa điểm' : 'Chấm bài'} →
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SubmissionList;
