import { apiFetch } from '../core/apiClient';
import type { ChannelingSlot } from './channeling.types';

// Create a new channeling slot
export const createChannelingSlot = (data: any) =>
  apiFetch<ChannelingSlot>('/channeling-slots/admin', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Get all channeling slots
export const getChannelingSlots = () =>
  apiFetch<{ slots: ChannelingSlot[]; total: number }>('/channeling-slots/admin');

// Update an existing channeling slot
export const updateChannelingSlot = (id: string, data: any) =>
  apiFetch<ChannelingSlot>(`/channeling-slots/admin/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Cancel a channeling slot
export const cancelChannelingSlot = (id: string) =>
  apiFetch<{ message: string }>(`/channeling-slots/admin/${id}/cancel`, {
    method: 'PATCH',
  });

// Delete a channeling slot
export const deleteChannelingSlot = (id: string) =>
  apiFetch<{ message: string }>(`/channeling-slots/admin/${id}`, {
    method: 'DELETE',
  });