import { apiFetch } from '../core/apiClient';
import type { Doctor } from './user.types';

export const getMyDoctorProfile = () => apiFetch<Doctor>('/doctors/me');
export const setDoctorAvailability = (data: { availableDays: string[], availableTimeStart: string, availableTimeEnd: string }) => 
  apiFetch<Doctor>('/doctors/me/availability', { method: 'PATCH', body: JSON.stringify(data) });