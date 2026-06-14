export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Endpoints where a 401 is an expected login failure, not a session expiry.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/firebase', '/auth/forgot-password', '/auth/reset-password'];

// Bootstrap endpoint — a 401 here means no cookie exists, not an expiry.
const BOOTSTRAP_ENDPOINT = '/auth/profile';

const CSRF_TOKEN_KEY = 'csrf-token';

// Returns the stored CSRF token from sessionStorage.
export const getCsrfToken = (): string | null => sessionStorage.getItem(CSRF_TOKEN_KEY);

// Persists the CSRF token received after login.
export const setCsrfToken = (token: string): void => sessionStorage.setItem(CSRF_TOKEN_KEY, token);

// Builds JSON request headers, injecting the CSRF token when present.
export const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const csrfToken = getCsrfToken();
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  return headers;
};

// Parses a non-OK response and throws; redirects to /login?reason=expired on mid-session 401s.
export const handleApiError = async (res: Response, endpoint: string): Promise<never> => {
  const data = await res.json().catch(() => ({}));
  const rawMsg = data.message || data.error || 'An error occurred';
  const msg: string = Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg);

  if (res.status === 401) {
    if (AUTH_ENDPOINTS.some((ep) => endpoint.startsWith(ep))) throw new Error(msg || 'Invalid email or password. Please try again.');
    if (endpoint.startsWith(BOOTSTRAP_ENDPOINT)) throw new Error(msg || 'Session not found.');

    // Mid-session expiry — clear CSRF and hard-navigate to login with expired banner.
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
    window.location.href = '/login?reason=expired';
    throw new Error('Your session has expired. Please log in again.');
  }

  throw new Error(msg);
};

// Sends a JSON fetch with credentials; handles errors and empty 204 responses.
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

// Sends a multipart/form-data fetch with credentials (e.g. file uploads).
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