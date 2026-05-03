import { apiFetch } from '../core/apiClient';
import type { Appointment } from './appointment.types';

export type { Appointment, AppointmentStatus } from './appointment.types';

// Create a new appointment
export const createAppointment = (data: {
  slotId: string;
  patientId: string;
  notes?: string;
}) =>
  apiFetch<Appointment>('/family/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Get all appointments for the current user
export const getMyAppointments = () =>
  apiFetch<Appointment[]>('/family/appointments');

// Cancel an appointment
export const cancelMyAppointment = (id: string) =>
  apiFetch<{ message: string }>(`/family/appointments/${id}/cancel`, {
    method: 'PATCH',
  });
