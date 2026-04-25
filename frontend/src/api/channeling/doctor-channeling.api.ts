import { apiFetch } from '../core/apiClient';
import type { ChannelingSlot } from './channeling.types';
import type { Doctor } from '../users/user.types';

export const getMySlots = () => apiFetch<ChannelingSlot[]>('/channeling-slots/my-slots');
export const acceptChannelingSlot = (id: string) => apiFetch<ChannelingSlot>(`/channeling-slots/my-slots/${id}/accept`, { method: 'PATCH' });
export const rejectChannelingSlot = (id: string) => apiFetch<ChannelingSlot>(`/channeling-slots/my-slots/${id}/reject`, { method: 'PATCH' });

/** Doctor updates their consultation fee for a specific assigned slot. */
export const updateSlotConsultationFee = (id: string, consultationFee: number) =>
  apiFetch<ChannelingSlot>(`/channeling-slots/my-slots/${id}/fee`, {
    method: 'PATCH',
    body: JSON.stringify({ consultationFee }),
  });

export const setDoctorAvailability = (data: { availableDays: string[], availableTimeStart: string, availableTimeEnd: string }) => 
  apiFetch<Doctor>('/doctors/me/availability', { method: 'PATCH', body: JSON.stringify(data) });