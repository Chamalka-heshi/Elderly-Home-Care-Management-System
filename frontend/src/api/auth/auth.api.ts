import { apiFetch, apiFetchMultipart, API_BASE_URL, setCsrfToken } from '../core/apiClient';
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


// Check if email exists for password reset
export const checkEmailForReset = async (email: string): Promise<CheckEmailResponse> => {
  const params = new URLSearchParams({ email });

  return apiFetch<CheckEmailResponse>(`/auth/forgot-password/check-email?${params}`, {
    method: 'GET',
  });
};

// Send forgot password request
export const forgotPasswordApi = async (
  data: ForgotPasswordRequest,
): Promise<{ message: string }> => {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Reset password with temporary credential
export const resetPasswordApi = async (
  data: ResetPasswordRequest,
): Promise<{ message: string }> => {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};


// Authentication
// Login with email and password
export const signin = async (data: SigninRequest): Promise<AuthResponse> => {
  const res = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store CSRF token if provided
  if (res.csrfToken) {
    setCsrfToken(res.csrfToken);
  }

  return res;
};

// Login with Google
export const googleAuth = async (): Promise<AuthResponse> => {
  const credential = await signInWithGoogle();
  const idToken = await credential.user.getIdToken();

  const res = await apiFetch<AuthResponse>('/auth/firebase', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });

  // Store CSRF token if provided
  if (res.csrfToken) {
    setCsrfToken(res.csrfToken);
  }

  return res;
};

// Logout and clear session data
export const signout = async (
  setUser: (u: User | null) => void,
  navigate: (p: string) => void,
) => {
  // Clear secure cookie on server via logout endpoint (cookies are sent automatically)
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.warn('Backend logout request failed:', err);
  }

  navigate('/');
  await signOutFirebase();
  sessionStorage.removeItem('csrf-token');
  setUser(null);
};

// Profile management
// Get current user profile
export const getProfile = () => apiFetch<User>('/auth/profile');

// Update admin profile
export const updateAdminProfile = (data: UpdateAdminProfileRequest) =>
  apiFetch<User>('/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Update family member profile
export const updateFamilyProfile = (data: UpdateFamilyProfileRequest) =>
  apiFetch<User>('/family/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Update doctor profile
export const updateDoctorProfile = (data: UpdateDoctorProfileRequest) =>
  apiFetch<User>('/doctors/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Update caregiver profile
export const updateCaregiverProfile = (data: UpdateCaregiverProfileRequest) =>
  apiFetch<User>('/caregivers/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Delete user account
export const deleteAccount = () =>
  apiFetch<{ message: string }>('/auth/delete-account', {
    method: 'DELETE',
  }).then((res) => {
    sessionStorage.removeItem('csrf-token');
    return res;
  });

// Change account password
export const changePasswordApi = (data: ChangePasswordRequest) =>
  apiFetch<{ message: string }>('/auth/change-password', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Change password on first login
export const firstLoginChangePasswordApi = (data: FirstLoginChangePasswordRequest) =>
  apiFetch<{ message: string }>('/auth/first-login-change-password', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Upload profile picture
export const uploadAvatar = (file: File): Promise<{ avatarUrl: string }> => {
  const form = new FormData();
  form.append('avatar', file);

  return apiFetchMultipart<{ avatarUrl: string }>('/auth/upload-avatar', {
    method: 'PATCH',
    body: form,
  });
};

// Remove profile picture
export const removeAvatar = () =>
  apiFetch<{ message: string }>('/auth/remove-avatar', {
    method: 'DELETE',
  });

