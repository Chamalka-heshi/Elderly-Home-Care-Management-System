import { apiFetch } from '../core/apiClient';
import type { ChannelingSlot } from './channeling.types';
import type { Doctor } from '../users/user.types';

// Fetch slots to allow doctors to manage their availability and schedules
export const getMySlots = () =>
  apiFetch<ChannelingSlot[]>('/channeling-slots/my-slots');

// Accept a slot to confirm a doctor's availability for a specific patient request
export const acceptChannelingSlot = (id: string) =>
  apiFetch<ChannelingSlot>(`/channeling-slots/my-slots/${id}/accept`, {
    method: 'PATCH',
  });

// Reject a slot to notify the system and patient that the doctor is unavailable
export const rejectChannelingSlot = (id: string) =>
  apiFetch<ChannelingSlot>(`/channeling-slots/my-slots/${id}/reject`, {
    method: 'PATCH',
  });

// Update the consultation fee to ensure the doctor can adjust pricing for specific sessions
export const updateSlotConsultationFee = (id: string, consultationFee: number) =>
  apiFetch<ChannelingSlot>(`/channeling-slots/my-slots/${id}/fee`, {
    method: 'PATCH',
    body: JSON.stringify({ consultationFee }),
  });

// Configure availability to define the doctor's working hours and weekly schedule
export const setDoctorAvailability = (data: {
  availableDays: string[];
  availableTimeStart: string;
  availableTimeEnd: string;
}) =>
  apiFetch<Doctor>('/doctors/me/availability', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });