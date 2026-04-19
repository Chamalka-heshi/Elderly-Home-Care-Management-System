import { apiFetch } from '../core/apiClient';
import type { Appointment } from './appointment.types';

export const createAppointment = (data: {
  slotId: string;
  patientId: string;
  notes?: string;
}) => apiFetch<Appointment>('/family/appointments', { method: 'POST', body: JSON.stringify(data) });

export const getMyAppointments = () =>
  apiFetch<Appointment[]>('/family/appointments');

export const cancelMyAppointment = (id: string) =>
  apiFetch<{ message: string }>(`/family/appointments/${id}/cancel`, { method: 'PATCH' });