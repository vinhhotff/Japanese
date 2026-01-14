import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireTeacher?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false, requireTeacher = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isTeacher } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireTeacher && !isTeacher && !isAdmin) { // Admins usually can access teacher stuff too, but generally keep it strict or allow fallthrough. 
    // Let's assume Admin implies Teacher rights or separate. For now, strict check or maybe Admin can access?
    // User requested "Check role in token".
    // If I restrict strictly:
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

