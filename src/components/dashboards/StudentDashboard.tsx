import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, Link as RouterLink } from 'react-router-dom';
import { getStudentClasses, joinClass, leaveClass, hasJoinedAnyClass } from '../../services/classService';
import { getStudentHomework } from '../../services/homeworkService';
import Pagination from '../common/Pagination';
import '../../styles/student-dashboard-premium.css';
import { motion, AnimatePresence } from 'framer-motion';

const StudentDashboard: React.FC = () => {
  const { user, signOut, profile } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [hasClass, setHasClass] = useState(false);
  const [error, setError] = useState('');
  const [classesPage, setClassesPage] = useState(1);
  const [homeworkPage, setHomeworkPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [classesData, homeworkData, hasClassData] = await Promise.all([
        getStudentClasses(user.id),
        getStudentHomework(user.id),
        hasJoinedAnyClass(user.id)
      ]);

      setClasses(classesData);
      setHomework(homeworkData);
      setHasClass(hasClassData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!user || !classCode.trim()) return;

    setError('');
    try {
      await joinClass(user.id, classCode.trim());
      setShowJoinModal(false);
      setClassCode('');
      loadData();
    } catch (error: any) {
      setError(error.message || 'Không thể tham gia lớp');
    }
  };

  const handleLeaveClass = async (classId: string) => {
    if (!user || !window.confirm('Bạn có chắc muốn rời khỏi lớp này?')) return;

    try {
      await leaveClass(user.id, classId);
      loadData();
    } catch (error) {
      console.error('Error leaving class:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-container">
      {/* Premium Header */}
      <div className="student-header">
        <div className="student-header-content">
          <div className="student-welcome">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-extrabold">👋 Xin chào, {profile?.full_name || user?.email}!</h1>
            </div>
            <p className="opacity-90">Hôm nay bạn muốn học gì nào?</p>
          </div>
          <div className="student-actions">
            <div className="student-badge">
              <span>🎓</span>
              <span>Student</span>
            </div>
            <button onClick={signOut} className="student-btn btn-glass">
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="student-grid mt-8">
        {/* Main Section: My Classes */}
        <div className="card-wide student-card">
          <div className="card-header">
            <div className="card-icon">📚</div>
            <div className="card-title">
              <h3>Lớp học của tôi</h3>
              <p>Các lớp bạn đang tham gia</p>
            </div>
            <button
              onClick={() => setShowJoinModal(true)}
              className="student-btn btn-white ml-auto text-sm"
              style={{ marginLeft: 'auto', padding: '0.5rem 1rem' }}
            >
              + Tham gia lớp mới
            </button>
          </div>

          <div className="class-list">
            {classes.length === 0 ? (
              <div className="text-center py-10 opacity-60">
                <div className="text-4xl mb-4">🏫</div>
                <p>Bạn chưa tham gia lớp học nào.</p>
                <button onClick={() => setShowJoinModal(true)} className="text-indigo-600 font-bold mt-2 hover:underline">Tham gia ngay</button>
              </div>
            ) : (
              <>
                {classes.slice((classesPage - 1) * itemsPerPage, classesPage * itemsPerPage).map((enrollment: any) => (
                  <div key={enrollment.id} className="class-item group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${enrollment.classes.language === 'japanese' ? 'bg-indigo-500' : 'bg-red-500'}`}>
                        {enrollment.classes.level}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {enrollment.classes.name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">CODE: {enrollment.classes.code}</span>
                          <span>•</span>
                          <span>{enrollment.classes.language === 'japanese' ? 'Tiếng Nhật' : 'Tiếng Trung'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLeaveClass(enrollment.class_id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm font-medium"
                      title="Rời lớp"
                    >
                      Rời lớp ✕
                    </button>
                  </div>
                ))}
                {classes.length > itemsPerPage && (
                  <Pagination
                    currentPage={classesPage}
                    totalPages={Math.ceil(classes.length / itemsPerPage)}
                    onPageChange={setClassesPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={classes.length}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Assignments Section */}
        <div className="card-narrow student-card">
          <div className="card-header">
            <div className="card-icon" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)', color: '#d97706' }}>📝</div>
            <div className="card-title">
              <h3>Bài tập cần làm</h3>
              <p>Đừng quên hạn nộp nhé!</p>
            </div>
          </div>

          <div className="assignment-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {homework.length === 0 ? (
              <div className="text-center py-8 opacity-60">
                <div className="text-4xl mb-2">🎉</div>
                <p>Xuất sắc! Không có bài tập nào cần làm.</p>
                <p className="text-xs mt-1">Hãy tham gia lớp học để nhận bài tập từ giáo viên.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {homework.slice((homeworkPage - 1) * itemsPerPage, homeworkPage * itemsPerPage).map((hw: any) => (
                  <li key={hw.id} className={`p-4 rounded-xl border transition-all hover:shadow-lg relative group ${hw.source === 'assignment' ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 line-clamp-1">{hw.title}</span>
                          {hw.source === 'assignment' && (
                            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">MEDIA</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{hw.classes?.name || 'Lớp học'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium mb-3">
                      <span className={hw.source === 'assignment' ? 'text-indigo-600' : 'text-amber-700'}>
                        📅 Hạn: {new Date(hw.due_date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <RouterLink
                      to={`/homework/${hw.id}`}
                      className={`block text-center w-full py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${hw.source === 'assignment'
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-white border border-amber-200 text-amber-600 hover:bg-amber-500 hover:text-white'
                        }`}
                    >
                      {hw.source === 'assignment' ? '🚀 Bắt đầu Media Assignment' : '📝 Làm bài tập ngay &rarr;'}
                    </RouterLink>
                  </li>
                ))}
              </ul>
            )}
            {homework.length > itemsPerPage && (
              <div className="mt-4">
                <Pagination
                  currentPage={homeworkPage}
                  totalPages={Math.ceil(homework.length / itemsPerPage)}
                  onPageChange={setHomeworkPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={homework.length}
                />
              </div>
            )}
          </div>
        </div>

        {/* AI Features */}
        <div className="card-full student-card ai-feature-card">
          <div className="ai-content">
            <h2 className="text-3xl font-bold mb-2">🚀 Luyện tập cùng AI</h2>
            <p className="mb-6 opacity-90">Sử dụng công nghệ AI tiên tiến để luyện giao tiếp và phát âm chuẩn bản xứ.</p>

            <div className="flex flex-wrap justify-center gap-4">
              <RouterLink
                to={hasClass ? "/ai-roleplay" : "#"}
                className={`student-btn btn-white ${!hasClass ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => !hasClass && e.preventDefault()}
              >
                <span className="text-2xl">🎭</span>
                <span className="text-left">
                  <div className="text-sm font-bold text-slate-800">Roleplay AI</div>
                  <div className="text-xs text-slate-500">Giả lập tình huống thực tế</div>
                </span>
              </RouterLink>

              <RouterLink
                to={hasClass ? "/voice-recorder" : "#"}
                className={`student-btn btn-white ${!hasClass ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => !hasClass && e.preventDefault()}
              >
                <span className="text-2xl">🎙️</span>
                <span className="text-left">
                  <div className="text-sm font-bold text-slate-800">Voice AI</div>
                  <div className="text-xs text-slate-500">Chấm điểm phát âm</div>
                </span>
              </RouterLink>
            </div>

            {!hasClass && (
              <div className="mt-4 inline-block bg-amber-500/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-amber-500/50 text-amber-200 text-sm font-medium">
                ⚠️ Bạn cần tham gia lớp học để mở khóa tính năng AI
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="card-full student-card">
          <h3 className="text-xl font-bold mb-4 text-slate-700">🔗 Truy cập nhanh</h3>
          <div className="quick-links-grid">
            <RouterLink to="/japanese/courses" className="quick-link-btn">
              <div className="text-2xl mb-2">📚</div>
              Nội dung khóa học
            </RouterLink>
            <RouterLink to="/japanese/dictionary" className="quick-link-btn">
              <div className="text-2xl mb-2">📖</div>
              Từ điển Online
            </RouterLink>
            <RouterLink to="/japanese/saved-words" className="quick-link-btn">
              <div className="text-2xl mb-2">⭐</div>
              Từ vựng đã lưu
            </RouterLink>
            <RouterLink to="/study-progress" className="quick-link-btn">
              <div className="text-2xl mb-2">📊</div>
              Tiến độ học tập
            </RouterLink>
          </div>
        </div>

      </div>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="dashboard-modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()} style={{ borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.2)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🏫</div>
              <h2 className="text-2xl font-bold text-slate-800">Tham gia lớp học mới</h2>
              <p className="text-slate-500">Nhập mã lớp code giáo viên cung cấp để bắt đầu.</p>
            </div>

            {error && (
              <div style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', marginBottom: '1rem', fontWeight: 600, textAlign: 'center' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="dashboard-form-group mb-6">
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="VD: JA-N5-123456"
                autoFocus
                className="w-full text-center text-2xl font-bold tracking-wider py-4 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none uppercase"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleJoinClass}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:scale-105"
                disabled={!classCode.trim()}
              >
                Xác nhận tham gia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
