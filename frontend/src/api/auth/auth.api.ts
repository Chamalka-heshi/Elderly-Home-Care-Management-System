import { apiFetch, apiFetchMultipart, API_BASE_URL } from '../core/apiClient';
import type { User, UserRole } from '../../auth/AuthContext';
import { isTokenExpired } from '../../auth/tokenUtils';
import { signInWithGoogle, signOutFirebase } from '../../config/firebase';

// Types
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

// Forgot password flow
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

export interface ResetPasswordResponse {
  token: string;
  user: User;
}

// Check email registration to provide users with a contact hint for account recovery
export const checkEmailForReset = async (email: string): Promise<CheckEmailResponse> => {
  const params = new URLSearchParams({ email });

  return apiFetch<CheckEmailResponse>(`/auth/forgot-password/check-email?${params}`, {
    method: 'GET',
  });
};

// Verify identity to trigger the automated delivery of a temporary access credential
export const forgotPasswordApi = async (
  data: ForgotPasswordRequest,
): Promise<{ message: string }> => {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Finalize password recovery to restore secure account access with a new credential
export const resetPasswordApi = async (
  data: ResetPasswordRequest,
): Promise<{ message: string }> => {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Internal helpers
// Persist session data to maintain user state across browser refreshes
const storeSession = (token: string, user: User) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// Authentication
// Authenticate users via email and password to grant access to protected resources
export const signin = async (data: SigninRequest): Promise<AuthResponse> => {
  const res = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  storeSession(res.token, res.user);
  return res;
};

// Authenticate users via Google Firebase to provide a seamless social login experience
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

// Terminate active sessions and clear local state to ensure secure account exit
export const signout = async (
  setUser: (u: User | null) => void,
  navigate: (p: string) => void,
) => {
  const token = localStorage.getItem('token');

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.warn('Backend logout request failed:', err);
    }
  }

  navigate('/');
  await signOutFirebase();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setUser(null);
};

// Profile management
// Fetch the authenticated user's profile to populate dashboard and setting views
export const getProfile = () => apiFetch<User>('/auth/profile');

// Update administrator details to maintain accurate staff records and contact info
export const updateAdminProfile = (data: UpdateAdminProfileRequest) =>
  apiFetch<User>('/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Update family member profiles to ensure billing and notification details are current
export const updateFamilyProfile = (data: UpdateFamilyProfileRequest) =>
  apiFetch<User>('/family/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Modify doctor professional profiles to reflect current medical credentials and experience
export const updateDoctorProfile = (data: UpdateDoctorProfileRequest) =>
  apiFetch<User>('/doctors/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Update caregiver occupational profiles to manage shift availability and qualifications
export const updateCaregiverProfile = (data: UpdateCaregiverProfileRequest) =>
  apiFetch<User>('/caregivers/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Permanently remove user data and sessions to comply with data privacy and deletion requests
export const deleteAccount = () =>
  apiFetch<{ message: string }>('/auth/delete-account', {
    method: 'DELETE',
  }).then((res) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return res;
  });

// Update an existing password to maintain account security and prevent unauthorized access
export const changePasswordApi = (data: ChangePasswordRequest) =>
  apiFetch<{ message: string }>('/auth/change-password', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Enforce password updates on first login to ensure system-generated credentials are replaced
export const firstLoginChangePasswordApi = (data: FirstLoginChangePasswordRequest) =>
  apiFetch<{ message: string }>('/auth/first-login-change-password', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Upload a new profile picture to personalize the user's presence within the platform
export const uploadAvatar = (file: File): Promise<{ avatarUrl: string }> => {
  const form = new FormData();
  form.append('avatar', file);

  return apiFetchMultipart<{ avatarUrl: string }>('/auth/upload-avatar', {
    method: 'PATCH',
    body: form,
  });
};

// Delete the profile picture to revert to a default placeholder avatar
export const removeAvatar = () =>
  apiFetch<{ message: string }>('/auth/remove-avatar', {
    method: 'DELETE',
  });

// Session management
// Retrieve the cached user object to support immediate UI rendering before server sync
export const getStoredUser = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

// Retrieve the active JWT from storage to authorize outbound API requests
export const getStoredToken = () => localStorage.getItem('token');

// Validate the current session to determine if the user has a valid and unexpired identity
export const isAuthenticated = () => {
  const token = getStoredToken();
  return !!token && !isTokenExpired(token);
};

// Check if the current user possesses a specific role for granular access control
export const hasRole = (role: UserRole) => getStoredUser()?.role === role;

// Identify the active user role to drive role-specific navigation and dashboard logic
export const getCurrentRole = () => getStoredUser()?.role ?? null;