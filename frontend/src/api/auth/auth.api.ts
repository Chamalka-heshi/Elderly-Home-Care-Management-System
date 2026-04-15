import { apiFetch } from '../core/apiClient';
import type { User, UserRole } from '../../auth/AuthContext';
import { isTokenExpired } from '../../auth/tokenUtils';
import { signInWithGoogle, signOutFirebase } from '../../config/firebase';

export interface SigninRequest {
  email: string;
  password: string;
}

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

export interface UpdateBaseProfileRequest {
  fullName?: string;
  contactNumber?: string;
}

export interface UpdateAdminProfileRequest extends UpdateBaseProfileRequest {}
export interface UpdateFamilyProfileRequest extends UpdateBaseProfileRequest {}

export interface UpdateDoctorProfileRequest extends UpdateBaseProfileRequest {
  specialization?: string;
  licenseNumber?: string;
  qualification?: string;
  experienceYears?: number;
}

export interface UpdateCaregiverProfileRequest extends UpdateBaseProfileRequest {}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const signin = async (data: SigninRequest): Promise<AuthResponse> => {
  const res = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  storeSession(res.token, res.user);
  return res;
};

export const googleAuth = async (): Promise<AuthResponse> => {
  const credential = await signInWithGoogle();
  const idToken = await credential.user.getIdToken();
  const res = await apiFetch<AuthResponse>('/auth/firebase', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  storeSession(res.token, res.user);
  return res;
};

export const getProfile = () => apiFetch<User>('/auth/profile');

export const updateAdminProfile = (data: UpdateAdminProfileRequest) =>
  apiFetch<User>('/admin/profile', { method: 'PATCH', body: JSON.stringify(data) });

export const updateFamilyProfile = (data: UpdateFamilyProfileRequest) =>
  apiFetch<User>('/family/profile', { method: 'PATCH', body: JSON.stringify(data) });

export const updateDoctorProfile = (data: UpdateDoctorProfileRequest) =>
  apiFetch<User>('/doctors/profile', { method: 'PATCH', body: JSON.stringify(data) });

export const updateCaregiverProfile = (data: UpdateCaregiverProfileRequest) =>
  apiFetch<User>('/caregivers/profile', { method: 'PATCH', body: JSON.stringify(data) });

export const deleteAccount = () =>
  apiFetch<{ message: string }>('/auth/delete-account', { method: 'DELETE' }).then((res) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return res;
  });

export const signout = async (
  setUser: (u: User | null) => void,
  navigate: (p: string) => void,
) => {
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

export const changePasswordApi = (data: ChangePasswordRequest) =>
  apiFetch<{ message: string }>('/auth/change-password', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const getStoredToken = () => localStorage.getItem('token');

export const isAuthenticated = () => {
  const token = getStoredToken();
  return !!token && !isTokenExpired(token);
};

export const hasRole = (role: UserRole) => getStoredUser()?.role === role;
export const getCurrentRole = () => getStoredUser()?.role ?? null;