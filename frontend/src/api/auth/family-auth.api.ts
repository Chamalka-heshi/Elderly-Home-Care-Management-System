import { apiFetch, setCsrfToken } from '../core/apiClient';
import type { AuthResponse } from './auth.api';

// Reads the csrf_token cookie set by the backend and saves it to sessionStorage.
const storeCsrfTokenFromCookie = (): void => {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  if (match) setCsrfToken(decodeURIComponent(match[1]));
};

// Registers a new family account and stores the CSRF token from the response cookie.
export const signupFamily = async (data: any): Promise<AuthResponse> => {
  const res = await apiFetch<AuthResponse>('/auth/family/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  storeCsrfTokenFromCookie();
  return res;
};