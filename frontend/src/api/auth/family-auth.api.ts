import { apiFetch, setCsrfToken } from '../core/apiClient';
import type { AuthResponse }      from './auth.api';

// Register a new family account
export const signupFamily = async (data: any): Promise<AuthResponse> => {
  const res = await apiFetch<AuthResponse>('/auth/family/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store CSRF token for subsequent state-changing requests
  if (res.csrfToken) {
    setCsrfToken(res.csrfToken);
  }

  // JWT is delivered via HttpOnly cookie — nothing to store client-side.
  return res;
};