import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignmentById, createSubmission, saveAnswer, submitAssignment, getMySubmissions } from '../services/assignmentService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import '../styles/assignments.css';

const AssignmentDetail = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (assignmentId && user) {
      loadAssignment();
    }
  }, [assignmentId, user]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const assignmentData = await getAssignmentById(assignmentId!);
      setAssignment(assignmentData);

      // Check if user has existing submission
      if (user) {
        const submissions = await getMySubmissions(user.id, assignmentId, 1, 1);
        if (submissions.data.length > 0) {
          const existingSubmission = submissions.data[0];
          setSubmission(existingSubmission);
          
          // Load existing answers
          if (existingSubmission.answers) {
            const answersMap: Record<string, string> = {};
            existingSubmission.answers.forEach((ans: any) => {
              answersMap[ans.question_id] = ans.answer_text || '';
            });
            setAnswers(answersMap);
          }
        }
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
      showToast('Không thể tải bài tập', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSaveDraft = async () => {
    if (!user) {
      showToast('Vui lòng đăng nhập', 'error');
      return;
    }

    try {
      setSaving(true);

      // Create submission if not exists
      let submissionId = submission?.id;
      if (!submissionId) {
        const newSubmission = await createSubmission({
          assignment_id: assignmentId!,
          user_id: user.id,
          status: 'draft',
        });
        submissionId = newSubmission.id;
        setSubmission(newSubmission);
      }

      // Save all answers
      for (const [questionId, answerText] of Object.entries(answers)) {
        if (answerText.trim()) {
          await saveAnswer({
            submission_id: submissionId,
            question_id: questionId,
            answer_text: answerText,
          });
        }
      }

      showToast('Đã lưu bản nháp', 'success');
    } catch (error) {
      console.error('Error saving draft:', error);
      showToast('Lỗi khi lưu bản nháp', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      showToast('Vui lòng đăng nhập', 'error');
      return;
    }

    // Validate all questions answered
    const unansweredQuestions = assignment.questions.filter(
      (q: any) => !answers[q.id]?.trim()
    );

    if (unansweredQuestions.length > 0) {
      showToast(`Còn ${unansweredQuestions.length} câu chưa trả lời`, 'warning');
      return;
    }

    if (!confirm('Bạn có chắc muốn nộp bài? Sau khi nộp sẽ không thể chỉnh sửa.')) {
      return;
    }

    try {
      setSubmitting(true);

      // Save draft first
      await handleSaveDraft();

      // Submit
      if (submission?.id) {
        await submitAssignment(submission.id);
        showToast('Nộp bài thành công! 🎉', 'success');
        navigate('/my-assignments');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      showToast('Lỗi khi nộp bài', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="assignment-detail-loading">
        <div className="spinner"></div>
        <p>Đang tải bài tập...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="assignment-not-found">
        <h2>Không tìm thấy bài tập</h2>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Quay lại
        </button>
      </div>
    );
  }

  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded' || submission?.status === 'returned';
  const isGraded = submission?.status === 'graded' || submission?.status === 'returned';

  return (
    <div className="assignment-detail-container">
      {/* Header */}
      <div className="assignment-detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Quay lại
        </button>
        <div className="header-content">
          <div className="header-left">
            <h1>{assignment.title}</h1>
            <p className="assignment-instructions">{assignment.description}</p>
          </div>
          <div className="header-right">
            {isGraded && (
              <div className="score-display">
                <div className="score-value">{submission.score}/{assignment.max_score}</div>
                <div className="score-label">Điểm</div>
              </div>
            )}
            {submission?.status && (
              <div className={`status-badge status-${submission.status}`}>
                {submission.status === 'draft' && '📝 Bản nháp'}
                {submission.status === 'submitted' && '✅ Đã nộp'}
                {submission.status === 'graded' && '✨ Đã chấm'}
                {submission.status === 'returned' && '📬 Đã trả bài'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="assignment-instructions-box">
        <h3>📋 Hướng dẫn</h3>
        <div className="instructions-content">
          {assignment.instructions}
        </div>
        <div className="assignment-meta-info">
          <span>🎯 Tổng điểm: {assignment.max_score}</span>
          {assignment.due_date && (
            <span>📅 Hạn nộp: {new Date(assignment.due_date).toLocaleString('vi-VN')}</span>
          )}
          <span>📝 {assignment.questions?.length || 0} câu hỏi</span>
        </div>
      </div>

      {/* Graded Feedback */}
      {isGraded && submission.feedback && (
        <div className="feedback-box">
          <h3>💬 Nhận xét của giáo viên</h3>
          <p>{submission.feedback}</p>
        </div>
      )}

      {/* Questions */}
      <div className="questions-container">
        {assignment.questions?.map((question: any, index: number) => (
          <div key={question.id} className="question-card">
            <div className="question-header">
              <span className="question-number">Câu {index + 1}</span>
              <span className="question-points">{question.points || 10} điểm</span>
            </div>

            <div className="question-text">{question.question_text}</div>

            {question.question_type === 'multiple_choice' && question.options && (
              <div className="options-list">
                {question.options.map((option: string, optIndex: number) => (
                  <label key={optIndex} className="option-item">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      disabled={isSubmitted}
                    />
                    <span className="option-text">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {(question.question_type === 'short_answer' || 
              question.question_type === 'fill_blank' ||
              question.question_type === 'translation') && (
              <input
                type="text"
                className="answer-input"
                placeholder="Nhập câu trả lời..."
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                disabled={isSubmitted}
              />
            )}

            {question.question_type === 'essay' && (
              <textarea
                className="answer-textarea"
                placeholder="Viết câu trả lời của bạn..."
                rows={8}
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                disabled={isSubmitted}
              />
            )}

            {question.question_type === 'audio_response' && (
              <div className="audio-response">
                <p className="audio-hint">🎤 Ghi âm câu trả lời của bạn</p>
                <button className="btn btn-outline" disabled={isSubmitted}>
                  Ghi âm
                </button>
              </div>
            )}

            {/* Show answer feedback if graded */}
            {isGraded && submission.answers?.find((a: any) => a.question_id === question.id)?.feedback && (
              <div className="answer-feedback">
                <strong>Nhận xét:</strong>{' '}
                {submission.answers.find((a: any) => a.question_id === question.id).feedback}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {!isSubmitted && (
        <div className="assignment-actions">
          <button
            className="btn btn-outline"
            onClick={handleSaveDraft}
            disabled={saving || submitting}
          >
            {saving ? 'Đang lưu...' : '💾 Lưu bản nháp'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || submitting}
          >
            {submitting ? 'Đang nộp...' : '✅ Nộp bài'}
          </button>
        </div>
      )}

      {isSubmitted && !isGraded && (
        <div className="submitted-message">
          <div className="success-icon">✅</div>
          <h3>Đã nộp bài thành công!</h3>
          <p>Giáo viên sẽ chấm bài và trả kết quả sớm.</p>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetail;
