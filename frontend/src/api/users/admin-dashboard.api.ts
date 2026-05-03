import { apiFetch } from '../core/apiClient';

// Get high-level statistics for the admin dashboard
export const getDashboardStats = () =>
  apiFetch<any>('/admin/dashboard/stats');