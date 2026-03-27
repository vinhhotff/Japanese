import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionById, gradeSubmission } from '../services/assignmentService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import '../styles/grading.css';

const GRADE_LABELS: Record<string, { label: string; emoji: string }> = {
  multiple_choice: { label: 'Trắc nghiệm MC', emoji: '❓' },
  short_answer: { label: 'Trả lời ngắn', emoji: '✏️' },
  essay: { label: 'Tự luận / Dịch thuật', emoji: '📝' },
  audio_response: { label: 'Giao tiếp / Ghi âm', emoji: '🎤' },
};

interface GradingInterfaceProps {
  submission?: any;
  assignment?: any;
  onGradeComplete?: () => void;
}

const GradingInterface = ({ submission: propSubmission, assignment: propAssignment, onGradeComplete }: GradingInterfaceProps) => {
  const { submissionId: paramSubmissionId } = useParams<{ submissionId: string }>();
  const effectiveId = propSubmission?.id || paramSubmissionId;
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<any>(propSubmission || null);
  const [loading, setLoading] = useState(!propSubmission);
  const [grading, setGrading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [answerGrades, setAnswerGrades] = useState<Record<string, { points: number; feedback: string; isCorrect?: boolean }>>({});

  useEffect(() => {
    if (propSubmission) {
      initGrades(propSubmission);
    } else if (paramSubmissionId) {
      loadSubmission();
    }
  }, [paramSubmissionId, propSubmission]);

  const initGrades = (data: any) => {
    const grades: Record<string, any> = {};
    data.answers?.forEach((answer: any) => {
      grades[answer.id] = {
        points: answer.points_earned || 0,
        feedback: answer.feedback || '',
        isCorrect: answer.is_correct,
      };
    });
    setAnswerGrades(grades);
    setFeedback(data.feedback || '');
    calculateTotal(grades);
    setLoading(false);
  };

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const data = await getSubmissionById(paramSubmissionId!);
      setSubmission(data);
      initGrades(data);
    } catch (error) {
      console.error('Error loading submission:', error);
      showToast('Không thể tải bài làm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (grades: Record<string, any>) => {
    const total = Object.values(grades).reduce((sum: number, grade: any) => sum + (grade.points || 0), 0);
    setTotalScore(total);
  };

  const handleAnswerGradeChange = (answerId: string, field: 'points' | 'feedback' | 'isCorrect', value: any) => {
    const updated = {
      ...answerGrades,
      [answerId]: { ...answerGrades[answerId], [field]: value },
    };
    setAnswerGrades(updated);
    calculateTotal(updated);
  };

  const handleSubmitGrade = async () => {
    if (!user) { showToast('Vui lòng đăng nhập', 'error'); return; }
    if (!confirm('Xác nhận chấm điểm và gửi kết quả cho học viên?')) return;
    try {
      setGrading(true);
      const answersData = Object.entries(answerGrades).map(([answerId, grade]) => ({
        answer_id: answerId,
        points_earned: grade.points,
        feedback: grade.feedback,
        is_correct: grade.isCorrect,
      }));
      await gradeSubmission(effectiveId!, {
        score: totalScore,
        feedback,
        graded_by: user.id,
        answers: answersData,
      });
      showToast('Đã chấm điểm thành công! ✨', 'success');
      if (onGradeComplete) onGradeComplete();
      else navigate(-1);
    } catch (error) {
      console.error('Error grading:', error);
      showToast('Lỗi khi chấm điểm', 'error');
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div className="gd-wrap">
        <div className="gd-loading">
          <div className="gd-spinner" />
          <span className="gd-loading-text">Đang tải bài làm...</span>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="gd-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ fontWeight: 800, marginBottom: '1rem' }}>Không tìm thấy bài làm</h2>
          <button className="gd-btn gd-btn-secondary" onClick={() => navigate(-1)}>← Quay lại</button>
        </div>
      </div>
    );
  }

  const maxScore = submission.assignment?.max_score || 100;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const gradeLabel = percentage >= 90 ? 'Xuất sắc 💎' : percentage >= 80 ? 'Giỏi 🥇' : percentage >= 70 ? 'Khá 🥈' : percentage >= 60 ? 'Trung bình 🥉' : 'Cần cố gắng 🚩';

  return (
    <div className="gd-wrap">
      {/* Topbar */}
      <header className="gd-topbar">
        <div className="gd-topbar-left">
          <button className="td-btn-ghost" onClick={() => navigate(-1)} title="Quay lại" style={{ border: 'none', background: 'var(--t-bg)', width: 36, height: 36 }}>←</button>
          <div>
            <div className="gd-topbar-title">Chấm bài</div>
            <div className="gd-topbar-sub">{submission.assignment?.title}</div>
          </div>
        </div>
        <div className="gd-topbar-actions">
          <span style={{ fontSize: '0.8rem', color: 'var(--t-text-muted)' }}>
            {submission.profiles?.full_name || submission.profiles?.email || '—'}
          </span>
        </div>
      </header>

      {/* Page */}
      <div className="gd-page">

        {/* Score Header Card */}
        <div className="gd-score-card">
          <div className="gd-score-info">
            <h1>{submission.assignment?.title}</h1>
            <div className="gd-score-meta">
              <span>👤 {submission.profiles?.full_name || '—'}</span>
              <span>📅 Nộp: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString('vi-VN') : '—'}</span>
              <span>Điểm: <strong style={{ color: 'var(--t-primary)' }}>{totalScore} / {maxScore}</strong></span>
            </div>
          </div>
          <div
            className="gd-score-ring"
            style={{ '--pct': percentage } as React.CSSProperties}
          >
            <div className="gd-score-inner">
              <div className="val">{percentage}%</div>
              <div className="max">/100</div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="gd-summary">
          <div className="gd-summary-grid">
            <div className="gd-summary-item">
              <span className="gd-summary-label">Tổng điểm</span>
              <span className="gd-summary-value">{totalScore}/{maxScore}</span>
            </div>
            <div className="gd-summary-item">
              <span className="gd-summary-label">Tỷ lệ</span>
              <span className="gd-summary-value">{percentage}%</span>
            </div>
            <div className="gd-summary-item">
              <span className="gd-summary-label">Xếp loại</span>
              <span className="gd-summary-value" style={{ fontSize: '1rem' }}>{gradeLabel}</span>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="gd-section">
          <div className="gd-section-title">Câu trả lời ({submission.answers?.length || 0})</div>

          {submission.answers?.map((answer: any, index: number) => {
            const question = answer.question;
            const maxPoints = question?.points || 10;
            const currentGrade = answerGrades[answer.id] || { points: 0, feedback: '', isCorrect: false };
            const typeInfo = question?.question_type ? (GRADE_LABELS[question.question_type] || { label: question.question_type, emoji: '❓' }) : null;

            return (
              <div key={answer.id} className="gd-question-card">
                {/* Head */}
                <div className="gd-question-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="gd-question-num">Câu {index + 1}</span>
                    {typeInfo && (
                      <span className="gd-question-type">{typeInfo.emoji} {typeInfo.label}</span>
                    )}
                  </div>
                  <div className="gd-question-score">
                    <input
                      type="number"
                      min={0}
                      max={maxPoints}
                      value={currentGrade.points}
                      onChange={e => handleAnswerGradeChange(answer.id, 'points', Number(e.target.value))}
                    />
                    <span>/ {maxPoints} điểm</span>
                  </div>
                </div>

                {/* Question */}
                <div className="gd-question-body">
                  <div className="gd-question-label">Yêu cầu</div>
                  <div className="gd-question-text">{question?.question_text || '—'}</div>
                </div>

                {/* Student Answer */}
                <div className="gd-question-body">
                  <div className="gd-question-label">Câu trả lời</div>
                  <div className={`gd-answer-box ${!answer.answer_text ? 'empty' : ''}`}>
                    {answer.answer_text || 'Chưa trả lời'}
                  </div>
                </div>

                {/* Correct Answer */}
                {question?.correct_answer && (
                  <div className="gd-correct-box">
                    <div>
                      <div className="gd-question-label" style={{ marginBottom: '0.25rem' }}>Đáp án đúng</div>
                      <div className="gd-correct-text">{question.correct_answer}</div>
                    </div>
                    <button
                      className={`gd-correct-check ${currentGrade.isCorrect ? 'checked' : ''}`}
                      onClick={() => handleAnswerGradeChange(answer.id, 'isCorrect', !currentGrade.isCorrect)}
                    >
                      {currentGrade.isCorrect ? '✓ Đúng' : 'Mark đúng'}
                    </button>
                  </div>
                )}

                {/* Per-question Feedback */}
                <div className="gd-question-body" style={{ marginBottom: 0 }}>
                  <div className="gd-feedback-label">💬 Nhận xét câu này</div>
                  <textarea
                    className="gd-feedback-input"
                    value={currentGrade.feedback}
                    onChange={e => handleAnswerGradeChange(answer.id, 'feedback', e.target.value)}
                    placeholder="Nhận xét, gợi ý cải thiện cho câu này..."
                    rows={2}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Feedback */}
        <div className="gd-overall-card">
          <div className="gd-overall-label">📝 Nhận xét tổng quan</div>
          <textarea
            className="gd-feedback-input"
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Nhận xét tổng quan về bài làm của học viên..."
            rows={4}
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="gd-action-bar">
        <button
          className="gd-btn gd-btn-secondary"
          onClick={() => navigate(-1)}
          disabled={grading}
        >
          Hủy bỏ
        </button>
        <button
          className="gd-btn gd-btn-primary"
          onClick={handleSubmitGrade}
          disabled={grading}
        >
          {grading ? '♾️ Đang xử lý...' : '✅ Hoàn tất chấm điểm'}
        </button>
      </div>
    </div>
  );
};

export default GradingInterface;
