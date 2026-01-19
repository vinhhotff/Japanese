import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminClasses, deleteClass } from '../services/classService';
import { useToast } from './Toast';

const AllClasses = () => {
    const [classes, setClasses] = useState<any[]>([]);
    const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            setFilteredClasses(classes.filter(c =>
                c.name.toLowerCase().includes(lower) ||
                c.code.toLowerCase().includes(lower) ||
                (c.teacher?.full_name || '').toLowerCase().includes(lower) ||
                (c.teacher?.email || '').toLowerCase().includes(lower)
            ));
        } else {
            setFilteredClasses(classes);
        }
    }, [searchTerm, classes]);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const data = await getAdminClasses();
            setClasses(data);
            setFilteredClasses(data);
        } catch (e: any) {
            showToast('Lỗi tải danh sách lớp', 'error');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (classId: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa lớp này? Tất cả dữ liệu đăng ký sẽ bị mất.')) return;

        setDeletingId(classId);
        try {
            await deleteClass(classId);
            showToast('Đã xóa lớp học', 'success');
            loadClasses(); // Reload
        } catch (e: any) {
            showToast('Lỗi khi xóa lớp: ' + e.message, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="admin-container">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                        Quản lý Lớp học (Active Classes)
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Danh sách tất cả các lớp học đang hoạt động trên hệ thống
                    </p>
                </div>

                <div className="w-64">
                    <input
                        type="text"
                        placeholder="Tìm kiến tên, mã lớp, giáo viên..."
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredClasses.length === 0 ? (
                            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                                <div className="text-4xl mb-4">🏫</div>
                                <p className="text-slate-500 font-medium">Không tìm thấy lớp học nào</p>
                            </div>
                        ) : (
                            filteredClasses.map(cls => (
                                <motion.div
                                    key={cls.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group relative"
                                >
                                    {/* Header Gradient Stripe */}
                                    <div className={`h-2 w-full ${cls.language === 'japanese' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 'bg-gradient-to-r from-red-400 to-orange-500'}`}></div>

                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${cls.language === 'japanese' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                                {cls.language} • {cls.level}
                                            </span>
                                            <div className="flex bg-slate-100 rounded-lg px-2 py-1 items-center gap-1">
                                                <span className="text-xs font-bold text-slate-600">CODE:</span>
                                                <span className="text-xs font-mono text-slate-800">{cls.code}</span>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-red-500 transition-colors">
                                            {cls.name}
                                        </h3>

                                        <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                                            <span>👨‍🏫 {cls.teacher?.full_name || cls.teacher?.email || 'Unknown'}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="text-sm font-medium text-slate-600">
                                                👥 {cls.student_count || 0} học viên
                                            </div>

                                            <button
                                                onClick={() => handleDelete(cls.id)}
                                                disabled={deletingId === cls.id}
                                                className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Xóa lớp học"
                                            >
                                                {deletingId === cls.id ? '⏳' : '🗑️'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default AllClasses;
