import { apiFetch } from '../core/apiClient';
import type { Appointment, AppointmentStatus } from './appointment.types';

// Fetch doctor-specific appointments to allow practitioners to manage their daily patient load
export const getDoctorAppointments = () =>
  apiFetch<Appointment[]>('/appointments/doctor');

// Transition appointment states to track the patient's journey from confirmation to completion
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
