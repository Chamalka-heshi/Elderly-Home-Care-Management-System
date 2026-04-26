import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type UserRole } from "./AuthContext";
import { isTokenExpired } from "./tokenUtils";

interface ProtectedRouteProps {
  role: UserRole | UserRole[];
  children: ReactNode;
}

// Higher-order component to restrict access based on authentication and roles
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role, children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const allowedRoles = Array.isArray(role) ? role : [role];

  // Redirect to login if session is missing or has expired
  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login?reason=expired" replace />;
  }

  // Ensure user has the required role; otherwise, redirect to their dashboard
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={user ? `/${user.role}` : "/"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
