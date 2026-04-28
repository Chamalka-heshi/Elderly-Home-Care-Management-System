import { apiFetch } from '../core/apiClient';
import type { ChannelingSlot } from './channeling.types';

// Generate new channeling slots to open doctor availability for patient bookings
export const createChannelingSlot = (data: any) =>
  apiFetch<ChannelingSlot>('/channeling-slots/admin', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Retrieve channeling slots with filters to monitor and manage the facility's channeling schedule
export const getChannelingSlots = (params: any = {}) => {
  const filteredParams = Object.entries(params)
    .filter(([, value]) => value !== undefined);

  const queryParams = new URLSearchParams(Object.fromEntries(filteredParams) as any);
  const queryString = queryParams.toString();

  const url = `/channeling-slots/admin${queryString ? `?${queryString}` : ''}`;

  return apiFetch<{ slots: ChannelingSlot[]; total: number }>(url);
};

// Get specific slot details to support administrative review and conflict resolution
export const getChannelingSlot = (id: string) =>
  apiFetch<ChannelingSlot>(`/channeling-slots/admin/${id}`);

// Fetch weekly schedules for doctors to assist in clinical resource planning and allocation
export const getDoctorWeeklySchedule = (id: string) =>
  apiFetch<Record<string, string[]>>(`/channeling-slots/admin/doctor/${id}/weekly`);

// Modify existing slots to handle changes in doctor availability or clinic requirements
export const updateChannelingSlot = (id: string, data: any) =>
  apiFetch<ChannelingSlot>(`/channeling-slots/admin/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Void slots temporarily to handle immediate doctor unavailability without full deletion
export const cancelChannelingSlot = (id: string) =>
  apiFetch<{ message: string }>(`/channeling-slots/admin/${id}/cancel`, {
    method: 'PATCH',
  });

// Remove slot records permanently to maintain a clean scheduling database for future cycles
export const deleteChannelingSlot = (id: string) =>
  apiFetch<{ message: string }>(`/channeling-slots/admin/${id}`, {
    method: 'DELETE',
  });