import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type UserRole } from "./AuthContext";

interface ProtectedRouteProps {
  role: UserRole | UserRole[];
  children: ReactNode;
}

// Guards a route by role; redirects unauthenticated users to /login (with expiry banner only if they had a session).
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role, children }) => {
  const { user, wasAuthenticated } = useAuth();
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!user) return <Navigate to={wasAuthenticated ? "/login?reason=expired" : "/login"} replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
