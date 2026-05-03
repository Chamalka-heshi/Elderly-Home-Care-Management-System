import { apiFetch } from '../core/apiClient';
import type { Appointment, AppointmentStatus } from './appointment.types';

// Shared appointment type
export type { Appointment } from './appointment.types';

// Get appointments for the logged-in doctor
export const getDoctorAppointments = () =>
  apiFetch<Appointment[]>('/appointments/doctor');

// Update appointment status by doctor
export const updateAppointmentStatusDoctor = (
  id: string,
  status: AppointmentStatus,
  notes?: string,
) =>
  apiFetch<Appointment>(`/appointments/doctor/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      ...(notes !== undefined ? { notes } : {}),
    }),
  });
