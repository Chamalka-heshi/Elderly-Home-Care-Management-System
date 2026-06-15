export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/firebase', '/auth/forgot-password', '/auth/reset-password'];
const BOOTSTRAP_ENDPOINT = '/auth/profile';
const CSRF_TOKEN_KEY = 'csrf-token';

// Syncs the csrf_token cookie (set by the backend as non-HttpOnly) into sessionStorage on every page load.
// This ensures the CSRF token survives page refreshes where sessionStorage is cleared but the cookie persists.
(() => {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  if (match) sessionStorage.setItem(CSRF_TOKEN_KEY, decodeURIComponent(match[1]));
})();

// Returns the stored CSRF token from sessionStorage.
export const getCsrfToken = (): string | null => sessionStorage.getItem(CSRF_TOKEN_KEY);

// Saves the CSRF token to sessionStorage.
export const setCsrfToken = (token: string): void => sessionStorage.setItem(CSRF_TOKEN_KEY, token);

// Returns JSON request headers with the CSRF token injected when available.
export const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const csrfToken = getCsrfToken();
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  return headers;
};

// Parses a failed response and throws an error; redirects to /login on mid-session 401s.
export const handleApiError = async (res: Response, endpoint: string): Promise<never> => {
  const data = await res.json().catch(() => ({}));
  const rawMsg = data.message || data.error || 'An error occurred';
  const msg: string = Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg);

  if (res.status === 401) {
    if (AUTH_ENDPOINTS.some((ep) => endpoint.startsWith(ep))) throw new Error(msg || 'Invalid email or password. Please try again.');
    if (endpoint.startsWith(BOOTSTRAP_ENDPOINT)) throw new Error(msg || 'Session not found.');

    sessionStorage.removeItem(CSRF_TOKEN_KEY);
    window.location.href = '/login?reason=expired';
    throw new Error('Your session has expired. Please log in again.');
  }

  throw new Error(msg);
};

// Sends a JSON request with credentials and CSRF token; handles errors and empty 204 responses.
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: { ...getAuthHeaders(), ...options.headers },
  });
  if (!res.ok) await handleApiError(res, endpoint);
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// Sends a multipart/form-data request with credentials and CSRF token (used for file uploads).
export async function apiFetchMultipart<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const csrfToken = getCsrfToken();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: { ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}), ...(options.headers as Record<string, string> ?? {}) },
  });
  if (!res.ok) await handleApiError(res, endpoint);
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}