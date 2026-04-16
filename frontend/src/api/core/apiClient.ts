export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const AUTH_ENDPOINTS = ['/auth/login', '/auth/firebase'];

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

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
      // Wrong credentials on login – surface the server message in the form, no redirect.
      throw new Error(msg || 'Invalid email or password. Please try again.');
    }

    // Real session expiry: clean up and redirect to login with a reason flag.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login?reason=expired';
    throw new Error('Your session has expired. Please log in again.');
  }

  throw new Error(msg);
};

/** Centralized fetch wrapper to DRY up API calls */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });
  if (!res.ok) await handleApiError(res, endpoint);
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}