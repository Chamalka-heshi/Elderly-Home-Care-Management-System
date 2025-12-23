import { createContext, useContext } from 'react';

export type UserRole = 'admin' | 'doctor' | 'caregiver' | 'family';

export interface User {
  full_name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);
