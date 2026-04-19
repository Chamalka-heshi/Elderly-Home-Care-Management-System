import { apiFetch } from '../core/apiClient';
import type { Appointment, AppointmentStatus } from './appointment.types';

export const getAllAppointmentsAdmin = (params?: {
  status?: AppointmentStatus;
  patientId?: string;
  doctorId?: string;
}) => {
  const qs = new URLSearchParams();
  if (params?.status)    qs.set('status',    params.status);
  if (params?.patientId) qs.set('patientId', params.patientId);
  if (params?.doctorId)  qs.set('doctorId',  params.doctorId);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<Appointment[]>(`/appointments/admin${query}`);
};

export const updateAppointmentStatusAdmin = (
  id: string,
  status: AppointmentStatus,
  notes?: string,
) =>
  apiFetch<{ message: string }>(`/appointments/admin/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(notes !== undefined ? { notes } : {}) }),
  });

export const deleteAppointmentAdmin = (id: string) =>
  apiFetch<{ message: string }>(`/appointments/admin/${id}`, { method: 'DELETE' });
