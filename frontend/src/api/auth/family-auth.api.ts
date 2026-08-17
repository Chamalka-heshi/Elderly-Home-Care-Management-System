import { apiFetch, setCsrfToken } from '../core/apiClient';
import type { AuthResponse } from './auth.api';

const storeCsrfTokenFromResponse = (res: AuthResponse): void => {
  if (res.csrfToken) setCsrfToken(res.csrfToken);
  else {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    if (match) setCsrfToken(decodeURIComponent(match[1]));
  }
};

// Registers a new family account and stores the CSRF token from the response.
export const signupFamily = async (data: any): Promise<AuthResponse> => {
  const res = await apiFetch<AuthResponse>('/auth/family/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  storeCsrfTokenFromResponse(res);
  return res;
};