import { createContext, useContext } from "react";

// Supported system roles for access control
export type UserRole = "super_admin" | "admin" | "doctor" | "caregiver" | "family";

// Core user profile structure
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  contactNumber?: string;
  mustChangePassword?: boolean;
  avatarUrl?: string | null;
}

// Internal context state definition
interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

// Global authentication context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

// Custom hook for accessing authentication state
export const useAuth = () => useContext(AuthContext);
