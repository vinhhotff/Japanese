import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    createAssignment,
    updateAssignment,
    getAssignmentById,
    AssignmentType,
    QuestionType
} from '../services/assignmentService';
import { uploadFile, getFileType, validateFileSize } from '../utils/fileUpload';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../config/supabase';
import '../styles/assignment-form.css';
import '../styles/teacher-dashboard-premium.css';

type FormTab = 'general' | 'media' | 'questions' | 'settings';

interface Question {
    id?: string;
    question_number: number;
    question_text: string;
    question_type: QuestionType;
    options: string[];
    correct_answer: string;
    points: number;
    hint?: string;
    explanation?: string;
    attachment_urls: string[];
    audio_url: string | null;
    video_url: string | null;
    requires_file_upload: boolean;
    allowed_file_types: string[];
}

const AssignmentForm: React.FC = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    // UI State
    const [activeTab, setActiveTab] = useState<FormTab>('general');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Assignment Data
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('exercise');
    const [assignmentType, setAssignmentType] = useState<AssignmentType>('mixed');
    const [language, setLanguage] = useState<'japanese' | 'chinese'>('japanese');
    const [level, setLevel] = useState('N5');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

    // Media
    const [instructions, setInstructions] = useState('');
    const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    // Settings
    const [dueDate, setDueDate] = useState('');
    const [maxScore, setMaxScore] = useState(100);
    const [passingScore, setPassingScore] = useState(50);
    const [allowedAttempts, setAllowedAttempts] = useState(1);
    const [durationMinutes, setDurationMinutes] = useState(0);
    const [isPublished, setIsPublished] = useState(true);
    const [allowFileUpload, setAllowFileUpload] = useState(false);

    // Class & Lesson Context
    const [classId, setClassId] = useState<string | null>(null);
    const [lessonId, setLessonId] = useState<string | null>(null);
    const [classList, setClassList] = useState<any[]>([]);
    const [lessonList, setLessonList] = useState<any[]>([]);

    // Questions
    const [questions, setQuestions] = useState<Question[]>([]);

    // Refs for file inputs
    const audioInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const qAudioRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
    const qImageRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const cid = queryParams.get('classId');
        const lid = queryParams.get('lessonId');
        if (cid) setClassId(cid);
        if (lid) setLessonId(lid);

        if (assignmentId) {
            loadAssignment();
        } else {
            addQuestion();
        }
        loadSelectors();
    }, [assignmentId]);

    const loadSelectors = async () => {
        try {
            const { data: classesData } = await supabase.from('classes').select('id, name');
            const { data: lessonsData } = await supabase.from('lessons').select('id, title, lesson_number').order('lesson_number');
            setClassList(classesData || []);
            setLessonList(lessonsData || []);
        } catch (error) {
            console.error('Error loading selectors:', error);
        }
    };

    const loadAssignment = async () => {
        try {
            setLoading(true);
            const data = await getAssignmentById(assignmentId!);
            setTitle(data.title);
            setDescription(data.description || '');
            setCategory(data.category || 'exercise');
            setAssignmentType(data.assignment_type);
            setLanguage(data.language);
            setLevel(data.level || 'N5');
            setDifficulty(data.difficulty || 'medium');

            setInstructions(data.instructions || '');
            setAttachmentUrls(data.attachment_urls || []);
            setAudioUrl(data.audio_url);
            setVideoUrl(data.video_url);

            setDueDate(data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : '');
            setMaxScore(data.max_score);
            setPassingScore(data.passing_score || 50);
            setAllowedAttempts(data.allowed_attempts || 1);
            setDurationMinutes(data.duration_minutes || 0);
            setIsPublished(data.is_published ?? true);
            setAllowFileUpload(data.allow_file_upload || false);
            setClassId(data.class_id || null);
            setLessonId(data.lesson_id || null);

            setQuestions(data.questions || []);
        } catch (error: any) {
            showToast('Lỗi tải bài tập: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        const newQuestion: Question = {
            question_number: questions.length + 1,
            question_text: '',
            question_type: 'multiple_choice',
            options: ['', '', '', ''],
            correct_answer: '',
            points: 10,
            attachment_urls: [],
            audio_url: null,
            video_url: null,
            requires_file_upload: false,
            allowed_file_types: []
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions.map((q, i) => ({ ...q, question_number: i + 1 })));
    };

    const removeAssignmentMedia = (type: 'audio' | 'video' | 'image', index?: number) => {
        if (type === 'audio') setAudioUrl(null);
        else if (type === 'video') setVideoUrl(null);
        else if (type === 'image' && index !== undefined) {
            setAttachmentUrls(attachmentUrls.filter((_, i) => i !== index));
        }
    };

    const removeQuestionMedia = (qIdx: number, type: 'audio' | 'video' | 'image', imgIdx?: number) => {
        const q = questions[qIdx];
        if (type === 'audio') updateQuestion(qIdx, { audio_url: null });
        else if (type === 'video') updateQuestion(qIdx, { video_url: null });
        else if (type === 'image' && imgIdx !== undefined) {
            updateQuestion(qIdx, {
                attachment_urls: q.attachment_urls.filter((_, i) => i !== imgIdx)
            });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'assignment' | 'question', questionIndex?: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!validateFileSize(file, 20)) {
            showToast('File quá lớn (tối đa 20MB)', 'error');
            return;
        }

        try {
            setSaving(true);
            const fileType = getFileType(file);
            let bucket = 'documents';
            if (fileType === 'image') bucket = 'images';
            else if (fileType === 'audio') bucket = 'audio-files';
            else if (fileType === 'video') bucket = 'videos';

            const { url, error } = await uploadFile(file, bucket, 'assignments');

            if (error) throw new Error(error);

            if (type === 'assignment') {
                if (fileType === 'image') setAttachmentUrls([...attachmentUrls, url]);
                else if (fileType === 'audio') setAudioUrl(url);
                else if (fileType === 'video') setVideoUrl(url);
            } else if (questionIndex !== undefined) {
                if (fileType === 'image') {
                    const q = questions[questionIndex];
                    updateQuestion(questionIndex, { attachment_urls: [...q.attachment_urls, url] });
                } else if (fileType === 'audio') {
                    updateQuestion(questionIndex, { audio_url: url });
                }
            }
            showToast('Tải lên thành công', 'success');
        } catch (error: any) {
            showToast('Lỗi tải file: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            showToast('Vui lòng nhập tiêu đề', 'warning');
            setActiveTab('general');
            return;
        }

        try {
            setSaving(true);
            if (!user?.id) {
                showToast('Bạn cần đăng nhập để tạo bài tập', 'error');
                return;
            }

            const data = {
                title,
                description,
                category,
                assignment_type: assignmentType,
                language,
                level,
                difficulty,
                instructions,
                attachment_urls: attachmentUrls,
                audio_url: audioUrl,
                video_url: videoUrl,
                due_date: dueDate || null,
                max_score: maxScore,
                passing_score: passingScore,
                allowed_attempts: allowedAttempts,
                duration_minutes: durationMinutes,
                is_published: isPublished,
                allow_file_upload: allowFileUpload,
                questions: questions,
                created_by: user.id,
                class_id: classId,
                lesson_id: lessonId
            };

            if (assignmentId) {
                await updateAssignment(assignmentId, data);
            } else {
                await createAssignment(data as any);
            }
            showToast('Đã lưu bài tập thành công!', 'success');
            if (assignmentId) {
                navigate(-1);
            } else {
                navigate('/teacher-dashboard');
            }
        } catch (error: any) {
            showToast('Lỗi lưu: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="td-wrap">
            <div className="td-loading"><div className="td-spinner" /><span className="td-loading-text">Đang tải cấu trúc bài tập...</span></div>
        </div>
    );

    return (
        <div className="td-wrap">
            {/* Topbar */}
            <header className="td-topbar">
                <Link to="/" className="td-logo">
                    <div className="td-logo-icon">🎓</div>
                    <div>
                        <div className="td-logo-text">Teacher Panel</div>
                        <div className="td-logo-sub">Tạo bài tập</div>
                    </div>
                </Link>
                <nav className="td-topnav">
                    <button className="td-nav-btn active">📚 Quản lý</button>
                </nav>
                <div className="td-topbar-actions">
                    <button className="td-btn-ghost" onClick={() => navigate(-1)} title="Quay lại">←</button>
                </div>
            </header>

            {/* Page */}
            <div className="td-page">

                {/* Page Title */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--t-text)', margin: '0 0 0.375rem' }}>
                        {assignmentId ? 'Hiệu chỉnh Bài tập' : 'Tạo Bài tập mới'}
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--t-text-secondary)', margin: 0 }}>
                        {assignmentId ? 'Chỉnh sửa nội dung và cấu hình bài tập hiện có.' : 'Thiết lập bài tập mới cho học viên.'}
                    </p>
                </div>

                {/* Tab Nav */}
                <div className="td-cm-tabs" style={{ marginBottom: '1.5rem' }}>
                    {(['general', 'media', 'questions', 'settings'] as FormTab[]).map(tab => (
                        <button
                            key={tab}
                            className={`td-cm-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'general' && '📑 Cơ bản'}
                            {tab === 'media' && '🎬 Học liệu'}
                            {tab === 'questions' && '❓ Câu hỏi'}
                            {tab === 'settings' && '⚙️ Quy tắc'}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'general' && (
                        <motion.div
                            key="general"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="td-cm-content-card"
                        >
                            <div className="td-cm-section-label">
                                <span className="td-cm-section-icon">📑</span>
                                <h2>Thông tin nền tảng</h2>
                            </div>
                            <div className="fields-grid-premium">
                                <div className="field-group-premium" style={{ gridColumn: 'span 2' }}>
                                    <label>Tiêu đề bài tập</label>
                                    <input
                                        type="text"
                                        className="input-premium"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="VD: Kiểm tra từ vựng N5 - Bài 1"
                                    />
                                </div>
                                <div className="field-group-premium">
                                    <label>Danh mục bài tập</label>
                                    <select className="select-premium" value={category} onChange={e => setCategory(e.target.value)}>
                                        <option value="exercise">Bài tập luyện tập</option>
                                        <option value="quiz">Trắc nghiệm nhanh</option>
                                        <option value="exam">Bài thi định kỳ</option>
                                        <option value="homework">Bài tập về nhà</option>
                                    </select>
                                </div>
                                <div className="field-group-premium">
                                    <label>Lĩnh vực kiến thức</label>
                                    <select className="select-premium" value={assignmentType} onChange={e => setAssignmentType(e.target.value as any)}>
                                        <option value="vocabulary">Từ vựng (Vocabulary)</option>
                                        <option value="grammar">Ngữ pháp (Grammar)</option>
                                        <option value="kanji">Hán tự (Kanji)</option>
                                        <option value="listening">Nghe hiểu (Listening)</option>
                                        <option value="reading">Đọc hiểu (Reading)</option>
                                        <option value="mixed">Tổng hợp (General)</option>
                                    </select>
                                </div>
                                <div className="field-group-premium">
                                    <label>Hệ ngôn ngữ</label>
                                    <select className="select-premium" value={language} onChange={e => setLanguage(e.target.value as any)}>
                                        <option value="japanese">Tiếng Nhật (JLPT System)</option>
                                        <option value="chinese">Tiếng Trung (HSK System)</option>
                                    </select>
                                </div>
                                <div className="field-group-premium">
                                    <label>Độ khó & Trình độ</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            className="input-premium"
                                            style={{ width: '100px' }}
                                            value={level}
                                            onChange={e => setLevel(e.target.value)}
                                            placeholder="N5"
                                        />
                                        <select className="select-premium flex-1" value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>
                                            <option value="easy">Cơ bản (Easy)</option>
                                            <option value="medium">Trung bình (Medium)</option>
                                            <option value="hard">Nâng cao (Hard)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="field-group-premium">
                                    <label>Gắn vào Lớp học (Tùy chọn)</label>
                                    <select className="select-premium" value={classId || ''} onChange={e => setClassId(e.target.value || null)}>
                                        <option value="">-- Không chọn lớp --</option>
                                        {classList.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="field-group-premium">
                                    <label>Gắn vào Bài học (Tùy chọn)</label>
                                    <select className="select-premium" value={lessonId || ''} onChange={e => setLessonId(e.target.value || null)}>
                                        <option value="">-- Không chọn bài học --</option>
                                        {lessonList.map(lesson => (
                                            <option key={lesson.id} value={lesson.id}>L{lesson.lesson_number}: {lesson.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="field-group-premium mt-10">
                                <label>Mô tả tổng quan cho học sinh</label>
                                <textarea
                                    className="textarea-premium"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Nêu rõ mục tiêu của bài tập và những gì học sinh cần chuẩn bị..."
                                />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'media' && (
                        <motion.div
                            key="media"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="td-cm-content-card"
                        >
                            <div className="td-cm-section-label">
                                <span className="td-cm-section-icon">🎬</span>
                                <h2>Học liệu đính kèm</h2>
                            </div>
                            <div className="field-group-premium mb-10">
                                <label>Hướng dẫn chi tiết (Yêu cầu làm bài)</label>
                                <textarea
                                    className="textarea-premium"
                                    value={instructions}
                                    onChange={e => setInstructions(e.target.value)}
                                    rows={5}
                                    placeholder="Nhập đoạn văn bản mẫu, quy tắc làm bài, hoặc lời nhắn nhủ..."
                                />
                            </div>

                            <div className="fields-grid-premium">
                                <div className="field-group-premium">
                                    <label>Audio Bài học (MP3/WAV)</label>
                                    {!audioUrl ? (
                                        <div className="media-zone-premium" onClick={() => audioInputRef.current?.click()}>
                                            <span style={{ fontSize: '3rem' }}>🎵</span>
                                            <p className="font-bold underline">Click để tải audio lên</p>
                                            <span className="text-xs opacity-60">Dung lượng tối đa 20MB</span>
                                            <input type="file" ref={audioInputRef} hidden accept="audio/*" onChange={e => handleFileUpload(e, 'assignment')} />
                                        </div>
                                    ) : (
                                        <div className="td-form-input" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>🎵</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t-text-muted)' }}>Audio File</div>
                                                <button onClick={() => removeAssignmentMedia('audio')} style={{ fontSize: '0.75rem', color: 'var(--t-red)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Xóa tệp này</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="field-group-premium">
                                    <label>Video Minh họa (Youtube/Upload)</label>
                                    <input
                                        type="text"
                                        className="input-premium mb-4"
                                        value={videoUrl || ''}
                                        onChange={e => setVideoUrl(e.target.value)}
                                        placeholder="Dán link Youtube tại đây..."
                                    />
                                    {!videoUrl ? (
                                        <div className="media-zone-premium" style={{ padding: '2rem' }} onClick={() => videoInputRef.current?.click()}>
                                            <span>📹</span> Tải video trực tiếp (Max 20MB)
                                            <input type="file" ref={videoInputRef} hidden accept="video/*" onChange={e => handleFileUpload(e, 'assignment')} />
                                        </div>
                                    ) : !videoUrl.includes('youtube') && (
                                        <div className="td-form-input" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>📹</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t-text-muted)' }}>Video Direct Link</div>
                                                <button onClick={() => removeAssignmentMedia('video')} style={{ fontSize: '0.75rem', color: 'var(--t-red)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Gỡ bỏ video</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="field-group-premium mt-12">
                                <label>Bộ sưu tập hình ảnh (Gallery View)</label>
                                <div className="media-gallery-premium">
                                    <div className="media-zone-premium" style={{ height: '150px', padding: '1rem' }} onClick={() => imageInputRef.current?.click()}>
                                        <span style={{ fontSize: '2rem' }}>➕</span>
                                        <input type="file" ref={imageInputRef} hidden accept="image/*" onChange={e => handleFileUpload(e, 'assignment')} />
                                    </div>
                                    {attachmentUrls.map((url, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="media-item-premium"
                                        >
                                            <img src={url} alt="Ref" />
                                            <button className="delete-media-btn" onClick={() => removeAssignmentMedia('image', i)}>&times;</button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'questions' && (
                        <motion.div
                            key="questions"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="td-cm-content-card"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div className="td-cm-section-label" style={{ marginBottom: 0 }}>
                                    <span className="td-cm-section-icon">❓</span>
                                    <h2>Cấu trúc câu hỏi ({questions.length})</h2>
                                </div>
                                <button onClick={addQuestion} className="td-btn td-btn-primary" style={{ height: '38px', padding: '0 1rem', fontSize: '0.8rem' }}>
                                    + Thêm câu hỏi mới
                                </button>
                            </div>

                            <div className="space-y-4">
                                {questions.map((q, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="question-item-premium"
                                    >
                                        <div className="question-top-bar">
                                            <div className="flex items-center gap-5">
                                                <span className="q-number-premium">{q.question_number}</span>
                                                <select
                                                    className="select-premium py-2"
                                                    style={{ width: '220px' }}
                                                    value={q.question_type}
                                                    onChange={e => updateQuestion(idx, { question_type: e.target.value as any })}
                                                >
                                                    <option value="multiple_choice">Trắc nghiệm MC</option>
                                                    <option value="short_answer">Trả lời ngắn</option>
                                                    <option value="essay">Tự luận / Dịch thuật</option>
                                                    <option value="audio_response">Giao tiếp / Ghi âm</option>
                                                </select>
                                            </div>
                                            <button
                                                className="td-btn td-btn-danger"
                                                style={{ padding: '0.4rem 1rem', width: 'auto', fontSize: '0.8rem' }}
                                                onClick={() => removeQuestion(idx)}
                                            >
                                                🗑️ Gỡ bỏ
                                            </button>
                                        </div>

                                        <div className="field-group-premium mb-8">
                                            <label>Yêu cầu câu hỏi</label>
                                            <textarea
                                                className="textarea-premium"
                                                value={q.question_text}
                                                onChange={e => updateQuestion(idx, { question_text: e.target.value })}
                                                rows={2}
                                                placeholder="VD: Chọn đáp án đúng nhất hoặc dịch câu sau..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                            <div className="field-group-premium">
                                                <label>Hình ảnh minh họa</label>
                                                <div className="flex gap-4 overflow-x-auto py-2">
                                                    <div className="media-zone-premium" style={{ width: '100px', height: '100px', padding: 0 }} onClick={() => qImageRefs.current[idx]?.click()}>
                                                        🖼️
                                                        <input type="file" ref={el => qImageRefs.current[idx] = el} hidden accept="image/*" onChange={e => handleFileUpload(e, 'question', idx)} />
                                                    </div>
                                                    {q.attachment_urls.map((url, iIdx) => (
                                                        <div key={iIdx} className="media-item-premium" style={{ width: '100px', height: '100px' }}>
                                                            <img src={url} alt="Q" />
                                                            <button className="delete-media-btn" onClick={() => removeQuestionMedia(idx, 'image', iIdx)} style={{ width: '24px', height: '24px', fontSize: '1rem' }}>&times;</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="field-group-premium">
                                                <label>Audio câu hỏi</label>
                                                {!q.audio_url ? (
                                                    <div className="media-zone-premium" style={{ height: '100px', padding: 0 }} onClick={() => qAudioRefs.current[idx]?.click()}>
                                                        🎵 Tải lên âm thanh câu hỏi
                                                        <input type="file" ref={el => qAudioRefs.current[idx] = el} hidden accept="audio/*" onChange={e => handleFileUpload(e, 'question', idx)} />
                                                    </div>
                                                ) : (
                                                    <div className="td-form-input" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem', margin: 0 }}>
                                                        <span style={{ fontSize: '1.25rem' }}>🎵</span>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--t-text-muted)' }}>Ready</div>
                                                            <button onClick={() => removeQuestionMedia(idx, 'audio')} style={{ fontSize: '0.7rem', color: 'var(--t-red)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Gỡ</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {q.question_type === 'multiple_choice' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className="field-group-premium">
                                                        <label className="text-[10px]">Tùy chọn {oIdx + 1}</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                className="input-premium py-2 text-sm"
                                                                value={opt}
                                                                onChange={e => {
                                                                    const newOpts = [...q.options];
                                                                    newOpts[oIdx] = e.target.value;
                                                                    updateQuestion(idx, { options: newOpts });
                                                                }}
                                                                placeholder={`Phương án ${oIdx + 1}`}
                                                            />
                                                            <button
                                                                className={`td-btn ${q.correct_answer === opt ? 'td-btn-primary' : 'td-btn-secondary'}`}
                                                                style={{ padding: '0 1rem', width: 'auto', fontSize: '0.75rem', height: '38px' }}
                                                                onClick={() => updateQuestion(idx, { correct_answer: opt })}
                                                            >
                                                                {q.correct_answer === opt ? '✓' : 'O'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="field-group-premium">
                                                <label className="text-[10px]">Gợi ý (Hint)</label>
                                                <input type="text" className="input-premium py-2 text-sm" value={q.hint || ''} onChange={e => updateQuestion(idx, { hint: e.target.value })} />
                                            </div>
                                            <div className="field-group-premium">
                                                <label className="text-[10px]">Điểm</label>
                                                <input type="number" className="input-premium py-2 text-sm" value={q.points} onChange={e => updateQuestion(idx, { points: Number(e.target.value) })} />
                                            </div>
                                            <div className="field-group-premium flex flex-row items-center gap-3 pt-6">
                                                <input type="checkbox" className="w-5 h-5" style={{ accentColor: 'var(--t-primary)' }} checked={q.requires_file_upload} onChange={e => updateQuestion(idx, { requires_file_upload: e.target.checked })} />
                                                <label className="mb-0 text-[10px]">Cần nộp tệp?</label>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="td-cm-content-card"
                        >
                            <div className="td-cm-section-label">
                                <span className="td-cm-section-icon">⚙️</span>
                                <h2>Cấu hình & Quy tắc công khai</h2>
                            </div>
                            <div className="fields-grid-premium">
                                <div className="field-group-premium">
                                    <label>Hạn chót hoàn thành</label>
                                    <input type="date" className="input-premium" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                </div>
                                <div className="field-group-premium">
                                    <label>Giới hạn thời gian (Phút)</label>
                                    <input type="number" className="input-premium" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} />
                                    <span className="text-xs opacity-50">Để 0 nếu không muốn giới hạn</span>
                                </div>
                                <div className="field-group-premium">
                                    <label>Tổng điểm tối đa</label>
                                    <input type="number" className="input-premium" value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} />
                                </div>
                                <div className="field-group-premium">
                                    <label>Điểm vượt qua (Passing)</label>
                                    <input type="number" className="input-premium" value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="settings-toggle-section mt-8">
                                <div className="settings-toggle-item">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5"
                                        style={{ accentColor: 'var(--t-primary)' }}
                                        checked={isPublished}
                                        onChange={e => setIsPublished(e.target.checked)}
                                    />
                                    <div>
                                        <p className="font-bold">Công khai ngay lập tức</p>
                                        <p className="text-xs opacity-60">Học sinh sẽ thấy bài tập này trong danh sách</p>
                                    </div>
                                </div>
                                <div className="settings-toggle-item">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5"
                                        style={{ accentColor: 'var(--t-primary)' }}
                                        checked={allowFileUpload}
                                        onChange={e => setAllowFileUpload(e.target.checked)}
                                    />
                                    <div>
                                        <p className="font-bold">Cho phép gửi tệp đính kèm</p>
                                        <p className="text-xs opacity-60">Học sinh có thể tải lên tệp zip/pdf bổ sung</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Action Bar */}
            <div className="gd-action-bar">
                <div className="hidden-mobile" style={{ textAlign: 'left' }}>
                    <p className="font-bold" style={{ fontSize: '0.875rem', color: 'var(--t-text)' }}>Xác nhận thiết lập Curriculum</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--t-text-muted)', margin: 0 }}>Mọi thay đổi sẽ ảnh hưởng đến tất cả học sinh đang theo học</p>
                </div>
                <button
                    className="gd-btn gd-btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? '📦 Đang đồng bộ hóa...' : assignmentId ? 'Cập nhật giáo trình' : '🚀 Phát hành bài tập'}
                </button>
            </div>
        </div>
    );
};

export default AssignmentForm;
