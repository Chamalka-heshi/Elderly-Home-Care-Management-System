import { apiFetch } from '../core/apiClient';
import type { ChannelingSlot } from './channeling.types';

export const createChannelingSlot = (data: any) => apiFetch<ChannelingSlot>('/channeling-slots/admin', { method: 'POST', body: JSON.stringify(data) });
export const getChannelingSlots = (params: any = {}) => {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as any).toString();
  return apiFetch<{ slots: ChannelingSlot[]; total: number }>(`/channeling-slots/admin${qs ? `?${qs}` : ''}`);
};
export const getChannelingSlot = (id: string) => apiFetch<ChannelingSlot>(`/channeling-slots/admin/${id}`);
export const getDoctorWeeklySchedule = (id: string) => apiFetch<Record<string, string[]>>(`/channeling-slots/admin/doctor/${id}/weekly`);
export const updateChannelingSlot = (id: string, data: any) => apiFetch<ChannelingSlot>(`/channeling-slots/admin/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const cancelChannelingSlot = (id: string) => apiFetch<{ message: string }>(`/channeling-slots/admin/${id}/cancel`, { method: 'PATCH' });
export const deleteChannelingSlot = (id: string) => apiFetch<{ message: string }>(`/channeling-slots/admin/${id}`, { method: 'DELETE' });