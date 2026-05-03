import { apiFetch } from '../core/apiClient';
import type { ChannelingSlot } from './channeling.types';
import type { Doctor } from '../users/user.types';

// Get slots for the logged-in doctor
export const getMySlots = () =>
  apiFetch<ChannelingSlot[]>('/channeling-slots/my-slots');

// Accept a channeling slot
export const acceptChannelingSlot = (id: string) =>
  apiFetch<ChannelingSlot>(`/channeling-slots/my-slots/${id}/accept`, {
    method: 'PATCH',
  });

// Reject a channeling slot
export const rejectChannelingSlot = (id: string) =>
  apiFetch<ChannelingSlot>(`/channeling-slots/my-slots/${id}/reject`, {
    method: 'PATCH',
  });

// Update consultation fee for a slot
export const updateSlotConsultationFee = (id: string, consultationFee: number) =>
  apiFetch<ChannelingSlot>(`/channeling-slots/my-slots/${id}/fee`, {
    method: 'PATCH',
    body: JSON.stringify({ consultationFee }),
  });

// Set doctor availability and working hours
export const setDoctorAvailability = (data: {
  availableDays: string[];
  availableTimeStart: string;
  availableTimeEnd: string;
}) =>
  apiFetch<Doctor>('/doctors/me/availability', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });