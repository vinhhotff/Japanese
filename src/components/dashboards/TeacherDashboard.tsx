import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getTeacherClasses, createClass, deleteClass, getClassStudents } from '../../services/classService';
import { getTeacherHomework, createHomework, deleteHomework } from '../../services/homeworkService';
import Pagination from '../common/Pagination';
import '../../styles/dashboard-modern.css';

const TeacherDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateHomeworkModal, setShowCreateHomeworkModal] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    level: 'N5',
    language: 'japanese'
  });
  const [newHomework, setNewHomework] = useState({
    class_id: '',
    title: '',
    description: '',
    due_date: ''
  });
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
      const [classesData, homeworkData] = await Promise.all([
        getTeacherClasses(user.id),
        getTeacherHomework(user.id)
      ]);

      setClasses(classesData);
      setHomework(homeworkData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!user || !newClass.name.trim()) return;

    try {
      await createClass({
        ...newClass,
        teacher_id: user.id
      });
      setShowCreateClassModal(false);
      setNewClass({ name: '', level: 'N5', language: 'japanese' });
      loadData();
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa lớp này?')) return;

    try {
      await deleteClass(classId);
      loadData();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const handleCreateHomework = async () => {
    if (!user || !newHomework.title.trim() || !newHomework.class_id) return;

    try {
      await createHomework({
        ...newHomework,
        teacher_id: user.id
      });
      setShowCreateHomeworkModal(false);
      setNewHomework({ class_id: '', title: '', description: '', due_date: '' });
      loadData();
    } catch (error) {
      console.error('Error creating homework:', error);
    }
  };

  const handleDeleteHomework = async (homeworkId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài tập này?')) return;

    try {
      await deleteHomework(homeworkId);
      loadData();
    } catch (error) {
      console.error('Error deleting homework:', error);
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
            <h1>Dashboard Giáo Viên</h1>
            <span className="role-badge teacher">Teacher</span>
          </div>
          <div className="dashboard-actions">
            <button onClick={() => setShowCreateClassModal(true)} className="dashboard-btn dashboard-btn-primary">
              ➕ Tạo lớp mới
            </button>
            <button onClick={() => setShowCreateHomeworkModal(true)} className="dashboard-btn dashboard-btn-primary">
              📝 Giao bài tập
            </button>
            <button onClick={signOut} className="dashboard-btn dashboard-btn-secondary">
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon">
              🏫
            </div>
            <div className="dashboard-card-title">
              <h3>Lớp học của tôi</h3>
              <p>{classes.length} lớp</p>
            </div>
          </div>
          <div className="dashboard-card-content">
            {classes.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-state-icon">🏫</div>
                <h3>Chưa có lớp nào</h3>
                <p>Tạo lớp đầu tiên của bạn</p>
                <button onClick={() => setShowCreateClassModal(true)} className="dashboard-btn dashboard-btn-primary" style={{ marginTop: '1rem' }}>
                  Tạo lớp ngay
                </button>
              </div>
            ) : (
              <>
                <ul className="dashboard-list">
                  {classes.slice((classesPage - 1) * itemsPerPage, classesPage * itemsPerPage).map((cls: any) => (
                    <li key={cls.id} className="dashboard-list-item">
                      <div className="dashboard-list-item-content">
                        <div className="dashboard-list-item-title">
                          {cls.name}
                        </div>
                        <div className="dashboard-list-item-subtitle">
                          Mã: {cls.code} • {cls.level} • {cls.language === 'japanese' ? 'Tiếng Nhật' : 'Tiếng Trung'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link
                          to={`/teacher/class/${cls.id}`}
                          className="dashboard-list-item-action primary"
                        >
                          Quản lý
                        </Link>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="dashboard-list-item-action danger"
                        >
                          Xóa
                        </button>
                      </div>
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
              📚
            </div>
            <div className="dashboard-card-title">
              <h3>Bài tập đã giao</h3>
              <p>{homework.length} bài tập</p>
            </div>
          </div>
          <div className="dashboard-card-content">
            {homework.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-state-icon">📚</div>
                <h3>Chưa có bài tập</h3>
                <p>Giao bài tập cho học sinh</p>
                <button onClick={() => setShowCreateHomeworkModal(true)} className="dashboard-btn dashboard-btn-primary" style={{ marginTop: '1rem' }}>
                  Giao bài tập
                </button>
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
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link
                          to={`/teacher/homework/${hw.id}`}
                          className="dashboard-list-item-action primary"
                        >
                          Xem
                        </Link>
                        <button
                          onClick={() => handleDeleteHomework(hw.id)}
                          className="dashboard-list-item-action danger"
                        >
                          Xóa
                        </button>
                      </div>
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

      {/* Quick Actions */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div className="dashboard-card-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            ⚡
          </div>
          <div className="dashboard-card-title">
            <h3>Thao tác nhanh</h3>
            <p>Các tính năng quản lý</p>
          </div>
        </div>
        <div className="dashboard-card-content">
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <button onClick={() => setShowCreateClassModal(true)} className="dashboard-btn dashboard-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              🏫 Tạo lớp mới
            </button>
            <button onClick={() => setShowCreateHomeworkModal(true)} className="dashboard-btn dashboard-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              📝 Giao bài tập
            </button>
            <Link to="/teacher/students" className="dashboard-btn dashboard-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              👥 Quản lý học sinh
            </Link>
            <Link to="/teacher/reports" className="dashboard-btn dashboard-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              📊 Báo cáo
            </Link>
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreateClassModal && (
        <div className="dashboard-modal-overlay" onClick={() => setShowCreateClassModal(false)}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h2>Tạo lớp học mới</h2>
              <p>Điền thông tin lớp học</p>
            </div>

            <div className="dashboard-form-group">
              <label>Tên lớp</label>
              <input
                type="text"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                placeholder="Ví dụ: Lớp N5 Sáng Thứ 2"
                autoFocus
              />
            </div>

            <div className="dashboard-form-group">
              <label>Ngôn ngữ</label>
              <select
                value={newClass.language}
                onChange={(e) => setNewClass({ ...newClass, language: e.target.value })}
              >
                <option value="japanese">Tiếng Nhật</option>
                <option value="chinese">Tiếng Trung</option>
              </select>
            </div>

            <div className="dashboard-form-group">
              <label>Cấp độ</label>
              <select
                value={newClass.level}
                onChange={(e) => setNewClass({ ...newClass, level: e.target.value })}
              >
                {newClass.language === 'japanese' ? (
                  <>
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </>
                ) : (
                  <>
                    <option value="HSK1">HSK1</option>
                    <option value="HSK2">HSK2</option>
                    <option value="HSK3">HSK3</option>
                    <option value="HSK4">HSK4</option>
                    <option value="HSK5">HSK5</option>
                    <option value="HSK6">HSK6</option>
                  </>
                )}
              </select>
            </div>

            <div className="dashboard-modal-actions">
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="dashboard-btn dashboard-btn-secondary"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateClass}
                className="dashboard-btn dashboard-btn-primary"
                disabled={!newClass.name.trim()}
              >
                Tạo lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Homework Modal */}
      {showCreateHomeworkModal && (
        <div className="dashboard-modal-overlay" onClick={() => setShowCreateHomeworkModal(false)}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h2>Giao bài tập mới</h2>
              <p>Tạo bài tập cho học sinh</p>
            </div>

            <div className="dashboard-form-group">
              <label>Lớp học</label>
              <select
                value={newHomework.class_id}
                onChange={(e) => setNewHomework({ ...newHomework, class_id: e.target.value })}
              >
                <option value="">Chọn lớp</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="dashboard-form-group">
              <label>Tiêu đề</label>
              <input
                type="text"
                value={newHomework.title}
                onChange={(e) => setNewHomework({ ...newHomework, title: e.target.value })}
                placeholder="Ví dụ: Bài tập tuần 1"
              />
            </div>

            <div className="dashboard-form-group">
              <label>Mô tả</label>
              <textarea
                value={newHomework.description}
                onChange={(e) => setNewHomework({ ...newHomework, description: e.target.value })}
                placeholder="Mô tả chi tiết bài tập..."
              />
            </div>

            <div className="dashboard-form-group">
              <label>Hạn nộp</label>
              <input
                type="datetime-local"
                value={newHomework.due_date}
                onChange={(e) => setNewHomework({ ...newHomework, due_date: e.target.value })}
              />
            </div>

            <div className="dashboard-modal-actions">
              <button
                onClick={() => setShowCreateHomeworkModal(false)}
                className="dashboard-btn dashboard-btn-secondary"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateHomework}
                className="dashboard-btn dashboard-btn-primary"
                disabled={!newHomework.title.trim() || !newHomework.class_id}
              >
                Giao bài tập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
