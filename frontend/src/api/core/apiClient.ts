export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/firebase',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// Get authentication headers with the current token
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Handle API errors and session expiry
export const handleApiError = async (
  res: Response,
  endpoint: string,
): Promise<never> => {
  const data = await res.json().catch(() => ({}));
  const rawMsg = data.message || data.error || 'An error occurred';
  const msg: string = Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg);

  if (res.status === 401) {
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => endpoint.startsWith(ep));

    if (isAuthEndpoint) {
      throw new Error(msg || 'Invalid email or password. Please try again.');
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login?reason=expired';
    throw new Error('Your session has expired. Please log in again.');
  }

  throw new Error(msg);
};

// Base fetch function for JSON requests
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    await handleApiError(res, endpoint);
  }
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json();
}

// Base fetch function for multipart/form-data requests
export async function apiFetchMultipart<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> ?? {}),
    },
  });

  if (!res.ok) {
    await handleApiError(res, endpoint);
  }
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json();
}