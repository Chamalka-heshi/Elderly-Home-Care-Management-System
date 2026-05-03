import { apiFetch } from '../core/apiClient';
import type { Appointment, AppointmentStatus } from './appointment.types';

// Retrieve appointments with filters
export const getAllAppointmentsAdmin = (params?: {
  status?: AppointmentStatus;
  patientId?: string;
  doctorId?: string;
}) => {
  const queryParams = new URLSearchParams();

  if (params?.status) {
    queryParams.set('status', params.status);
  }
  if (params?.patientId) {
    queryParams.set('patientId', params.patientId);
  }
  if (params?.doctorId) {
    queryParams.set('doctorId', params.doctorId);
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return apiFetch<Appointment[]>(`/appointments/admin${queryString}`);
};

// Update appointment status
export const updateAppointmentStatusAdmin = (
  id: string,
  status: AppointmentStatus,
  notes?: string,
) =>
  apiFetch<{ message: string }>(`/appointments/admin/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      ...(notes !== undefined ? { notes } : {}),
    }),
  });

// Delete appointment record
export const deleteAppointmentAdmin = (id: string) =>
  apiFetch<{ message: string }>(`/appointments/admin/${id}`, {
    method: 'DELETE',
  });
