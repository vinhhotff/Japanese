import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import StudentDashboard from './dashboards/StudentDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import AdminPanel from './AdminPanel';
import LoadingSpinner from './LoadingSpinner';

const RoleBasedDashboard: React.FC = () => {
  const { role, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Truy cập bị từ chối</h2>
          <p className="text-gray-600">Vui lòng đăng nhập để truy cập dashboard.</p>
        </div>
      </div>
    );
  }

  switch (role) {
    case 'admin':
      return <AdminPanel />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vai trò không hợp lệ</h2>
            <p className="text-gray-600">Vai trò tài khoản của bạn không được nhận diện.</p>
          </div>
        </div>
      );
  }
};

export default RoleBasedDashboard;
