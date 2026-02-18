// Frontend Auth API - TypeScript Strict (No 'any' types)
// Place this file in: src/api/auth.api.tsx

import type { User, UserRole } from '../types/user.types';

export interface SignupRequest {
  fullName: string;
  email: string;
  contactNumber: string;
  password: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface SigninResponse {
  token: string;
  user: User;
  message: string;
}

export interface SignupResponse {
  message: string;
  user: User;
  token: string;
}

export interface ErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}

// API Base URL - Use VITE_ prefix for Vite projects
const API_BASE_URL =  'http://localhost:3000/api';

console.log('🔗 API Base URL:', API_BASE_URL);

/**
 * Family Member Signup (Public)
 * ROUTE: POST /api/auth/family/signup
 */
export const signup = async (
  data: SignupRequest
): Promise<SignupResponse> => {
  try {
    console.log('📤 Signup request to:', `${API_BASE_URL}/auth/family/signup`);
    
    const res = await fetch(`${API_BASE_URL}/auth/family/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    console.log('📥 Signup response status:', res.status);

    const responseData = await res.json();

    // Handle NestJS error responses
    if (!res.ok) {
      const errorMessage = responseData.message || responseData.error || 'Signup failed';
      throw new Error(errorMessage);
    }

    // Validate successful response
    if (!responseData.token || !responseData.user) {
      throw new Error('Invalid response from server');
    }
    
    // Store token in localStorage
    localStorage.setItem('token', responseData.token);
    localStorage.setItem('user', JSON.stringify(responseData.user));

    return responseData as SignupResponse;
  } catch (error) {
    console.error('❌ Signup error:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please ensure the backend is running.');
    }
    
    // Re-throw other errors
    throw error;
  }
};

/**
 * Universal Sign In (All Roles)
 * ROUTE: POST /api/auth/login
 */
export const signin = async (
  data: SigninRequest
): Promise<SigninResponse> => {
  try {
    console.log('📤 Signin request to:', `${API_BASE_URL}/auth/login`);
    
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    console.log('📥 Signin response status:', res.status);

    const responseData = await res.json();
    
    // Handle NestJS error responses
    if (!res.ok) {
      // NestJS returns { statusCode, message, error }
      const errorMessage = responseData.message || responseData.error || 'Signin failed';
      throw new Error(errorMessage);
    }

    // Validate successful response structure
    if (!responseData.token || !responseData.user) {
      throw new Error('Invalid response from server');
    }

    // Store token and user data
    localStorage.setItem('token', responseData.token);
    localStorage.setItem('user', JSON.stringify(responseData.user));

    return responseData as SigninResponse;
  } catch (error) {
    console.error('❌ Signin error:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please ensure the backend is running.');
    }
    
    // Re-throw other errors
    throw error;
  }
};

/**
 * Sign Out
 */
export const signout = async (
  setUser: (user: User | null) => void,
  navigate: (path: string) => void
): Promise<void> => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  } catch (err) {
    console.error('❌ Signout error:', err);
  }
};

export const deleteAccount = async (): Promise<{ message: string }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const res = await fetch(`${API_BASE_URL}/auth/delete-account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      // No body needed anymore
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMessage = data.message || data.error || 'Failed to delete account';
      throw new Error(errorMessage);
    }

    // Clear localStorage after deletion
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    return { message: data.message || 'Account deleted successfully' };
  } catch (error) {
    console.error('❌ Delete account error:', error);
    throw error instanceof Error ? error : new Error('Failed to delete account');
  }
};


/**
 * Get Current User Profile
 * ROUTE: GET /api/auth/profile
 */
export const getProfile = async (): Promise<User> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('📤 Get profile request to:', `${API_BASE_URL}/auth/profile`);

    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📥 Get profile response status:', res.status);

    const responseData = await res.json();

    // Handle errors
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Session expired. Please login again.');
      }
      
      const errorMessage = responseData.message || responseData.error || 'Failed to fetch profile';
      throw new Error(errorMessage);
    }

    return responseData as User;
  } catch (error) {
    console.error('❌ Get profile error:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please ensure the backend is running.');
    }
    
    // Re-throw other errors
    throw error;
  }
};

/**
 * Helper: Get stored user from localStorage
 */
export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr) as User;
    return user;
  } catch {
    return null;
  }
};

/**
 * Helper: Get stored token
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Helper: Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

/**
 * Helper: Check user role
 */
export const hasRole = (role: UserRole): boolean => {
  const user = getStoredUser();
  return user?.role === role;
};

/**
 * Helper: Get current user role
 */
export const getCurrentRole = (): UserRole | null => {
  const user = getStoredUser();
  return user?.role || null;
};