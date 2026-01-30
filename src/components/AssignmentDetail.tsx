import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignmentById, createSubmission, saveAnswer, submitAssignment, getMySubmissions } from '../services/assignmentService';
import { getHomeworkSubmissions, getStudentSubmission, submitHomework, gradeSubmission } from '../services/homeworkService';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { uploadFile, formatFileSize, validateFileSize } from '../utils/fileUpload';
import '../styles/assignments.css';
import '../styles/assignment-form.css';

const AssignmentDetail = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user, isTeacher } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  // Homework (bài tập đã giao) state
  const [isHomework, setIsHomework] = useState(false);
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<any[]>([]);
  const [homeworkSubmission, setHomeworkSubmission] = useState<any>(null);
  const [homeworkContent, setHomeworkContent] = useState('');
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradeValue, setGradeValue] = useState('');

  useEffect(() => {
    if (assignmentId && user) {
      loadAssignment();
    }
  }, [assignmentId, user, isTeacher]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      setIsHomework(false);
      setHomeworkSubmissions([]);
      setHomeworkSubmission(null);

      let assignmentData = await getAssignmentById(assignmentId!);

      // Fallback: bài tập đã giao (homework) - bảng homework có class_id, không có lesson_id
      if (!assignmentData) {
        const { data: hw, error: hwError } = await supabase
          .from('homework')
          .select(`
            *,
            classes (name, code)
          `)
          .eq('id', assignmentId)
          .maybeSingle();

        if (hwError) throw hwError;
        if (hw) {
          assignmentData = {
            ...hw,
            instructions: hw.description || '',
            assignment_type: 'mixed',
            questions: [],
            source: 'homework',
          };
          setIsHomework(true);

          if (isTeacher) {
            const list = await getHomeworkSubmissions(assignmentId!);
            setHomeworkSubmissions(list || []);
          } else {
            const mySub = await getStudentSubmission(assignmentId!, user!.id);
            setHomeworkSubmission(mySub || null);
            if (mySub) setHomeworkContent(mySub.content || '');
          }
        }
      }

      setAssignment(assignmentData);

      if (assignmentData && !assignmentData.source && user) {
        const submissions = await getMySubmissions(user.id, assignmentId, 1, 1);
        if (submissions.data.length > 0) {
          const existingSubmission = submissions.data[0];
          setSubmission(existingSubmission);
          if (existingSubmission.answers) {
            const answersMap: Record<string, string> = {};
            const filesMap: Record<string, string[]> = {};
            existingSubmission.answers.forEach((ans: any) => {
              answersMap[ans.question_id] = ans.answer_text || '';
              filesMap[ans.question_id] = ans.file_urls || [];
            });
            setAnswers(answersMap);
            setUploadedFiles(filesMap);
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

  const handleFileUpload = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate size
    for (const file of files) {
      if (!validateFileSize(file, 20)) {
        showToast(`File ${file.name} quá lớn (tối đa 20MB)`, 'error');
        return;
      }
    }

    try {
      setUploading(prev => ({ ...prev, [questionId]: true }));
      const newUrls = [...(uploadedFiles[questionId] || [])];

      for (const file of files) {
        const { url, error } = await uploadFile(file, 'documents', 'submissions');
        if (error) throw new Error(error);
        newUrls.push(url);
      }

      setUploadedFiles(prev => ({ ...prev, [questionId]: newUrls }));
      showToast('Đã tải lên các file', 'success');
    } catch (error: any) {
      showToast('Lỗi tải file: ' + error.message, 'error');
    } finally {
      setUploading(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const removeUploadedFile = (questionId: string, urlToRemove: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      [questionId]: (prev[questionId] || []).filter(url => url !== urlToRemove)
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
            file_urls: uploadedFiles[questionId] || [],
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
        if (assignment.class_id) {
          navigate(`/class/${assignment.class_id}`);
        } else {
          navigate('/my-assignments');
        }
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
        <span className="not-found-icon">📝</span>
        <h2>Không tìm thấy bài tập</h2>
        <p>
          Bài tập này có thể đã bị xóa, chưa được xuất bản, hoặc bạn không có quyền truy cập.
          Vui lòng liên hệ với giáo viên của bạn nếu bạn nghĩ đây là một lỗi.
        </p>
        <div className="not-found-actions">
          <button onClick={() => navigate(-1)} className="back-btn" style={{ marginBottom: 0 }}>
            ← Quay lại
          </button>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // === Bài tập đã giao (homework) - view riêng ===
  if (isHomework) {
    const handleSubmitHomework = async () => {
      if (!homeworkContent.trim()) {
        showToast('Vui lòng nhập nội dung bài làm', 'warning');
        return;
      }
      try {
        setSubmitting(true);
        await submitHomework({
          homework_id: assignmentId!,
          student_id: user!.id,
          content: homeworkContent.trim(),
        });
        showToast('Nộp bài thành công!', 'success');
        const mySub = await getStudentSubmission(assignmentId!, user!.id);
        setHomeworkSubmission(mySub || null);
      } catch (e: any) {
        showToast(e?.message || 'Lỗi khi nộp bài', 'error');
      } finally {
        setSubmitting(false);
      }
    };

    const handleGradeSubmission = async (submissionId: string) => {
      if (!gradeFeedback.trim() || !gradeValue.trim()) {
        showToast('Vui lòng nhập điểm và nhận xét', 'warning');
        return;
      }
      try {
        await gradeSubmission(submissionId, gradeFeedback.trim(), gradeValue.trim());
        showToast('Đã lưu chấm bài', 'success');
        setGradingId(null);
        setGradeFeedback('');
        setGradeValue('');
        const list = await getHomeworkSubmissions(assignmentId!);
        setHomeworkSubmissions(list || []);
      } catch (e: any) {
        showToast(e?.message || 'Lỗi khi chấm bài', 'error');
      }
    };

    return (
      <div className="assignment-detail-container">
        <div className="assignment-detail-header">
          <button onClick={() => navigate(-1)} className="back-btn">← Quay lại</button>
          <div className="header-content">
            <div className="header-left">
              <h1>{assignment.title}</h1>
              {assignment.classes && (
                <p className="assignment-instructions">
                  Lớp: {assignment.classes.name} {assignment.classes.code && `(${assignment.classes.code})`}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="assignment-instructions-box">
          <h3>📋 Nội dung bài tập</h3>
          <div className="instructions-content">{assignment.description || assignment.instructions || 'Không có mô tả.'}</div>
          {assignment.due_date && (
            <div className="assignment-meta-info">
              <div className="meta-item">
                <span className="meta-icon">📅</span>
                <span>Hạn nộp: <strong>{new Date(assignment.due_date).toLocaleString('vi-VN')}</strong></span>
              </div>
            </div>
          )}
        </div>

        {isTeacher ? (
          <div className="questions-container" style={{ marginTop: '1.5rem' }}>
            <h3>📥 Bài nộp của học sinh ({homeworkSubmissions.length})</h3>
            {homeworkSubmissions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Chưa có bài nộp nào.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {homeworkSubmissions.map((sub: any) => (
                  <div key={sub.id} className="question-card" style={{ padding: '1.25rem' }}>
                    <div className="question-header" style={{ marginBottom: '0.75rem' }}>
                      <span className="question-number">
                        {(sub.profiles?.full_name || sub.profiles?.email || 'Học sinh')}
                      </span>
                      {sub.grade != null && sub.grade !== '' && (
                        <span className="question-points">Điểm: {sub.grade}</span>
                      )}
                    </div>
                    <div className="instructions-content" style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                      {sub.content || '(Trống)'}
                    </div>
                    {gradingId === sub.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder="Điểm (ví dụ: 8/10)"
                          value={gradeValue}
                          onChange={e => setGradeValue(e.target.value)}
                          className="answer-input"
                          style={{ maxWidth: '200px' }}
                        />
                        <textarea
                          placeholder="Nhận xét"
                          value={gradeFeedback}
                          onChange={e => setGradeFeedback(e.target.value)}
                          className="answer-textarea"
                          rows={3}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary" onClick={() => handleGradeSubmission(sub.id)}>
                            Lưu chấm
                          </button>
                          <button className="btn btn-outline" onClick={() => { setGradingId(null); setGradeFeedback(''); setGradeValue(''); }}>
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {sub.feedback && <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}><strong>Nhận xét:</strong> {sub.feedback}</p>}
                        <button className="btn btn-outline" onClick={() => { setGradingId(sub.id); setGradeFeedback(sub.feedback || ''); setGradeValue(sub.grade || ''); }}>
                          {sub.grade != null && sub.grade !== '' ? 'Sửa chấm' : 'Chấm bài'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="questions-container" style={{ marginTop: '1.5rem' }}>
            {homeworkSubmission ? (
              <>
                <h3>📝 Bài làm của bạn</h3>
                <div className="instructions-content" style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                  {homeworkSubmission.content || '(Trống)'}
                </div>
                {homeworkSubmission.grade != null && homeworkSubmission.grade !== '' && (
                  <p style={{ marginTop: '1rem' }}><strong>Điểm:</strong> {homeworkSubmission.grade}</p>
                )}
                {homeworkSubmission.feedback && (
                  <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}><strong>Nhận xét:</strong> {homeworkSubmission.feedback}</p>
                )}
                <div className="submitted-message" style={{ marginTop: '1.5rem' }}>
                  <div className="success-icon">✅</div>
                  <h3>Đã nộp bài</h3>
                </div>
              </>
            ) : (
              <>
                <h3>Nộp bài</h3>
                <textarea
                  className="answer-textarea"
                  placeholder="Nhập nội dung bài làm..."
                  rows={8}
                  value={homeworkContent}
                  onChange={e => setHomeworkContent(e.target.value)}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                />
                <div className="assignment-actions" style={{ marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={handleSubmitHomework} disabled={submitting}>
                    {submitting ? 'Đang nộp...' : '✅ Nộp bài'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
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
        <h3>📋 Hướng dẫn chi tiết</h3>
        <div className="instructions-content">
          {assignment.instructions}
        </div>
        <div className="assignment-meta-info">
          <div className="meta-item">
            <span className="meta-icon">🎯</span>
            <span>Tổng điểm: <strong>{assignment.max_score}</strong></span>
          </div>
          {assignment.due_date && (
            <div className="meta-item">
              <span className="meta-icon">📅</span>
              <span>Hạn nộp: <strong>{new Date(assignment.due_date).toLocaleString('vi-VN')}</strong></span>
            </div>
          )}
          <div className="meta-item">
            <span className="meta-icon">📝</span>
            <span>Số lượng: <strong>{assignment.questions?.length || 0} câu hỏi</strong></span>
          </div>
        </div>

        {/* Media Attachments for Assignment */}
        {(assignment.attachment_urls?.length > 0 || assignment.audio_url || assignment.video_url) && (
          <div className="assignment-media-section mt-4">
            <h4 className="text-sm font-bold text-slate-500 mb-2">Tài liệu đính kèm:</h4>
            <div className="flex flex-wrap gap-4">
              {assignment.attachment_urls?.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" className="media-link">🖼️ Ảnh {i + 1}</a>
              ))}
              {assignment.audio_url && (
                <div className="audio-player-wrapper">
                  <span className="mr-2">🎵 Hướng dẫn:</span>
                  <audio src={assignment.audio_url} controls className="h-8" />
                </div>
              )}
              {assignment.video_url && (
                <a href={assignment.video_url} target="_blank" rel="noreferrer" className="dashboard-btn dashboard-btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  📹 Video hướng dẫn
                </a>
              )}
            </div>
          </div>
        )}
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

            {/* Question Media Prompts */}
            {(question.attachment_urls?.length > 0 || question.audio_url || question.video_url) && (
              <div className="question-media-prompts mb-4">
                <div className="flex flex-wrap gap-2">
                  {question.attachment_urls?.map((url: string, i: number) => (
                    <img key={i} src={url} alt="Prompt" className="max-h-48 rounded-lg shadow-sm" />
                  ))}
                  {question.audio_url && <audio src={question.audio_url} controls className="h-8" />}
                </div>
              </div>
            )}

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
                  Ghi âm (Coming Soon)
                </button>
              </div>
            )}

            {/* File Upload for Students */}
            {(question.requires_file_upload || assignment.allow_file_upload) && (
              <div className="student-file-upload-section mt-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Tệp nộp bài:</h5>
                <div className="flex flex-col gap-2">
                  {!isSubmitted && (
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => document.getElementById(`file-upload-${question.id}`)?.click()}
                        disabled={uploading[question.id]}
                      >
                        {uploading[question.id] ? '⏳ Đang tải...' : '📎 Chọn tệp'}
                      </button>
                      <input
                        type="file"
                        id={`file-upload-${question.id}`}
                        multiple
                        hidden
                        onChange={(e) => handleFileUpload(question.id, e)}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles[question.id]?.map((url, i) => (
                      <div key={i} className="uploaded-file-pill">
                        <a href={url} target="_blank" rel="noreferrer">File {i + 1}</a>
                        {!isSubmitted && (
                          <button className="ml-2 text-red-500" onClick={() => removeUploadedFile(question.id, url)}>×</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
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
