import { apiFetch } from '../core/apiClient';
import type { AuthResponse } from './auth.api';

// Register new family accounts to enable family members to manage patient care and billing
export const signupFamily = async (data: any): Promise<AuthResponse> => {
  const res = await apiFetch<AuthResponse>('/auth/family/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  localStorage.setItem('token', res.token);
  localStorage.setItem('user', JSON.stringify(res.user));
  return res;
};