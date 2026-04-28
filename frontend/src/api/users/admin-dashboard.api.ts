import { apiFetch } from '../core/apiClient';

// Retrieve high-level facility metrics to provide admins with a real-time overview of operations
export const getDashboardStats = () =>
  apiFetch<any>('/admin/dashboard/stats');