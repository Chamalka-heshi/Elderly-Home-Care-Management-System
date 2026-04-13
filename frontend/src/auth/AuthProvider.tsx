import { useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext, type User } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

/** Read the persisted user synchronously from localStorage on first render. */
const readStoredUser = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialise from localStorage so a page refresh doesn't clear auth state.
  const [user, setUserState] = useState<User | null>(readStoredUser);

  const setUser = (u: User | null) => {
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setUserState(u);
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;