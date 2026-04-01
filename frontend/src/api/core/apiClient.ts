export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const handleApiError = async (res: Response): Promise<never> => {
  const data = await res.json().catch(() => ({}));
  const msg = data.message || data.error || 'An error occurred';
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
};

/** Centralized fetch wrapper to DRY up API calls */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });
  if (!res.ok) await handleApiError(res);
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}