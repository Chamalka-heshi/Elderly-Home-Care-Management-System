import { apiFetch } from '../core/apiClient';
export const getDashboardStats = () => apiFetch<any>('/admin/dashboard/stats');