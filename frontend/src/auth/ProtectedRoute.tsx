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

  // No token or expired → tell login page why
  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login?reason=expired" replace />;
  }

  // Logged in but wrong role → send to their own dashboard
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={user ? `/${user.role}` : '/'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;