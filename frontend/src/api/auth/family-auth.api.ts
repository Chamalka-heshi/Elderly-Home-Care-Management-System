import { apiFetch } from '../core/apiClient';
import type { AuthResponse } from './auth.api';

export const signupFamily = async (data: any): Promise<AuthResponse> => {
  const res = await apiFetch<AuthResponse>('/auth/family/signup', { method: 'POST', body: JSON.stringify(data) });
  localStorage.setItem('token', res.token);
  localStorage.setItem('user', JSON.stringify(res.user));
  return res;
};