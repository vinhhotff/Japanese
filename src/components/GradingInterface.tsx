import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionById, gradeSubmission } from '../services/assignmentService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import '../styles/grading.css';

const GradingInterface = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [answerGrades, setAnswerGrades] = useState<Record<string, {
    points: number;
    feedback: string;
    isCorrect?: boolean;
  }>>({});

  useEffect(() => {
    if (submissionId) {
      loadSubmission();
    }
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const data = await getSubmissionById(submissionId!);
      setSubmission(data);

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

      // Calculate initial total
      calculateTotal(grades);
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

      await gradeSubmission(submissionId!, {
        score: totalScore,
        feedback: feedback,
        graded_by: user.id,
        answers: answersData,
      });

      showToast('Đã chấm điểm thành công! ✨', 'success');
      navigate('/admin/submissions');
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
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Quay lại
        </button>
        <div className="header-content">
          <div>
            <h1>Chấm bài: {submission.assignment?.title}</h1>
            <p className="student-info">
              👤 Học viên: {submission.user_id} | 
              📅 Nộp lúc: {new Date(submission.submitted_at).toLocaleString('vi-VN')}
            </p>
          </div>
          <div className="score-preview">
            <div className="score-circle" style={{
              background: `conic-gradient(var(--primary-color) ${percentage * 3.6}deg, var(--border-color) 0deg)`
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
                  <span className="points-max">/ {maxPoints} điểm</span>
                </div>
              </div>

              <div className="question-display">
                <strong>Câu hỏi:</strong> {question?.question_text}
              </div>

              <div className="answer-display">
                <strong>Câu trả lời:</strong>
                <div className="answer-content">
                  {answer.answer_text || <em className="no-answer">Chưa trả lời</em>}
                </div>
              </div>

              {question?.correct_answer && (
                <div className="correct-answer-display">
                  <strong>Đáp án đúng:</strong> {question.correct_answer}
                  <label className="correct-checkbox">
                    <input
                      type="checkbox"
                      checked={currentGrade.isCorrect || false}
                      onChange={(e) => handleAnswerGradeChange(answer.id, 'isCorrect', e.target.checked)}
                    />
                    <span>Đúng</span>
                  </label>
                </div>
              )}

              <div className="feedback-input">
                <label>💬 Nhận xét cho câu này:</label>
                <textarea
                  value={currentGrade.feedback}
                  onChange={(e) => handleAnswerGradeChange(answer.id, 'feedback', e.target.value)}
                  placeholder="Nhận xét, gợi ý cải thiện..."
                  rows={3}
                  className="feedback-textarea"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Feedback */}
      <div className="overall-feedback-section">
        <h3>📝 Nhận xét chung</h3>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Nhận xét tổng quan về bài làm của học viên..."
          rows={6}
          className="overall-feedback-textarea"
        />
      </div>

      {/* Summary */}
      <div className="grading-summary">
        <div className="summary-item">
          <span className="summary-label">Tổng điểm:</span>
          <span className="summary-value">{totalScore} / {maxScore}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Phần trăm:</span>
          <span className="summary-value">{percentage}%</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Xếp loại:</span>
          <span className={`summary-grade grade-${
            percentage >= 90 ? 'a' : percentage >= 80 ? 'b' : percentage >= 70 ? 'c' : percentage >= 60 ? 'd' : 'f'
          }`}>
            {percentage >= 90 ? 'Xuất sắc' : percentage >= 80 ? 'Giỏi' : percentage >= 70 ? 'Khá' : percentage >= 60 ? 'Trung bình' : 'Yếu'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grading-actions">
        <button
          className="btn btn-outline"
          onClick={() => navigate(-1)}
          disabled={grading}
        >
          Hủy
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSubmitGrade}
          disabled={grading}
        >
          {grading ? 'Đang lưu...' : '✅ Hoàn thành chấm điểm'}
        </button>
      </div>
    </div>
  );
};

export default GradingInterface;
