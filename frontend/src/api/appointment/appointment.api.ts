import { apiFetch } from '../core/apiClient';
import type { Appointment } from './appointment.types';

export type { Appointment, AppointmentStatus } from './appointment.types';

// Reserve channeling slots to enable family members to book clinical sessions for patients
export const createAppointment = (data: {
  slotId: string;
  patientId: string;
  notes?: string;
}) =>
  apiFetch<Appointment>('/family/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Retrieve family-specific bookings to allow users to track their upcoming health consultations
export const getMyAppointments = () =>
  apiFetch<Appointment[]>('/family/appointments');

// Void existing appointments to allow family members to cancel bookings when no longer needed
export const cancelMyAppointment = (id: string) =>
  apiFetch<{ message: string }>(`/family/appointments/${id}/cancel`, {
    method: 'PATCH',
  });
