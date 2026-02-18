import type { User, UserRole } from '../auth/AuthContext';

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

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Family Member Signup
 * ROUTE: POST /api/auth/family/signup
 */
export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/family/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(responseData.message || responseData.error || 'Signup failed');
    }

    if (!responseData.token || !responseData.user) {
      throw new Error('Invalid response from server');
    }

    localStorage.setItem('token', responseData.token);
    localStorage.setItem('user', JSON.stringify(responseData.user));

    return responseData as SignupResponse;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please ensure the backend is running.');
    }
    throw error;
  }
};

/**
 * Universal Sign In
 * ROUTE: POST /api/auth/login
 */
export const signin = async (data: SigninRequest): Promise<SigninResponse> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(responseData.message || responseData.error || 'Signin failed');
    }

    if (!responseData.token || !responseData.user) {
      throw new Error('Invalid response from server');
    }

    localStorage.setItem('token', responseData.token);
    localStorage.setItem('user', JSON.stringify(responseData.user));

    return responseData as SigninResponse;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please ensure the backend is running.');
    }
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
    console.error('Signout error:', err);
  }
};

/**
 * Delete Account
 * ROUTE: DELETE /api/auth/delete-account
 */
export const deleteAccount = async (): Promise<{ message: string }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const res = await fetch(`${API_BASE_URL}/auth/delete-account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to delete account');
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    return { message: data.message || 'Account deleted successfully' };
  } catch (error) {
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
    if (!token) throw new Error('No authentication token found');

    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const responseData = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(responseData.message || responseData.error || 'Failed to fetch profile');
    }

    return responseData as User;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please ensure the backend is running.');
    }
    throw error;
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

export const hasRole = (role: UserRole): boolean => {
  const user = getStoredUser();
  return user?.role === role;
};

export const getCurrentRole = (): UserRole | null => {
  const user = getStoredUser();
  return user?.role ?? null;
};