import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAssignments } from '../services/assignmentService';
import { useAuth } from '../contexts/AuthContext';
import '../styles/assignments.css';

interface AssignmentListProps {
  lessonId?: string;
  language?: 'japanese' | 'chinese';
}

const AssignmentList = ({ lessonId, language }: AssignmentListProps) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAssignments();
  }, [lessonId, language, page]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const result = await getAssignments(lessonId, language, page, 10);
      setAssignments(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      writing: '✍️',
      translation: '🔄',
      essay: '📝',
      vocabulary: '📚',
      grammar: '📖',
      speaking: '🎤',
      mixed: '🎯',
    };
    return icons[type] || '📄';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: '#10b981',
      medium: '#f59e0b',
      hard: '#ef4444',
    };
    return colors[difficulty] || '#6b7280';
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="assignments-loading">
        <div className="spinner"></div>
        <p>Đang tải bài tập...</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="assignments-empty">
        <div className="empty-icon">📝</div>
        <h3>Chưa có bài tập nào</h3>
        <p>Giáo viên sẽ giao bài tập sớm thôi!</p>
      </div>
    );
  }

  return (
    <div className="assignments-container">
      <div className="assignments-header">
        <h2>📚 Bài tập</h2>
        <p>{assignments.length} bài tập</p>
      </div>

      <div className="assignments-grid">
        {assignments.map((assignment) => (
          <Link
            key={assignment.id}
            to={`/assignments/${assignment.id}`}
            className="assignment-card"
          >
            <div className="assignment-header">
              <div className="assignment-type">
                <span className="type-icon">{getTypeIcon(assignment.assignment_type)}</span>
                <span className="type-label">{assignment.assignment_type}</span>
              </div>
              {assignment.difficulty && (
                <span
                  className="difficulty-badge"
                  style={{ background: getDifficultyColor(assignment.difficulty) }}
                >
                  {assignment.difficulty}
                </span>
              )}
            </div>

            <h3 className="assignment-title">{assignment.title}</h3>
            <p className="assignment-description">{assignment.description}</p>

            <div className="assignment-meta">
              <div className="meta-item">
                <span className="meta-icon">🎯</span>
                <span>{assignment.max_score || 100} điểm</span>
              </div>
              {assignment.due_date && (
                <div className={`meta-item ${isOverdue(assignment.due_date) ? 'overdue' : ''}`}>
                  <span className="meta-icon">📅</span>
                  <span>
                    {isOverdue(assignment.due_date) ? 'Quá hạn' : 'Hạn nộp'}: {' '}
                    {new Date(assignment.due_date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
            </div>

            <div className="assignment-footer">
              <span className="lesson-name">
                📖 {assignment.lesson?.title || 'Bài học'}
              </span>
              <span className="arrow-icon">→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Trước
          </button>
          <span className="pagination-info">
            Trang {page} / {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignmentList;
