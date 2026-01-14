import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { getTeacherAssignments } from '../services/adminService';
import { getTeacherClasses, createClass as createClassService, getClassStudents } from '../services/classService';
import { createHomework } from '../services/homeworkService';
import '../styles/dashboard-v2.css';

const TeacherDashboard = () => {
    const { user, isTeacher } = useAuth();
    const { showToast } = useToast();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Class State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassLevel, setNewClassLevel] = useState('');
    const [newClassLang, setNewClassLang] = useState<'japanese' | 'chinese'>('japanese');

    // View Students State
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [selectedClassStudents, setSelectedClassStudents] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Assign Homework State
    const [showHomeworkModal, setShowHomeworkModal] = useState(false);
    const [selectedClassHomework, setSelectedClassHomework] = useState<any>(null);
    const [homeworkForm, setHomeworkForm] = useState({ title: '', description: '', due_date: '' });

    useEffect(() => {
        if (user?.email) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (!user?.email) return;

            // 1. Get assignments
            const myAssignments = await getTeacherAssignments(user.email);
            setAssignments(myAssignments);

            // 2. Get my created classes
            const myClasses = await getTeacherClasses(user.id);
            setClasses(myClasses);

            if (myAssignments.length > 0) {
                setNewClassLevel(myAssignments[0].level);
                setNewClassLang(myAssignments[0].language);
            }
        } catch (e) {
            console.error(e);
            showToast('Lỗi tải dữ liệu giáo viên', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async () => {
        if (!newClassName || !newClassLevel) {
            showToast('Vui lòng điền tên lớp và cấp độ', 'warning');
            return;
        }

        try {
            await createClassService({
                name: newClassName,
                level: newClassLevel,
                language: newClassLang,
                teacher_id: user!.id
            });
            showToast('Tạo lớp thành công!', 'success');
            setShowCreateModal(false);
            setNewClassName('');
            loadData();
        } catch (e) {
            showToast('Lỗi tạo lớp', 'error');
        }
    };

    const handleViewStudents = async (cls: any) => {
        setSelectedClassStudents(cls);
        setShowStudentsModal(true);
        setStudents([]);
        setLoadingStudents(true);
        try {
            const list = await getClassStudents(cls.id);
            setStudents(list);
        } catch (e) {
            showToast('Lỗi tải danh sách học sinh', 'error');
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleOpenHomework = (cls: any) => {
        setSelectedClassHomework(cls);
        setHomeworkForm({ title: '', description: '', due_date: '' });
        setShowHomeworkModal(true);
    };

    const handleSubmitHomework = async () => {
        if (!homeworkForm.title) return showToast('Vui lòng nhập tiêu đề', 'warning');
        try {
            await createHomework({
                class_id: selectedClassHomework.id,
                teacher_id: user!.id,
                title: homeworkForm.title,
                description: homeworkForm.description,
                due_date: homeworkForm.due_date ? new Date(homeworkForm.due_date).toISOString() : undefined,
            });
            showToast('Giao bài tập thành công!', 'success');
            setShowHomeworkModal(false);
        } catch (e) {
            console.error(e);
            showToast('Lỗi giao bài', 'error');
        }
    };

    if (!isTeacher) {
        return <div className="p-8 text-center">Bạn không có quyền truy cập trang này.</div>;
    }

    return (
        <div className="dashboard-v2-container" style={{ paddingTop: '80px', minHeight: '100vh', background: '#f8fafc' }}>
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold mb-6 text-slate-800">🎓 Trang Quản Lý Giáo Viên</h1>

                {/* Section 1: My Assignments */}
                <div className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-slate-100">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="text-2xl">📚</span> Các khóa học được phân công
                    </h2>
                    <p className="text-slate-500 mb-4">Bạn được phép tạo nội dung và mở lớp cho các cấp độ sau:</p>

                    <div className="flex flex-wrap gap-3">
                        {assignments.length === 0 ? (
                            <p className="text-red-500">Bạn chưa được phân công khóa học nào. Vui lòng liên hệ Admin.</p>
                        ) : (
                            assignments.map((a, idx) => (
                                <div key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-medium">
                                    {a.language === 'japanese' ? '🇯🇵' : '🇨🇳'} {a.level}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Section 2: My Classes */}
                <div className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="text-2xl">🏫</span> Lớp học của tôi
                        </h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-all shadow-md active:scale-95"
                        >
                            + Tạo lớp mới
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.length === 0 ? (
                            <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500">Chưa có lớp học nào. Hãy tạo lớp mới để học sinh tham gia.</p>
                            </div>
                        ) : (
                            classes.map(cls => (
                                <div key={cls.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-slate-800">{cls.name}</h3>
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">
                                            {cls.language === 'japanese' ? 'JP' : 'CN'} {cls.level}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm text-slate-500 mb-1">Mã tham gia:</p>
                                        <div className="bg-blue-50 text-blue-700 font-mono text-xl font-bold p-2 text-center rounded border border-blue-100 select-all">
                                            {cls.code}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleViewStudents(cls)}
                                            className="flex-1 py-2 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-600 font-medium"
                                        >
                                            Xem học sinh
                                        </button>
                                        <button
                                            onClick={() => handleOpenHomework(cls)}
                                            className="flex-1 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                                        >
                                            Giao bài tập
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Section 3: Content Management Shortcut */}
                {assignments.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-2xl">✏️</span> Quản lý nội dung
                        </h2>
                        <p className="text-slate-600 mb-4">
                            Bạn có thể chỉnh sửa nội dung bài học cho các cấp độ được phân công.
                            Sử dụng Admin Panel nhưng chỉ những phần được cấp quyền mới có thể lưu.
                        </p>
                        <a href="/admin" className="inline-block px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-bold">
                            Truy cập trình quản lý nội dung &rarr;
                        </a>
                    </div>
                )}

            </div>

            {/* Create Class Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4">Tạo lớp học mới</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên lớp</label>
                                <input
                                    type="text"
                                    value={newClassName}
                                    onChange={e => setNewClassName(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: Lớp N5 Sáng 2-4-6"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cấp độ & Ngôn ngữ</label>
                                <select
                                    value={newClassLevel}
                                    onChange={e => {
                                        setNewClassLevel(e.target.value);
                                        if (e.target.value.startsWith('N')) setNewClassLang('japanese');
                                        if (e.target.value.startsWith('HSK')) setNewClassLang('chinese');
                                    }}
                                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                                >
                                    {assignments.map(a => (
                                        <option key={a.level} value={a.level}>
                                            {a.language === 'japanese' ? '🇯🇵' : '🇨🇳'} {a.level}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium">Hủy</button>
                            <button onClick={handleCreateClass} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Tạo lớp</button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Students Modal */}
            {showStudentsModal && selectedClassStudents && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Danh sách học sinh - {selectedClassStudents.name}</h3>
                            <button onClick={() => setShowStudentsModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {loadingStudents ? (
                                <p className="text-center text-slate-500 py-4">Đang tải...</p>
                            ) : students.length === 0 ? (
                                <p className="text-center text-slate-500 py-8 bg-slate-50 rounded-lg border border-dashed">Chưa có học sinh nào tham gia.</p>
                            ) : (
                                <div className="space-y-3">
                                    {students.map((stu, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                {(stu.full_name || stu.email || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{stu.full_name || 'Chưa cập nhật tên'}</p>
                                                <p className="text-sm text-slate-500">{stu.email}</p>
                                            </div>
                                            <div className="ml-auto text-xs text-slate-400">
                                                {new Date(stu.joined_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 text-right">
                            <button onClick={() => setShowStudentsModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium">Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Homework Modal */}
            {showHomeworkModal && selectedClassHomework && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4">Giao bài tập mới - {selectedClassHomework.name}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề bài tập *</label>
                                <input
                                    type="text"
                                    value={homeworkForm.title}
                                    onChange={e => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: Bài tập về nhà tuần 1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả / Nội dung</label>
                                <textarea
                                    value={homeworkForm.description}
                                    onChange={e => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32"
                                    placeholder="Chi tiết bài tập..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hạn nộp</label>
                                <input
                                    type="datetime-local"
                                    value={homeworkForm.due_date}
                                    onChange={e => setHomeworkForm({ ...homeworkForm, due_date: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowHomeworkModal(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium">Hủy</button>
                            <button onClick={handleSubmitHomework} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Giao bài</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
