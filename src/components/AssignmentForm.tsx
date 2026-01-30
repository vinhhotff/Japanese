import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    createAssignment,
    updateAssignment,
    getAssignmentById,
    AssignmentType,
    QuestionType
} from '../services/assignmentService';
import { uploadFile, getFileType, validateFileSize } from '../utils/fileUpload';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext'; // Added
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/assignment-form.css';

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
    const { user } = useAuth(); // Added
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

    // Questions
    const [questions, setQuestions] = useState<Question[]>([]);

    useEffect(() => {
        if (assignmentId) {
            loadAssignment();
        } else {
            addQuestion();
        }
    }, [assignmentId]);

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
            const bucket = fileType === 'image' ? 'images' : fileType === 'audio' ? 'audio-files' : 'documents';
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
                created_by: user?.id // Added
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

    if (loading) return <div className="p-8 text-center text-2xl font-bold">Đang tải cấu trúc bài tập...</div>;

    return (
        <div className="assignment-form-container">
            <header className="form-header-premium">
                <div>
                    <h1 className="text-4xl font-black">{assignmentId ? 'Hiệu chỉnh bài tập' : 'Thiết kế bài tập mới'}</h1>
                    <p className="text-slate-500 font-bold mt-2">Cấu hình chi tiết học liệu và đánh giá</p>
                </div>
                <button onClick={() => navigate(-1)} className="back-link-small">Quay lại</button>
            </header>

            <nav className="form-tabs-nav">
                {(['general', 'media', 'questions', 'settings'] as FormTab[]).map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'general' && '📑 Cơ bản'}
                        {tab === 'media' && '🎬 Học liệu'}
                        {tab === 'questions' && '❓ Câu hỏi'}
                        {tab === 'settings' && '⚙️ Thiết lập'}
                    </button>
                ))}
            </nav>

            <motion.div
                layout
                className="form-card-premium"
            >
                <AnimatePresence mode="wait">
                    {activeTab === 'general' && (
                        <motion.div
                            key="general"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="form-section-premium"
                        >
                            <div className="section-label">
                                <span className="icon">📑</span>
                                <h2>Thông tin nền tảng</h2>
                            </div>
                            <div className="fields-grid-premium">
                                <div className="field-group-premium" style={{ gridColumn: 'span 2' }}>
                                    <label>Tiêu đề bài tập</label>
                                    <input type="text" className="input-premium" value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Kiểm tra từ vựng N5 - Bài 1" />
                                </div>
                                <div className="field-group-premium">
                                    <label>Danh mục</label>
                                    <select className="select-premium" value={category} onChange={e => setCategory(e.target.value)}>
                                        <option value="exercise">Bài tập (Exercise)</option>
                                        <option value="quiz">Trắc nghiệm (Quiz)</option>
                                        <option value="exam">Kiểm tra (Exam)</option>
                                        <option value="homework">BTVN (Homework)</option>
                                    </select>
                                </div>
                                <div className="field-group-premium">
                                    <label>Loại nội dung</label>
                                    <select className="select-premium" value={assignmentType} onChange={e => setAssignmentType(e.target.value as any)}>
                                        <option value="vocabulary">Từ vựng</option>
                                        <option value="grammar">Ngữ pháp</option>
                                        <option value="kanji">Hán tự</option>
                                        <option value="listening">Nghe hiểu</option>
                                        <option value="reading">Đọc hiểu</option>
                                        <option value="mixed">Tổng hợp</option>
                                    </select>
                                </div>
                                <div className="field-group-premium">
                                    <label>Ngôn ngữ</label>
                                    <select className="select-premium" value={language} onChange={e => setLanguage(e.target.value as any)}>
                                        <option value="japanese">Tiếng Nhật (JLPT)</option>
                                        <option value="chinese">Tiếng Trung (HSK)</option>
                                    </select>
                                </div>
                                <div className="field-group-premium">
                                    <label>Cấp độ & Độ khó</label>
                                    <div className="flex gap-2">
                                        <input type="text" className="input-premium w-24" value={level} onChange={e => setLevel(e.target.value)} placeholder="N5" />
                                        <select className="select-premium flex-1" value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>
                                            <option value="easy">Dễ</option>
                                            <option value="medium">Trung bình</option>
                                            <option value="hard">Khó</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="field-group-premium mt-8">
                                <label>Mô tả tổng quan</label>
                                <textarea className="textarea-premium" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Mô tả mục tiêu của bài tập này..." />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'media' && (
                        <motion.div
                            key="media"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="form-section-premium"
                        >
                            <div className="section-label">
                                <span className="icon">🎬</span>
                                <h2>Học liệu đính kèm</h2>
                            </div>
                            <div className="field-group-premium mb-8">
                                <label>Hướng dẫn chi tiết (Rich Content)</label>
                                <textarea className="textarea-premium" value={instructions} onChange={e => setInstructions(e.target.value)} rows={6} placeholder="Nhập hướng dẫn làm bài, các quy tắc hoặc đoạn văn bản mẫu..." />
                            </div>

                            <div className="fields-grid-premium">
                                <div className="field-group-premium">
                                    <label>Audio Hướng dẫn (MP3/WAV)</label>
                                    {!audioUrl ? (
                                        <div className="media-zone-premium" onClick={() => document.getElementById('audio-up')?.click()}>
                                            ➕ Tải Audio lên
                                            <input type="file" id="audio-up" hidden accept="audio/*" onChange={e => handleFileUpload(e, 'assignment')} />
                                        </div>
                                    ) : (
                                        <div className="media-pill-premium">
                                            <div className="info">🎵 Audio đã sẵn sàng</div>
                                            <span className="media-remove-link" onClick={() => removeAssignmentMedia('audio')}>Xóa</span>
                                        </div>
                                    )}
                                </div>
                                <div className="field-group-premium">
                                    <label>Video Minh họa (Link/File)</label>
                                    <input type="text" className="input-premium" value={videoUrl || ''} onChange={e => setVideoUrl(e.target.value)} placeholder="Link YouTube hoặc URL Video" />
                                </div>
                            </div>

                            <div className="field-group-premium mt-8">
                                <label>Hình ảnh tham chiếu (Gallery)</label>
                                <div className="media-zone-premium" onClick={() => document.getElementById('img-up')?.click()}>
                                    ➕ Thêm hình ảnh mới
                                    <input type="file" id="img-up" hidden accept="image/*" onChange={e => handleFileUpload(e, 'assignment')} />
                                </div>
                                <div className="media-gallery-premium">
                                    {attachmentUrls.map((url, i) => (
                                        <div key={i} className="media-item-premium">
                                            <img src={url} alt="Reference" />
                                            <button className="delete-media-btn" onClick={() => removeAssignmentMedia('image', i)}>×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'questions' && (
                        <motion.div
                            key="questions"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="form-section-premium"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div className="section-label mb-0">
                                    <span className="icon">❓</span>
                                    <h2>Cấu trúc câu hỏi</h2>
                                </div>
                                <button onClick={addQuestion} className="btn btn-primary">+ Thêm câu hỏi</button>
                            </div>

                            {questions.map((q, idx) => (
                                <div key={idx} className="question-item-premium">
                                    <div className="question-top-bar">
                                        <div className="flex items-center gap-4">
                                            <span className="q-number-premium">{q.question_number}</span>
                                            <select
                                                className="select-premium py-1"
                                                value={q.question_type}
                                                onChange={e => updateQuestion(idx, { question_type: e.target.value as any })}
                                            >
                                                <option value="multiple_choice">Trắc nghiệm</option>
                                                <option value="short_answer">Trả lời ngắn</option>
                                                <option value="essay">Tự luận/Dịch</option>
                                                <option value="audio_response">Ghi âm</option>
                                            </select>
                                        </div>
                                        <button
                                            className="delete-question-btn"
                                            onClick={() => removeQuestion(idx)}
                                            title="Xóa câu hỏi này"
                                        >
                                            🗑️ Xóa câu hỏi
                                        </button>
                                    </div>

                                    <div className="field-group-premium mb-6">
                                        <label>Nội dung câu hỏi</label>
                                        <textarea
                                            className="textarea-premium"
                                            value={q.question_text}
                                            onChange={e => updateQuestion(idx, { question_text: e.target.value })}
                                            rows={2}
                                            placeholder="Nhập nội dung câu hỏi hoặc yêu cầu..."
                                        />
                                    </div>

                                    {/* Question Media Gallery */}
                                    <div className="field-group-premium mb-8">
                                        <label>Học liệu cho câu hỏi (Hình ảnh / Audio)</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="media-zone-premium flex items-center justify-center p-4 min-h-[80px]" onClick={() => document.getElementById(`q-img-up-${idx}`)?.click()}>
                                                🖼️ Ảnh
                                                <input type="file" id={`q-img-up-${idx}`} hidden accept="image/*" onChange={e => handleFileUpload(e, 'question', idx)} />
                                            </div>
                                            <div className="media-zone-premium flex items-center justify-center p-4 min-h-[80px]" onClick={() => document.getElementById(`q-audio-up-${idx}`)?.click()}>
                                                🎵 Audio
                                                <input type="file" id={`q-audio-up-${idx}`} hidden accept="audio/*" onChange={e => handleFileUpload(e, 'question', idx)} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4 mt-4">
                                            {/* Question Video URL */}
                                            <div className="field-group-premium">
                                                <label className="text-[10px]">Video URL (YouTube/Link)</label>
                                                <input
                                                    type="text"
                                                    className="input-premium py-2 text-sm"
                                                    value={q.video_url || ''}
                                                    onChange={e => updateQuestion(idx, { video_url: e.target.value })}
                                                    placeholder="Nhập link video cho câu hỏi này..."
                                                />
                                            </div>

                                            {/* Audio Indicator */}
                                            {q.audio_url && (
                                                <div className="media-pill-premium">
                                                    <div className="info">🎵 Audio câu hỏi đã sẵn sàng</div>
                                                    <span className="media-remove-link" onClick={() => removeQuestionMedia(idx, 'audio')}>Xóa</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Image Gallery for Question */}
                                        {q.attachment_urls && q.attachment_urls.length > 0 && (
                                            <div className="media-gallery-premium mt-4">
                                                {q.attachment_urls.map((url, iIdx) => (
                                                    <div key={iIdx} className="media-item-premium">
                                                        <img src={url} alt={`Q ${idx + 1} reference`} />
                                                        <button className="delete-media-btn" onClick={() => removeQuestionMedia(idx, 'image', iIdx)}>×</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {q.question_type === 'multiple_choice' && (
                                        <div className="fields-grid-premium mb-8">
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="field-group-premium">
                                                    <label>Lựa chọn {oIdx + 1} {opt === q.correct_answer && '✅'}</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            className="input-premium flex-1"
                                                            value={opt}
                                                            onChange={e => {
                                                                const newOpts = [...q.options];
                                                                newOpts[oIdx] = e.target.value;
                                                                updateQuestion(idx, { options: newOpts });
                                                            }}
                                                            placeholder={`Đáp án ${oIdx + 1}`}
                                                        />
                                                        <button
                                                            className={`btn btn-sm ${q.correct_answer === opt ? 'btn-primary' : 'btn-outline'}`}
                                                            onClick={() => updateQuestion(idx, { correct_answer: opt })}
                                                            title="Đánh dấu là đáp án đúng"
                                                        >
                                                            {q.correct_answer === opt ? 'Đúng' : 'Chọn'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="fields-grid-premium">
                                        <div className="field-group-premium">
                                            <label>Gợi ý (Hint)</label>
                                            <input type="text" className="input-premium" value={q.hint || ''} onChange={e => updateQuestion(idx, { hint: e.target.value })} placeholder="VD: Hãy chú ý trợ từ..." />
                                        </div>
                                        <div className="field-group-premium">
                                            <label>Giải thích (Explanation)</label>
                                            <input type="text" className="input-premium" value={q.explanation || ''} onChange={e => updateQuestion(idx, { explanation: e.target.value })} placeholder="Giải thích đáp án cho học sinh..." />
                                        </div>
                                        <div className="field-group-premium">
                                            <label>Điểm số</label>
                                            <input type="number" className="input-premium" value={q.points} onChange={e => updateQuestion(idx, { points: Number(e.target.value) })} />
                                        </div>
                                        <div className="field-group-premium flex flex-row items-center gap-4 pt-10">
                                            <label className="mb-0">Cần nộp file?</label>
                                            <input type="checkbox" className="w-6 h-6 accent-slate-800" checked={q.requires_file_upload} onChange={e => updateQuestion(idx, { requires_file_upload: e.target.checked })} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="form-section-premium"
                        >
                            <div className="section-label">
                                <span className="icon">⚙️</span>
                                <h2>Cấu hình & Quy tắc</h2>
                            </div>
                            <div className="fields-grid-premium">
                                <div className="field-group-premium">
                                    <label>Hạn chót nộp bài</label>
                                    <input type="date" className="input-premium" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                </div>
                                <div className="field-group-premium">
                                    <label>Thời gian làm bài (Phút)</label>
                                    <input type="number" className="input-premium" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} />
                                    <span className="text-xs text-slate-400">0 = Không giới hạn thời gian</span>
                                </div>
                                <div className="field-group-premium">
                                    <label>Điểm tối đa</label>
                                    <input type="number" className="input-premium" value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} />
                                </div>
                                <div className="field-group-premium">
                                    <label>Điểm đạt (Passing)</label>
                                    <input type="number" className="input-premium" value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} />
                                </div>
                                <div className="field-group-premium">
                                    <label>Số lần thử tối đa</label>
                                    <input type="number" className="input-premium" value={allowedAttempts} onChange={e => setAllowedAttempts(Number(e.target.value))} />
                                </div>
                                <div className="field-group-premium flex flex-row items-center gap-4 pt-8">
                                    <label className="mb-0">Cho phép nộp file chung</label>
                                    <input type="checkbox" checked={allowFileUpload} onChange={e => setAllowFileUpload(e.target.checked)} />
                                </div>
                                <div className="field-group-premium flex flex-row items-center gap-4 pt-8">
                                    <label className="mb-0">Công khai bài tập</label>
                                    <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div className="action-bar-premium">
                <p className="text-slate-400 font-bold">Lưu ý: Mọi thay đổi sẽ được cập nhật ngay lập tức cho học sinh khi nhấn Lưu.</p>
                <button
                    className="save-btn-premium disabled:opacity-50"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? '📦 Đang xử lý...' : assignmentId ? 'Cập nhật thay đổi' : 'Tạo & Đăng bài tập'}
                </button>
            </div>
        </div>
    );
};

export default AssignmentForm;
