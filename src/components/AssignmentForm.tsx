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
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/assignment-form.css';

interface Question {
    id?: string;
    question_number: number;
    question_text: string;
    question_type: QuestionType;
    options: string[];
    correct_answer: string;
    points: number;
    attachment_urls: string[];
    audio_url: string | null;
    video_url: string | null;
    requires_file_upload: boolean;
    allowed_file_types: string[];
}

const AssignmentForm: React.FC = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [assignmentType, setAssignmentType] = useState<AssignmentType>('vocabulary');
    const [dueDate, setDueDate] = useState('');
    const [maxScore, setMaxScore] = useState(100);
    const [language, setLanguage] = useState<'japanese' | 'chinese'>('japanese');
    const [level, setLevel] = useState('N5');

    // Media settings
    const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [allowFileUpload, setAllowFileUpload] = useState(false);

    // Questions
    const [questions, setQuestions] = useState<Question[]>([]);

    useEffect(() => {
        if (assignmentId) {
            loadAssignment();
        } else {
            // Add first question if creating new
            addQuestion();
        }
    }, [assignmentId]);

    const loadAssignment = async () => {
        try {
            setLoading(true);
            const data = await getAssignmentById(assignmentId!);
            setTitle(data.title);
            setDescription(data.description || '');
            setInstructions(data.instructions || '');
            setAssignmentType(data.assignment_type);
            setDueDate(data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : '');
            setMaxScore(data.max_score);
            setLanguage(data.language);
            setAttachmentUrls(data.attachment_urls || []);
            setAudioUrl(data.audio_url);
            setVideoUrl(data.video_url);
            setAllowFileUpload(data.allow_file_upload);
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
            question_type: 'short_answer',
            options: [],
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
        const newQuestions = questions.filter((_, i) => i !== index);
        // Rebuild numbers
        setQuestions(newQuestions.map((q, i) => ({ ...q, question_number: i + 1 })));
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
        if (!title.trim() || !instructions.trim()) {
            showToast('Vui lòng điền đủ tiêu đề và hướng dẫn', 'warning');
            return;
        }

        try {
            setSaving(true);
            const data = {
                title,
                description,
                instructions,
                assignment_type: assignmentType,
                due_date: dueDate || null,
                max_score: maxScore,
                language,
                level,
                attachment_urls: attachmentUrls,
                audio_url: audioUrl,
                video_url: videoUrl,
                allow_file_upload: allowFileUpload,
                questions: questions,
                is_published: true
            };

            if (assignmentId) {
                await updateAssignment(assignmentId, data);
                showToast('Đã cập nhật bài tập', 'success');
            } else {
                await createAssignment(data as any);
                showToast('Đã tạo bài tập mới', 'success');
            }
            navigate(-1);
        } catch (error: any) {
            showToast('Lỗi lưu bài tập: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;

    return (
        <div className="assignment-form-container">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black">{assignmentId ? 'Sửa bài tập' : 'Tạo bài tập mới'}</h1>
                <button onClick={() => navigate(-1)} className="btn btn-outline">Quay lại</button>
            </header>

            <div className="form-card">
                <div className="form-section">
                    <h2 className="section-title"><span>📝</span> Thông tin chung</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="label">Tiêu đề</label>
                            <input type="text" className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tiêu đề bài tập" />
                        </div>
                        <div className="form-group">
                            <label className="label">Ngôn ngữ & Cấp độ</label>
                            <div className="flex gap-2">
                                <select className="select flex-1" value={language} onChange={e => setLanguage(e.target.value as any)}>
                                    <option value="japanese">Tiếng Nhật</option>
                                    <option value="chinese">Tiếng Trung</option>
                                </select>
                                <input type="text" className="input w-24" value={level} onChange={e => setLevel(e.target.value)} placeholder="N5" />
                            </div>
                        </div>
                    </div>
                    <div className="form-group mt-4">
                        <label className="label">Mô tả ngắn</label>
                        <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Mô tả cho học sinh thấy ở danh sách" />
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="section-title"><span>📂</span> Media & Hướng dẫn</h2>
                    <div className="form-group mb-4">
                        <label className="label">Hướng dẫn làm bài</label>
                        <textarea className="textarea" value={instructions} onChange={e => setInstructions(e.target.value)} rows={4} placeholder="Ghi chi tiết các bước học sinh cần làm" />
                    </div>

                    <label className="label">File đính kèm (Ảnh, Audio, Video)</label>
                    <div className="media-upload-grid">
                        <div className="media-drop-zone" onClick={() => document.getElementById('assign-file')?.click()}>
                            <span>➕ Thêm File</span>
                            <input type="file" id="assign-file" hidden onChange={e => handleFileUpload(e, 'assignment')} />
                        </div>
                        {attachmentUrls.map((url, i) => (
                            <div key={i} className="media-preview-card">
                                <img src={url} className="media-preview-image" alt="Preview" />
                                <button className="delete-media-btn" onClick={() => setAttachmentUrls(attachmentUrls.filter((_, idx) => idx !== i))}>×</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="section-title"><span>❓</span> Danh sách câu hỏi</h2>
                    {questions.map((q, idx) => (
                        <div key={idx} className="question-builder-card">
                            <div className="question-header">
                                <span className="question-number">{q.question_number}</span>
                                <button className="text-red-500 font-bold" onClick={() => removeQuestion(idx)}>Xóa câu hỏi</button>
                            </div>
                            <div className="form-group mb-4">
                                <label className="label">Nội dung câu hỏi</label>
                                <textarea className="textarea" value={q.question_text} onChange={e => updateQuestion(idx, { question_text: e.target.value })} rows={2} />
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="label">Loại câu hỏi</label>
                                    <select className="select" value={q.question_type} onChange={e => updateQuestion(idx, { question_type: e.target.value as any })}>
                                        <option value="short_answer">Trả lời ngắn</option>
                                        <option value="essay">Tự luận/Dịch</option>
                                        <option value="multiple_choice">Trắc nghiệm</option>
                                        <option value="audio_response">Ghi âm</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Điểm số</label>
                                    <input type="number" className="input" value={q.points} onChange={e => updateQuestion(idx, { points: Number(e.target.value) })} />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={addQuestion} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl font-bold text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-all">
                        + Thêm câu hỏi mới
                    </button>
                </div>
            </div>

            <div className="action-bar">
                <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input type="checkbox" checked={allowFileUpload} onChange={e => setAllowFileUpload(e.target.checked)} />
                        Cho phép học sinh nộp file
                    </label>
                </div>
                <button
                    className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Đang lưu...' : assignmentId ? 'Cập nhật bài tập' : 'Lưu & Đăng bài'}
                </button>
            </div>
        </div>
    );
};

export default AssignmentForm;
