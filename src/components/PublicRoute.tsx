import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
    children: ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
    const { user, loading } = useAuth();

    if (user) {
        return <Navigate to="/" replace />;
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading">Đang tải...</div>
            </div>
        );
    }

    return <>{children}</>;
};

export default PublicRoute;
