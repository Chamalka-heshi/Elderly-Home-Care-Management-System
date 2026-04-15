import { useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext, type User } from './AuthContext';
import { isTokenExpired } from './tokenUtils';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * On first render:
 *  1. Read the stored JWT from localStorage.
 *  2. If it's missing or expired  → wipe storage and start with user = null.
 *  3. If it's still valid          → restore the stored user object.
 *
 * No manual expiry timestamps are calculated here – we rely entirely on
 * the `exp` claim that the backend embeds in the JWT.
 */
const initUser = (): User | null => {
  try {
    const token = localStorage.getItem('token');

    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }

    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;

  } catch {
    return null;
  }
};

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(initUser);

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