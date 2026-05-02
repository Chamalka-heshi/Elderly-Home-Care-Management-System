import { apiFetch } from '../core/apiClient';
import type { ChannelingSlot } from './channeling.types';

// Generate new channeling slots to open doctor availability for patient bookings
export const createChannelingSlot = (data: any) =>
  apiFetch<ChannelingSlot>('/channeling-slots/admin', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Retrieve all channeling slots for administrative oversight
export const getChannelingSlots = () =>
  apiFetch<{ slots: ChannelingSlot[]; total: number }>('/channeling-slots/admin');

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