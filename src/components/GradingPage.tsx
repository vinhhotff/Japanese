import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionById } from '../services/assignmentService';
import GradingInterface from './GradingInterface';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import '../styles/grading.css';

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
        return (
            <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                color: '#ef4444', 
                fontWeight: 'bold',
                fontFamily: "'Outfit', 'Inter', system-ui, sans-serif"
            }}>
                Bạn không có quyền truy cập trang này.
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '100vh',
                background: '#f8fafc',
                fontFamily: "'Outfit', 'Inter', system-ui, sans-serif"
            }}>
                <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    border: '4px solid #e2e8f0', 
                    borderTopColor: '#00b4d8',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }}></div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!submission) {
        return (
            <div style={{ 
                padding: '2rem', 
                textAlign: 'center',
                fontFamily: "'Outfit', 'Inter', system-ui, sans-serif"
            }}>
                Không tìm thấy bài nộp (ID: {submissionId})
            </div>
        );
    }

    return (
        <GradingInterface
            submission={submission}
            assignment={submission.assignment}
            onGradeComplete={() => {
                showToast('Hoàn tất chấm điểm', 'success');
                navigate(`/teacher/submissions/${submission.assignment_id}`);
            }}
        />
    );
};

export default GradingPage;
