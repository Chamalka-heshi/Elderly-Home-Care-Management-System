import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { AuthContext, type User } from "./AuthContext";
import { isTokenExpired } from "./tokenUtils";

interface AuthProviderProps {
  children: ReactNode;
}

// Initial state resolution: restores user session if token is valid
const initUser = (): User | null => {
  try {
    const token = localStorage.getItem("token");

    // Clear session if token is missing or has expired
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }

    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

// Provider component that manages the global authentication state
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(initUser);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;