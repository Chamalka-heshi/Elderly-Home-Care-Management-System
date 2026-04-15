import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from './AuthContext';
import { isTokenExpired } from './tokenUtils';

interface ProtectedRouteProps {
  role: UserRole;
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role, children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  if (!user || isTokenExpired(token) || user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;