import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionById, gradeSubmission } from '../services/assignmentService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import '../styles/grading.css';

interface GradingInterfaceProps {
  submission?: any;
  assignment?: any;
  onGradeComplete?: () => void;
}

const GradingInterface = ({ submission: propSubmission, assignment: propAssignment, onGradeComplete }: GradingInterfaceProps) => {
  const { submissionId: paramSubmissionId } = useParams<{ submissionId: string }>();
  // Use prop ID if available, else param ID
  const effectiveId = propSubmission?.id || paramSubmissionId;
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<any>(propSubmission || null);
  const [loading, setLoading] = useState(!propSubmission);
  const [grading, setGrading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [answerGrades, setAnswerGrades] = useState<Record<string, {
    points: number;
    feedback: string;
    isCorrect?: boolean;
  }>>({});

  useEffect(() => {
    if (propSubmission) {
      initGrades(propSubmission);
    } else if (paramSubmissionId) {
      loadSubmission();
    }
  }, [paramSubmissionId, propSubmission]);

  const initGrades = (data: any) => {
    // Initialize answer grades
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
      [answerId]: {
        ...answerGrades[answerId],
        [field]: value,
      },
    };
    setAnswerGrades(updated);
    calculateTotal(updated);
  };

  const handleSubmitGrade = async () => {
    if (!user) {
      showToast('Vui lòng đăng nhập', 'error');
      return;
    }

    if (!confirm('Xác nhận chấm điểm và gửi kết quả cho học viên?')) {
      return;
    }

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
        feedback: feedback,
        graded_by: user.id,
        answers: answersData,
      });

      showToast('Đã chấm điểm thành công! ✨', 'success');
      if (onGradeComplete) {
        onGradeComplete();
      } else {
        navigate('/admin/submissions');
      }
    } catch (error) {
      console.error('Error grading:', error);
      showToast('Lỗi khi chấm điểm', 'error');
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div className="grading-loading">
        <div className="spinner"></div>
        <p>Đang tải bài làm...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="grading-not-found">
        <h2>Không tìm thấy bài làm</h2>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Quay lại
        </button>
      </div>
    );
  }

  const maxScore = submission.assignment?.max_score || 100;
  const percentage = Math.round((totalScore / maxScore) * 100);

  return (
    <div className="grading-container">
      {/* Header */}
      <div className="grading-header">
        <button onClick={() => navigate(-1)} className="btn-grading outline mb-8">
          ← Quay lại danh sách
        </button>
        <div className="header-content">
          <div>
            <h1>Chấm bài: {submission.assignment?.title}</h1>
            <div className="student-info">
              <span>👤 Học viên: {submission.profiles?.full_name || submission.user_id}</span>
              <span className="opacity-30">|</span>
              <span>📅 Nộp lúc: {new Date(submission.submitted_at).toLocaleString('vi-VN')}</span>
            </div>
          </div>
          <div className="score-preview">
            <div className="score-circle" style={{
              background: `conic-gradient(#8b5cf6 ${percentage * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
            }}>
              <div className="score-inner">
                <div className="score-value">{totalScore}</div>
                <div className="score-max">/{maxScore}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Grading */}
      <div className="answers-grading">
        {submission.answers?.map((answer: any, index: number) => {
          const question = answer.question;
          const maxPoints = question?.points || 10;
          const currentGrade = answerGrades[answer.id] || { points: 0, feedback: '' };

          return (
            <div key={answer.id} className="answer-grading-card">
              <div className="answer-header">
                <div className="answer-number">Câu {index + 1}</div>
                <div className="answer-points-input">
                  <input
                    type="number"
                    min="0"
                    max={maxPoints}
                    value={currentGrade.points}
                    onChange={(e) => handleAnswerGradeChange(answer.id, 'points', Number(e.target.value))}
                    className="points-input"
                  />
                  <span className="ml-4 font-bold opacity-60">/ {maxPoints} điểm</span>
                </div>
              </div>

              <div className="question-display">
                <strong>Câu hỏi</strong>
                <div className="text-xl font-medium">{question?.question_text}</div>
              </div>

              <div className="answer-display">
                <strong>Câu trả lời của học viên</strong>
                <div className="answer-content">
                  {answer.answer_text || <em className="no-answer opacity-40">Chưa trả lời</em>}
                </div>
              </div>

              {question?.correct_answer && (
                <div className="correct-answer-display">
                  <div>
                    <strong>Đáp án đúng</strong>
                    <div className="text-emerald-500 font-bold">{question.correct_answer}</div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-emerald-500/10 rounded-2xl hover:bg-emerald-500/20 transition-all">
                    <input
                      type="checkbox"
                      className="w-6 h-6 accent-emerald-500"
                      checked={currentGrade.isCorrect || false}
                      onChange={(e) => handleAnswerGradeChange(answer.id, 'isCorrect', e.target.checked)}
                    />
                    <span className="font-bold text-emerald-500">Đánh dấu đúng</span>
                  </label>
                </div>
              )}

              <div className="feedback-input mt-8">
                <strong>💬 Nhận xét chi tiết</strong>
                <textarea
                  value={currentGrade.feedback}
                  onChange={(e) => handleAnswerGradeChange(answer.id, 'feedback', e.target.value)}
                  placeholder="Nhận xét, gợi ý cải thiện cho câu này..."
                  rows={3}
                  className="w-full mt-4 p-6 bg-slate-900/50 border border-white/10 rounded-3xl outline-none focus:border-purple-500 transition-all text-white"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Feedback */}
      <div className="answer-grading-card mb-16">
        <h3 className="text-2xl font-black mb-8">📝 Nhận xét tổng quan giáo trình</h3>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Nhận xét tổng quan về bài làm của học viên..."
          rows={6}
          className="w-full p-8 bg-slate-900/50 border border-white/10 rounded-[40px] outline-none focus:border-purple-500 transition-all text-white text-lg"
        />
      </div>

      {/* Summary */}
      <div className="grading-summary">
        <div className="summary-item">
          <span className="summary-label">Tổng kết điểm</span>
          <span className="summary-value">{totalScore} / {maxScore}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Tỷ lệ hoàn thành</span>
          <span className="summary-value">{percentage}%</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Xếp loại năng lực</span>
          <div className="summary-grade">
            {percentage >= 90 ? 'Xuất sắc 💎' : percentage >= 80 ? 'Giỏi 🥇' : percentage >= 70 ? 'Khá 🥈' : percentage >= 60 ? 'Trung bình 🥉' : 'Cần cố gắng 🚩'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grading-actions">
        <button
          className="btn-grading outline"
          onClick={() => navigate(-1)}
          disabled={grading}
        >
          Hủy bỏ
        </button>
        <button
          className="btn-grading primary"
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
