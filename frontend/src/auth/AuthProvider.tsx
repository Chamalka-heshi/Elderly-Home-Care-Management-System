import React, { useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContext, type User } from "./AuthContext";
import { getProfile } from "../api/auth/auth.api";

interface AuthProviderProps {
  children: ReactNode;
}

// Bootstraps auth state from the server cookie on mount; blocks rendering until resolved.
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  useEffect(() => {
    getProfile()
      .then((profile) => { setUserState(profile); setWasAuthenticated(true); })
      .catch(() => setUserState(null))
      .finally(() => setBootstrapping(false));
  }, []);

  // Sets user and flags the session as authenticated when a user is provided.
  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) setWasAuthenticated(true);
  }, []);

  if (bootstrapping) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc", flexDirection: "column", gap: "16px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e2e8f0", borderTop: "3px solid #10b981", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 600, margin: 0 }}>Loading…</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, wasAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;