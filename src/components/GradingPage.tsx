import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSubmissionById } from '../services/assignmentService';
import GradingInterface from './GradingInterface';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import '../styles/teacher-dashboard-premium.css';

const GradingPage = () => {
    const { submissionId } = useParams<{ submissionId: string }>();
    const { isTeacher } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [submission, setSubmission] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (submissionId && isTeacher) {
            loadSubmission();
        }
    }, [submissionId, isTeacher]);

    const loadSubmission = async () => {
        setLoading(true);
        try {
            const data = await getSubmissionById(submissionId!);
            setSubmission(data);
        } catch (e) {
            console.error(e);
            showToast('Lỗi tải bài làm', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isTeacher) {
        return <div className="p-8 text-center text-red-500 font-bold">Bạn không có quyền truy cập trang này.</div>;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-vh-100 bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin h-12 w-12 border-4 border-teacher-primary rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (!submission) {
        return <div className="p-8 text-center">Không tìm thấy bài nộp (ID: {submissionId})</div>;
    }

    return (
        <div className="teacher-dashboard-container">
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="teacher-header"
                style={{ marginBottom: '2rem' }}
            >
                <div className="teacher-title-area">
                    <button
                        onClick={() => navigate(`/teacher/submissions/${submission.assignment_id}`)}
                        className="content-back-btn mr-4"
                        style={{ color: 'white' }}
                    >
                        &larr; Quay lại danh sách
                    </button>
                    <div>
                        <h1>📝 Chấm điểm bài làm</h1>
                        <span className="teacher-badge">
                            Học sinh: {submission.profiles?.full_name || submission.profiles?.email || 'Chưa rõ'}
                        </span>
                    </div>
                </div>
            </motion.header>

            <main className="teacher-main-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <GradingInterface
                    submission={submission}
                    assignment={submission.assignment}
                    onGradeComplete={() => {
                        showToast('Hoàn thành chấm điểm', 'success');
                        navigate(`/teacher/submissions/${submission.assignment_id}`);
                    }}
                />
            </main>
        </div>
    );
};

export default GradingPage;
