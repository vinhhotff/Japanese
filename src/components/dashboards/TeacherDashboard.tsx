import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getTeacherClasses, createClass, deleteClass, getClassStudents } from '../../services/classService';
import { getTeacherHomework, createHomework, deleteHomework, updateHomework } from '../../services/homeworkService';
import { getTeacherAssignments, deleteAssignment } from '../../services/assignmentService';
import Pagination from '../common/Pagination';
import { useToast } from '../Toast';
import '../../styles/dashboard-modern.css';

const TeacherDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]); // Added
  const [loading, setLoading] = useState(true);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateHomeworkModal, setShowCreateHomeworkModal] = useState(false);
  const [editingHomeworkId, setEditingHomeworkId] = useState<string | null>(null);
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
  const [assignmentsPage, setAssignmentsPage] = useState(1); // Added
  const itemsPerPage = 5;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [classesData, homeworkData, assignmentsData] = await Promise.all([
        getTeacherClasses(user.id),
        getTeacherHomework(user.id),
        getTeacherAssignments(user.id)
      ]);

      setClasses(classesData || []);
      setHomework(homeworkData || []);
      setAssignments(assignmentsData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      showToast(error?.message || 'Không tải được dữ liệu. Kiểm tra quyền truy cập.', 'error');
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
      setClasses(prev => prev.filter(c => c.id !== classId));
      showToast('Đã xóa lớp thành công', 'success');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting class:', error);
      showToast(error?.message || 'Không thể xóa lớp. Kiểm tra quyền hoặc dữ liệu liên quan.', 'error');
    }
  };

  const handleCreateHomework = async () => {
    if (!user || !newHomework.title.trim() || !newHomework.class_id) return;

    try {
      if (editingHomeworkId) {
        await updateHomework(editingHomeworkId, newHomework);
        showToast('Đã cập nhật bài tập thành công', 'success');
      } else {
        await createHomework({
          ...newHomework,
          teacher_id: user.id
        });
        showToast('Đã giao bài tập mới thành công', 'success');
      }
      setShowCreateHomeworkModal(false);
      setEditingHomeworkId(null);
      setNewHomework({ class_id: '', title: '', description: '', due_date: '' });
      loadData();
    } catch (error: any) {
      console.error('Error creating/updating homework:', error);
      showToast(error?.message || 'Lỗi thao tác bài tập', 'error');
    }
  };

  const handleEditHomework = (hw: any) => {
    setNewHomework({
      class_id: hw.class_id,
      title: hw.title,
      description: hw.description || '',
      due_date: hw.due_date ? new Date(hw.due_date).toISOString().slice(0, 16) : ''
    });
    setEditingHomeworkId(hw.id);
    setShowCreateHomeworkModal(true);
  };

  const handleDeleteHomework = async (homeworkId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài tập này?')) return;

    try {
      await deleteHomework(homeworkId);
      setHomework(prev => prev.filter(h => h.id !== homeworkId));
      showToast('Đã xóa bài tập đã giao thành công', 'success');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting homework:', error);
      showToast(error?.message || 'Không thể xóa bài tập. Kiểm tra quyền hoặc dữ liệu liên quan.', 'error');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài tập media này?')) return;

    try {
      await deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
      showToast('Đã xóa bài tập media thành công', 'success');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      showToast(error?.message || 'Không thể xóa bài tập media. Kiểm tra quyền hoặc dữ liệu liên quan.', 'error');
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
              🏫 Thiết lập lớp học
            </button>
            <Link to="/teacher/assignments/new" className="dashboard-btn dashboard-btn-primary">
              ✨ Kho bài tập Media
            </Link>
            <button onClick={() => signOut()} className="dashboard-btn dashboard-btn-secondary">
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
              🏫
            </div>
            <div className="dashboard-card-title">
              <h3>Lớp học của tôi</h3>
              <p>{classes.length} lớp học đang dạy</p>
            </div>
          </div>
          <div className="dashboard-card-content">
            {classes.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-state-icon">🏫</div>
                <h3>Chưa có lớp nào</h3>
                <p>Tạo lớp đầu tiên để bắt đầu giảng dạy</p>
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
                        <div className="dashboard-list-item-title">{cls.name}</div>
                        <div className="dashboard-list-item-subtitle">
                          Mã: {cls.code} • {cls.level} • {cls.language === 'japanese' ? 'Tiếng Nhật' : 'Tiếng Trung'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/class/${cls.id}`}
                          className="dashboard-list-item-action primary"
                        >
                          Quản lý
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}
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
      </div>

      {/* Unified Task Management Grid */}
      <div className="dashboard-grid" style={{ marginTop: '2.5rem' }}>
        <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}>
              📝
            </div>
            <div className="dashboard-card-title">
              <h3>Quản lý Bài tập (Tasks)</h3>
              <p>Tổng cộng {homework.length + assignments.length} bài tập đã giao</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCreateHomeworkModal(true)} className="dashboard-btn dashboard-btn-secondary py-1 text-xs">
                + Bài tập nhanh
              </button>
              <Link to="/teacher/assignments/new" className="dashboard-btn dashboard-btn-primary py-1 text-xs">
                + Bài tập Media
              </Link>
            </div>
          </div>
          <div className="dashboard-card-content">
            {homework.length === 0 && assignments.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-state-icon">📝</div>
                <h3>Chưa có bài tập nào</h3>
                <p>Bắt đầu bằng cách giao bài tập nhanh hoặc tạo học liệu Media</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Homework Column */}
                <div>
                  <h4 className="text-xs font-black text-amber-600 uppercase mb-4 tracking-widest pl-2 border-l-4 border-amber-400">📝 Bài tập nhanh (Homework)</h4>
                  <ul className="dashboard-list">
                    {homework.map((hw: any) => (
                      <li key={hw.id} className="dashboard-list-item">
                        <div className="dashboard-list-item-content">
                          <div className="dashboard-list-item-title">{hw.title}</div>
                          <div className="dashboard-list-item-subtitle">{hw.classes?.name}</div>
                        </div>
                        <div className="flex gap-1">
                          <Link to={`/assignments/${hw.id}`} className="p-1 hover:text-indigo-600">👁️</Link>
                          <button onClick={() => handleEditHomework(hw)} className="p-1 hover:text-amber-600">✏️</button>
                          <button onClick={() => handleDeleteHomework(hw.id)} className="p-1 hover:text-red-600">🗑️</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Media Column */}
                <div>
                  <h4 className="text-xs font-black text-indigo-600 uppercase mb-4 tracking-widest pl-2 border-l-4 border-indigo-400">🎥 Bài tập Media (Assignments)</h4>
                  <ul className="dashboard-list">
                    {assignments.map((asg: any) => (
                      <li key={asg.id} className="dashboard-list-item">
                        <div className="dashboard-list-item-content">
                          <div className="dashboard-list-item-title">{asg.title}</div>
                          <div className="dashboard-list-item-subtitle">{asg.assignment_type} • {asg.lesson?.title || 'Bài lẻ'}</div>
                        </div>
                        <div className="flex gap-1">
                          <Link to={`/assignments/${asg.id}`} className="p-1 hover:text-indigo-600">👁️</Link>
                          <Link to={`/teacher/assignments/edit/${asg.id}`} className="p-1 hover:text-amber-600">✏️</Link>
                          <button onClick={() => handleDeleteAssignment(asg.id)} className="p-1 hover:text-red-600">🗑️</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
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
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <button onClick={() => setShowCreateClassModal(true)} className="dashboard-btn dashboard-btn-primary" style={{ justifyContent: 'center' }}>
              🏫 Thiết lập lớp học
            </button>
            <Link to="/teacher/assignments/new" className="dashboard-btn dashboard-btn-primary" style={{ justifyContent: 'center' }}>
              📝 Giao bài tập media
            </Link>
            <Link to="/assignments" className="dashboard-btn dashboard-btn-secondary" style={{ justifyContent: 'center' }}>
              👥 Quản lý học tập
            </Link>
            <Link to="/study-progress" className="dashboard-btn dashboard-btn-secondary" style={{ justifyContent: 'center' }}>
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
        <div className="dashboard-modal-overlay" onClick={() => { setShowCreateHomeworkModal(false); setEditingHomeworkId(null); setNewHomework({ class_id: '', title: '', description: '', due_date: '' }); }}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h2>{editingHomeworkId ? 'Hiệu chỉnh bài tập' : 'Giao bài tập mới'}</h2>
              <p>{editingHomeworkId ? 'Cập nhật lại thông tin bài tập đã giao' : 'Giao bài tập bổ trợ cho học sinh'}</p>
            </div>

            <div className="dashboard-form-group">
              <label>Lớp học áp dụng</label>
              <select
                value={newHomework.class_id}
                onChange={(e) => setNewHomework({ ...newHomework, class_id: e.target.value })}
                disabled={!!editingHomeworkId}
              >
                <option value="">-- Chọn lớp học --</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="dashboard-form-group">
              <label>Tiêu đề bài tập</label>
              <input
                type="text"
                value={newHomework.title}
                onChange={(e) => setNewHomework({ ...newHomework, title: e.target.value })}
                placeholder="Ví dụ: Luyện tập Kanji bài 5"
              />
            </div>

            <div className="dashboard-form-group">
              <label>Yêu cầu chi tiết (Hướng dẫn)</label>
              <textarea
                value={newHomework.description}
                onChange={(e) => setNewHomework({ ...newHomework, description: e.target.value })}
                placeholder="Nêu rõ các việc học sinh cần làm..."
                rows={5}
              />
            </div>

            <div className="dashboard-form-group">
              <label>Thời hạn nộp bài (Deadline)</label>
              <input
                type="datetime-local"
                value={newHomework.due_date}
                onChange={(e) => setNewHomework({ ...newHomework, due_date: e.target.value })}
              />
            </div>

            <div className="dashboard-modal-actions">
              <button
                onClick={() => { setShowCreateHomeworkModal(false); setEditingHomeworkId(null); setNewHomework({ class_id: '', title: '', description: '', due_date: '' }); }}
                className="dashboard-btn dashboard-btn-secondary"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCreateHomework}
                className="dashboard-btn dashboard-btn-primary"
                disabled={!newHomework.title.trim() || !newHomework.class_id}
              >
                {editingHomeworkId ? '💾 Cập nhật bài tập' : '🚀 Giao bài tập ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
