import { apiFetch, apiFetchMultipart, API_BASE_URL, setCsrfToken, getAuthHeaders } from '../core/apiClient';
import type { User } from '../../auth/AuthContext';
import { signInWithGoogle, signOutFirebase } from '../../config/firebase';

// Types
export interface SigninRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  message: string;
  isNewUser?: boolean;
  csrfToken?: string;
}

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

export interface UpdateCaregiverProfileRequest extends UpdateBaseProfileRequest {
  address?: string;
  qualification?: string;
  emergencyContact?: string;
  experienceYears?: number;
  specializations?: string[];
  availableShifts?: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface FirstLoginChangePasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface CheckEmailResponse {
  maskedContact: string;
}

export interface ForgotPasswordRequest {
  email: string;
  contactNumber: string;
}

export interface ResetPasswordRequest {
  email: string;
  tempPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Reads the csrf_token cookie set by the backend and saves it to sessionStorage.
const storeCsrfTokenFromCookie = (): void => {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  if (match) setCsrfToken(decodeURIComponent(match[1]));
};

// Checks whether an email address exists before initiating a password reset.
export const checkEmailForReset = async (email: string): Promise<CheckEmailResponse> => {
  const params = new URLSearchParams({ email });
  return apiFetch<CheckEmailResponse>(`/auth/forgot-password/check-email?${params}`, { method: 'GET' });
};

// Sends a forgot-password request with the user's email and contact number.
export const forgotPasswordApi = async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Resets the user's password using a temporary credential and stores the new CSRF token.
export const resetPasswordApi = async (data: ResetPasswordRequest): Promise<{ message: string }> => {
  const res = await apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  storeCsrfTokenFromCookie();
  return res;
};

// Authenticates a user with email and password and stores the CSRF token from the response cookie.
export const signin = async (data: SigninRequest): Promise<AuthResponse> => {
  const res = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  storeCsrfTokenFromCookie();
  return res;
};

// Authenticates a user via Google Firebase and stores the CSRF token from the response cookie.
export const googleAuth = async (): Promise<AuthResponse> => {
  const credential = await signInWithGoogle();
  const idToken = await credential.user.getIdToken();

  const res = await apiFetch<AuthResponse>('/auth/firebase', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  storeCsrfTokenFromCookie();
  return res;
};

// Logs the user out on the server, clears Firebase auth, and resets local session state.
export const signout = async (
  setUser: (u: User | null) => void,
  navigate: (p: string) => void,
) => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.warn('Backend logout request failed:', err);
  }

  navigate('/');
  await signOutFirebase();
  sessionStorage.removeItem('csrf-token');
  setUser(null);
};

// Returns the authenticated user's profile.
export const getProfile = () => apiFetch<User>('/auth/profile');

// Updates the admin's profile fields.
export const updateAdminProfile = (data: UpdateAdminProfileRequest) =>
  apiFetch<User>('/admin/profile', { method: 'PATCH', body: JSON.stringify(data) });

// Updates the family member's profile fields.
export const updateFamilyProfile = (data: UpdateFamilyProfileRequest) =>
  apiFetch<User>('/family/profile', { method: 'PATCH', body: JSON.stringify(data) });

// Updates the doctor's profile fields.
export const updateDoctorProfile = (data: UpdateDoctorProfileRequest) =>
  apiFetch<User>('/doctors/profile', { method: 'PATCH', body: JSON.stringify(data) });

// Updates the caregiver's profile fields.
export const updateCaregiverProfile = (data: UpdateCaregiverProfileRequest) =>
  apiFetch<User>('/caregivers/profile', { method: 'PATCH', body: JSON.stringify(data) });

// Permanently deletes the authenticated user's account and clears the local CSRF token.
export const deleteAccount = () =>
  apiFetch<{ message: string }>('/auth/delete-account', { method: 'DELETE' }).then((res) => {
    sessionStorage.removeItem('csrf-token');
    return res;
  });

// Changes the authenticated user's password.
export const changePasswordApi = (data: ChangePasswordRequest) =>
  apiFetch<{ message: string }>('/auth/change-password', { method: 'PATCH', body: JSON.stringify(data) });

// Changes the password on the user's first login.
export const firstLoginChangePasswordApi = (data: FirstLoginChangePasswordRequest) =>
  apiFetch<{ message: string }>('/auth/first-login-change-password', { method: 'PATCH', body: JSON.stringify(data) });

// Uploads a new profile picture and returns the resulting avatar URL.
export const uploadAvatar = (file: File): Promise<{ avatarUrl: string }> => {
  const form = new FormData();
  form.append('avatar', file);
  return apiFetchMultipart<{ avatarUrl: string }>('/auth/upload-avatar', { method: 'PATCH', body: form });
};

// Removes the authenticated user's current profile picture.
export const removeAvatar = () =>
  apiFetch<{ message: string }>('/auth/remove-avatar', { method: 'DELETE' });
