import { apiFetch } from '../core/apiClient';

// Adjust these two import paths if your AuthContext or firebase config are in different folders!
import type { User, UserRole } from '../../auth/AuthContext'; 
import { signInWithGoogle, signOutFirebase } from '../../config/firebase';

export interface SigninRequest { 
  email: string; 
  password: string; 
}

// This is the specific interface that family-auth.api.ts is looking for!
export interface AuthResponse { 
  token: string; 
  user: User; 
  message: string; 
  isNewUser?: boolean; 
}

const storeSession = (token: string, user: User) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const signin = async (data: SigninRequest): Promise<AuthResponse> => {
  const res = await apiFetch<AuthResponse>('/auth/login', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });
  storeSession(res.token, res.user);
  return res;
};

export const googleAuth = async (): Promise<AuthResponse> => {
  const credential = await signInWithGoogle();
  const idToken = await credential.user.getIdToken();
  const res = await apiFetch<AuthResponse>('/auth/firebase', { 
    method: 'POST', 
    body: JSON.stringify({ idToken }) 
  });
  storeSession(res.token, res.user);
  return res;
};

export const getProfile = () => apiFetch<User>('/auth/profile');

export const deleteAccount = () => 
  apiFetch<{message: string}>('/auth/delete-account', { method: 'DELETE' }).then(res => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('user'); 
    return res;
  });

export const signout = async (setUser: (u: User | null) => void, navigate: (p: string) => void) => {
  await signOutFirebase();
  localStorage.removeItem('token'); 
  localStorage.removeItem('user');
  setUser(null); 
  navigate('/login');
};

export const getStoredUser = (): User | null => { 
  try { 
    return JSON.parse(localStorage.getItem('user') || 'null'); 
  } catch { 
    return null; 
  } 
};

export const getStoredToken = () => localStorage.getItem('token');
export const isAuthenticated = () => !!getStoredToken();
export const hasRole = (role: UserRole) => getStoredUser()?.role === role;
export const getCurrentRole = () => getStoredUser()?.role ?? null;