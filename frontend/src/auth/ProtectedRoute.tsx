import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from './AuthContext';
import { isTokenExpired } from './tokenUtils';

interface ProtectedRouteProps {
  role: UserRole | UserRole[];
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role, children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!user || isTokenExpired(token) || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;