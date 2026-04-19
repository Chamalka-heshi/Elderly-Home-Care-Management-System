import { apiFetch } from '../core/apiClient';
import type { Appointment, AppointmentStatus } from './appointment.types';

export type { Appointment, AppointmentStatus };

export const getDoctorAppointments = () =>
  apiFetch<Appointment[]>('/appointments/doctor');

export const updateAppointmentStatusDoctor = (
  id: string,
  status: AppointmentStatus,
  notes?: string,
) =>
  apiFetch<Appointment>(`/appointments/doctor/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(notes !== undefined ? { notes } : {}) }),
  });