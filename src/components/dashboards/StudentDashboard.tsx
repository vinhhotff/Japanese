import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getStudentClasses, joinClass, leaveClass, hasJoinedAnyClass } from '../../services/classService';
import { getStudentHomework } from '../../services/homeworkService';
import Pagination from '../common/Pagination';
import '../../styles/dashboard-modern.css';

const StudentDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
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
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-title">
            <h1>Dashboard Học Sinh</h1>
            <span className="role-badge student">Student</span>
          </div>
          <div className="dashboard-actions">
            <button onClick={() => setShowJoinModal(true)} className="dashboard-btn dashboard-btn-primary">
              ➕ Tham gia lớp
            </button>
            <button onClick={signOut} className="dashboard-btn dashboard-btn-secondary">
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Warning if no class */}
      {!hasClass && (
        <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #f59e0b' }}>
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon" style={{ background: '#f59e0b' }}>
              ⚠️
            </div>
            <div className="dashboard-card-title">
              <h3>Chưa tham gia lớp nào</h3>
              <p>Bạn cần tham gia ít nhất 1 lớp để sử dụng tính năng AI</p>
            </div>
          </div>
          <button onClick={() => setShowJoinModal(true)} className="dashboard-btn dashboard-btn-primary" style={{ width: '100%' }}>
            Tham gia lớp ngay
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon">
              📚
            </div>
            <div className="dashboard-card-title">
              <h3>Lớp học của tôi</h3>
              <p>{classes.length} lớp</p>
            </div>
          </div>
          <div className="dashboard-card-content">
            {classes.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-state-icon">📚</div>
                <h3>Chưa có lớp nào</h3>
                <p>Nhập mã lớp để tham gia</p>
              </div>
            ) : (
              <>
                <ul className="dashboard-list">
                  {classes.slice((classesPage - 1) * itemsPerPage, classesPage * itemsPerPage).map((enrollment: any) => (
                    <li key={enrollment.id} className="dashboard-list-item">
                      <div className="dashboard-list-item-content">
                        <div className="dashboard-list-item-title">
                          {enrollment.classes.name}
                        </div>
                        <div className="dashboard-list-item-subtitle">
                          Mã: {enrollment.classes.code} • {enrollment.classes.level}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLeaveClass(enrollment.class_id)}
                        className="dashboard-list-item-action danger"
                      >
                        Rời lớp
                      </button>
                    </li>
                  ))}
                </ul>
                <Pagination
                  currentPage={classesPage}
                  totalPages={Math.ceil(classes.length / itemsPerPage)}
                  onPageChange={setClassesPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={classes.length}
                />
              </>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              📝
            </div>
            <div className="dashboard-card-title">
              <h3>Bài tập</h3>
              <p>{homework.length} bài tập</p>
            </div>
          </div>
          <div className="dashboard-card-content">
            {homework.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-state-icon">📝</div>
                <h3>Chưa có bài tập</h3>
                <p>Giáo viên chưa giao bài tập nào</p>
              </div>
            ) : (
              <>
                <ul className="dashboard-list">
                  {homework.slice((homeworkPage - 1) * itemsPerPage, homeworkPage * itemsPerPage).map((hw: any) => (
                    <li key={hw.id} className="dashboard-list-item">
                      <div className="dashboard-list-item-content">
                        <div className="dashboard-list-item-title">{hw.title}</div>
                        <div className="dashboard-list-item-subtitle">
                          {hw.classes?.name} • Hạn: {new Date(hw.due_date).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <Link
                        to={`/homework/${hw.id}`}
                        className="dashboard-list-item-action primary"
                      >
                        Xem
                      </Link>
                    </li>
                  ))}
                </ul>
                <Pagination
                  currentPage={homeworkPage}
                  totalPages={Math.ceil(homework.length / itemsPerPage)}
                  onPageChange={setHomeworkPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={homework.length}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Features Section */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">

          <div className="dashboard-card-title">
            <h3>Tính năng AI</h3>
            <p>Học tập thông minh với AI</p>
          </div>
        </div>
        <div className="dashboard-card-content">
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Link
              to={hasClass ? "/ai-roleplay" : "#"}
              className={`dashboard-btn dashboard-btn-primary ${!hasClass ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ width: '100%', justifyContent: 'center', pointerEvents: hasClass ? 'auto' : 'none' }}
              onClick={(e) => !hasClass && e.preventDefault()}
            >
              🎭 Nhập vai cùng AI
            </Link>
          </div>
          {!hasClass && (
            <p style={{ marginTop: '1rem', color: '#f59e0b', textAlign: 'center', fontSize: '0.875rem' }}>
              ⚠️ Bạn cần tham gia ít nhất 1 lớp để sử dụng tính năng AI
            </p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div className="dashboard-card-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            🔗
          </div>
          <div className="dashboard-card-title">
            <h3>Liên kết nhanh</h3>
            <p>Truy cập các tính năng học tập</p>
          </div>
        </div>
        <div className="dashboard-card-content">
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <Link to="/japanese/courses" className="dashboard-btn dashboard-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              📚 Khóa học
            </Link>
            <Link to="/japanese/dictionary" className="dashboard-btn dashboard-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              📖 Từ điển
            </Link>
            <Link to="/japanese/saved-words" className="dashboard-btn dashboard-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              ⭐ Từ đã lưu
            </Link>
            <Link to="/study-progress" className="dashboard-btn dashboard-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Tiến độ
            </Link>
          </div>
        </div>
      </div>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="dashboard-modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h2>Tham gia lớp học</h2>
              <p>Nhập mã lớp do giáo viên cung cấp</p>
            </div>

            {error && (
              <div style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div className="dashboard-form-group">
              <label>Mã lớp</label>
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="Ví dụ: JA-N5-123456"
                autoFocus
              />
            </div>

            <div className="dashboard-modal-actions">
              <button
                onClick={() => setShowJoinModal(false)}
                className="dashboard-btn dashboard-btn-secondary"
              >
                Hủy
              </button>
              <button
                onClick={handleJoinClass}
                className="dashboard-btn dashboard-btn-primary"
                disabled={!classCode.trim()}
              >
                Tham gia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
