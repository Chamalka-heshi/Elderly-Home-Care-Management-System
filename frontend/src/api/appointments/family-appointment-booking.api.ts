import { apiFetch } from '../core/apiClient';
import type { AppointmentBooking } from './appointment-booking.types';

export const createAppointmentBooking = (data: {
  patientId: string;
  appointmentDate: string;
  appointmentTime: string;
}) =>
  apiFetch<{ message: string; appointment: AppointmentBooking }>('/appointments/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getMyAppointmentBookings = () =>
  apiFetch<AppointmentBooking[]>('/appointments/my');

