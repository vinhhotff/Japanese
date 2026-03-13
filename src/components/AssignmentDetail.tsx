import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssignmentById, createSubmission, saveAnswer, submitAssignment, getMySubmissions } from '../services/assignmentService';
import { getHomeworkSubmissions, getStudentSubmission, submitHomework, gradeSubmission } from '../services/homeworkService';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { uploadFile, formatFileSize, validateFileSize } from '../utils/fileUpload';
import '../styles/assignments.css';
import '../styles/assignment-form.css';
import '../styles/assignment-premium.css';

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

  const isUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

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

      if (!assignmentId || !isUUID(assignmentId)) {
        console.warn('Invalid assignment ID format');
        setAssignment(null);
        setLoading(false);
        return;
      }

      let assignmentData = null;

      // First attempt: Media Assignments
      try {
        assignmentData = await getAssignmentById(assignmentId);
      } catch (err) {
        console.warn('Media assignment fetch failed:', err);
      }

      // Fallback: Homework
      if (!assignmentData) {
        const { data: hw, error: hwError } = await supabase
          .from('homework')
          .select(`*, classes(name, code)`)
          .eq('id', assignmentId)
          .maybeSingle();

        if (hwError) {
          console.error('Homework fetch error:', hwError);
        } else if (hw) {
          assignmentData = {
            ...hw,
            instructions: hw.description || '',
            assignment_type: 'mixed',
            questions: [],
            source: 'homework',
          };
          setIsHomework(true);

          if (isTeacher) {
            try {
              const list = await getHomeworkSubmissions(assignmentId);
              setHomeworkSubmissions(list || []);
            } catch (e) {
              console.error('Error fetching homework submissions:', e);
            }
          } else {
            try {
              const mySub = await getStudentSubmission(assignmentId, user!.id);
              setHomeworkSubmission(mySub || null);
              if (mySub) setHomeworkContent(mySub.content || '');
            } catch (e) {
              console.error('Error fetching student submission:', e);
            }
          }
        }
      }

      setAssignment(assignmentData);

      if (assignmentData && !assignmentData.source && user) {
        try {
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
        } catch (e) {
          console.error('Error fetching submissions for media assignment:', e);
        }
      }
    } catch (error) {
      console.error('Critical error in loadAssignment:', error);
      showToast('Lỗi hệ thống khi tải bài tập', 'error');
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
      <div className="premium-login-container" style={{ background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="loading-orb"
          style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--asg-primary) 0%, var(--asg-secondary) 100%)', filter: 'blur(10px)', opacity: 0.6 }}
        />
        <div className="dashboard-loading-spinner" style={{ marginTop: '-40px' }} />
        <p className="mt-4 font-bold text-slate-500">Đang khởi tạo học liệu bài tập...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="premium-login-container" style={{ background: 'var(--bg-color)' }}>
        {/* Sync with homepage pattern */}
        <svg className="cultural-pattern" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="sakura-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M50 20 L55 35 L70 35 L60 45 L65 60 L50 50 L35 60 L40 45 L30 35 L45 35 Z" fill="currentColor" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sakura-pattern)" />
        </svg>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-login-card text-center"
          style={{ maxWidth: '600px' }}
        >
          <div className="premium-header">
            <div className="login-welcome-badge">ASSIGNMENT STATUS</div>
            <h1 className="text-4xl font-black mb-4">Không tìm thấy bài tập</h1>
            <p className="text-slate-500 mb-8">
              Học liệu này có thể đã được thu hồi, hết hạn hoặc bạn đang truy cập bằng tài khoản không có thẩm quyền.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="modern-submit-btn"
              style={{ background: 'var(--login-primary)' }}
            >
              <span>🔙 Quay lại trang trước</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/')}
              className="back-home-button"
              style={{ justifyContent: 'center' }}
            >
              🏠 Về trang chủ Dashboard
            </motion.button>
          </div>

          <div className="login-card-footer">
            <p>Nếu bạn cho rằng đây là lỗi hệ thống, vui lòng liên hệ bộ phận hỗ trợ học tập.</p>
          </div>
        </motion.div>
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
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="assignment-detail-container"
      >
        <div className="assignment-detail-header">
          <motion.button
            whileHover={{ x: -10 }}
            onClick={() => navigate(-1)}
            className="back-home-button mb-8"
            style={{ border: '1px solid var(--border-color)' }}
          >
            ← Quay lại
          </motion.button>
          <div className="header-content">
            <div className="header-left">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-black mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                {assignment.title}
              </motion.h1>
              {assignment.classes && (
                <div className="assignment-type inline-block">
                  LỚP: {assignment.classes.name} {assignment.classes.code && `(${assignment.classes.code})`}
                </div>
              )}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="assignment-instructions-box"
        >
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="p-2 bg-indigo-100 rounded-lg">📋</span>
            Nội dung bài tập
          </h3>
          <div className="instructions-content" style={{ whiteSpace: 'pre-wrap' }}>
            {assignment.description || assignment.instructions || 'Không có mô tả chi tiết cho bài tập này.'}
          </div>
          {assignment.due_date && (
            <div className="assignment-meta-info">
              <div className="meta-item bg-red-50 p-4 rounded-xl border border-red-100">
                <span className="meta-icon">📅</span>
                <span style={{ color: '#b91c1c' }}>Hạn nộp bài: <strong>{new Date(assignment.due_date).toLocaleString('vi-VN')}</strong></span>
              </div>
            </div>
          )}
        </motion.div>

        {isTeacher ? (
          <div className="assignment-premium-wrapper">
            <h3 className="text-3xl font-black text-slate-100 flex items-center gap-4 mb-4">
              <span className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">👥</span>
              Danh sách bài nộp ({homeworkSubmissions.length})
            </h3>

            {homeworkSubmissions.length === 0 ? (
              <div className="assignment-glass-card text-center py-20 flex flex-col items-center">
                <div className="text-6xl mb-6">🏜️</div>
                <p className="text-slate-400 text-lg">Chưa có học sinh nào nộp bài tập này.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-12">
                {homeworkSubmissions.map((sub: any) => (
                  <motion.div
                    key={sub.id}
                    layout
                    className="assignment-glass-card"
                  >
                    <div className="teacher-info-row">
                      <div className="teacher-avatar-placeholder">
                        {sub.profiles?.full_name?.[0]?.toUpperCase() || 'H'}
                      </div>
                      <div className="submission-meta">
                        <div className="student-name-premium">{sub.profiles?.full_name || 'Học sinh'}</div>
                        <div className="submitted-at-premium">
                          Nộp vào: {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>

                    {sub.grade && (
                      <div className="score-pill-large">
                        <span className="opacity-70 text-sm uppercase tracking-tighter">Điểm:</span>
                        {sub.grade}
                      </div>
                    )}

                    <div className="submission-content-box mb-8">
                      {sub.content || '(Không có nội dung)'}
                    </div>

                    {gradingId === sub.id ? (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grading-form-premium"
                      >
                        <h5 className="section-title-premium">
                          <span>📝</span> Chấm điểm & Nhận xét
                        </h5>
                        <div className="grading-grid">
                          <div className="premium-input-group">
                            <label>Số điểm / Thang điểm</label>
                            <input
                              type="text"
                              placeholder="Ví dụ: 9/10"
                              value={gradeValue}
                              onChange={e => setGradeValue(e.target.value)}
                              className="premium-input"
                            />
                          </div>
                          <div className="premium-input-group">
                            <label>Nhận xét chi tiết</label>
                            <textarea
                              placeholder="Lời khuyên hoặc chỉnh sửa cho học sinh..."
                              value={gradeFeedback}
                              onChange={e => setGradeFeedback(e.target.value)}
                              className="premium-textarea"
                              rows={4}
                            />
                          </div>
                        </div>
                        <div className="action-buttons-row">
                          <button className="btn-premium-save" onClick={() => handleGradeSubmission(sub.id)}>
                            💾 Lưu kết quả
                          </button>
                          <button className="btn-premium-cancel" onClick={() => { setGradingId(null); setGradeFeedback(''); setGradeValue(''); }}>
                            Hủy
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        {sub.feedback && (
                          <div className="flex-1 p-6 bg-indigo-500/10 rounded-2xl border-l-4 border-indigo-400">
                            <p className="text-indigo-200">
                              <strong className="text-indigo-300">💬 Nhận xét:</strong> {sub.feedback}
                            </p>
                          </div>
                        )}
                        <button
                          className="btn-premium-save"
                          style={{ minWidth: '180px', justifyContent: 'center' }}
                          onClick={() => { setGradingId(sub.id); setGradeFeedback(sub.feedback || ''); setGradeValue(sub.grade || ''); }}
                        >
                          {sub.grade != null && sub.grade !== '' ? '✏️ Sửa chấm' : '📝 Chấm ngay'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="assignment-premium-wrapper">
            {homeworkSubmission ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="assignment-glass-card"
              >
                <div className="assignment-detail-header-premium">
                  <h3 className="section-title-premium">📝 Bài làm của bạn</h3>
                  {homeworkSubmission.grade && (
                    <div className="score-pill-large" style={{ margin: 0 }}>
                      <span className="opacity-70 text-sm">Điểm số:</span> {homeworkSubmission.grade}
                    </div>
                  )}
                </div>

                <div className="submission-content-box mb-12">
                  {homeworkSubmission.content || '(Trống)'}
                </div>

                {homeworkSubmission.feedback && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="feedback-box"
                  >
                    <h3 className="section-title-premium" style={{ marginBottom: '1rem' }}>
                      <span>💬</span> Nhận xét từ giáo viên:
                    </h3>
                    <p style={{ fontStyle: 'italic', color: '#e2e8f0', fontSize: '1.2rem', lineHeight: 1.6 }}>
                      "{homeworkSubmission.feedback}"
                    </p>
                  </motion.div>
                )}

                <div className="mt-16 p-8 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-emerald-400 font-black text-xl">Bài nộp đã được ghi nhận</h3>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="assignment-glass-card"
              >
                <h3 className="section-title-premium">Nộp bài tập</h3>
                <textarea
                  className="premium-textarea"
                  placeholder="Hãy nhập câu trả lời hoặc nội dung bài làm tại đây..."
                  rows={12}
                  value={homeworkContent}
                  onChange={e => setHomeworkContent(e.target.value)}
                  style={{ fontSize: '1.2rem', padding: '2rem', width: '100%' }}
                />
                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn-premium-save btn-large"
                    onClick={handleSubmitHomework}
                    disabled={submitting}
                  >
                    <span>{submitting ? '⏳ Đang gửi bài...' : '🚀 Nộp bài ngay'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded' || submission?.status === 'returned';
  const isGraded = submission?.status === 'graded' || submission?.status === 'returned';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="assignment-premium-wrapper"
    >
      {/* Header */}
      <div className="assignment-glass-card relative">
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate(-1)}
          className="back-btn-premium"
          style={{
            position: 'relative',
            zIndex: 10,
            color: '#818cf8',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          ← Quay lại
        </motion.button>
        <div className="assignment-detail-header-premium">
          <div className="header-text-premium">
            <h1>{assignment.title}</h1>
            <p>{assignment.description}</p>
          </div>
          <div className="header-meta-premium">
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
      <div className="assignment-glass-card">
        <h3 className="section-title-premium">
          <span>📋</span> Hướng dẫn chi tiết
        </h3>
        <div className="submission-content-box mb-8">
          {assignment.instructions}
        </div>
        <div className="assignment-meta-info-premium">
          <div className="meta-item-premium">
            <div className="meta-icon-premium teal">🎯</div>
            <span>Tổng điểm: <strong>{assignment.max_score}</strong></span>
          </div>
          {assignment.due_date && (
            <div className="meta-item-premium">
              <div className="meta-icon-premium indigo">📅</div>
              <span>Hạn nộp: <strong>{new Date(assignment.due_date).toLocaleString('vi-VN')}</strong></span>
            </div>
          )}
          <div className="meta-item-premium">
            <div className="meta-icon-premium pink">📝</div>
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
      <div className="question-list-premium">
        {assignment.questions?.map((question: any, index: number) => (
          <div key={question.id} className="assignment-glass-card question-card-premium">
            <div className="question-header-premium">
              <div className="question-id-badge">
                <span className="question-number-premium">
                  {index + 1}
                </span>
                <span className="question-label-premium">CÂU HỎI</span>
              </div>
              <span className="question-points-premium">
                {question.points || 10} điểm
              </span>
            </div>

            <div className="question-text-premium mb-6">
              {question.question_text}
            </div>

            {/* Question Media Prompts */}
            {(question.attachment_urls?.length > 0 || question.audio_url || question.video_url) && (
              <div className="question-media-wrapper">
                <div className="question-media-list">
                  {question.attachment_urls?.map((url: string, i: number) => (
                    <div key={i} className="question-media-container">
                      <img src={url} alt="Prompt" className="question-media-image" />
                    </div>
                  ))}
                  {question.audio_url && <audio src={question.audio_url} controls className="h-8" />}
                </div>
              </div>
            )}

            {question.question_type === 'multiple_choice' && question.options && (
              <div className="options-grid-premium">
                {question.options.map((option: string, optIndex: number) => (
                  <label key={optIndex} className={`option-item-premium ${answers[question.id] === option ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      disabled={isSubmitted}
                      className="option-radio-premium"
                    />
                    <span className="option-text-premium">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {(question.question_type === 'short_answer' ||
              question.question_type === 'fill_blank' ||
              question.question_type === 'translation') && (
                <div style={{ marginTop: '1.5rem' }}>
                  <input
                    type="text"
                    className="premium-input"
                    style={{ width: '100%' }}
                    placeholder="Nhập câu trả lời chi tiết..."
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    disabled={isSubmitted}
                  />
                </div>
              )}

            {question.question_type === 'essay' && (
              <div style={{ marginTop: '1.5rem' }}>
                <textarea
                  className="premium-textarea"
                  style={{ width: '100%' }}
                  placeholder="Viết câu trả lời của bạn..."
                  rows={6}
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={isSubmitted}
                />
              </div>
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
              <div className="student-file-upload-section" style={{ marginTop: '2rem' }}>
                <h5 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tệp nộp bài:</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {!isSubmitted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        className="btn-premium-cancel"
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

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {uploadedFiles[question.id]?.map((url, i) => (
                      <div key={i} className="uploaded-file-pill">
                        <a href={url} target="_blank" rel="noreferrer">File {i + 1}</a>
                        {!isSubmitted && (
                          <button style={{ marginLeft: '0.5rem', color: '#ef4444', cursor: 'pointer', background: 'transparent', border: 'none' }} onClick={() => removeUploadedFile(question.id, url)}>×</button>
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
        <div className="action-bar-student-premium">
          <div className="action-bar-inner">
            <button
              className="btn-premium-cancel btn-large"
              onClick={handleSaveDraft}
              disabled={saving || submitting}
            >
              {saving ? '⏳ Đang lưu...' : '💾 Lưu bản nháp'}
            </button>
            <button
              className="btn-premium-save btn-large"
              onClick={handleSubmit}
              disabled={saving || submitting}
            >
              {submitting ? '⏳ Đang nộp...' : '🚀 Nộp bài ngay'}
            </button>
          </div>
        </div>
      )}

      {isSubmitted && !isGraded && (
        <div className="submitted-message">
          <div className="success-icon">✅</div>
          <h3>Đã nộp bài thành công!</h3>
          <p>Giáo viên sẽ chấm bài và trả kết quả sớm.</p>
        </div>
      )}
    </motion.div>
  );
};

export default AssignmentDetail;
