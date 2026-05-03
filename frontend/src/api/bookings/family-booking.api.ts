import { apiFetch } from '../core/apiClient';
import type { Booking } from './booking.types';

// Create a new care plan booking
export const createBooking = (data: {
  carePlanId: string;
  patientId: string;
}) =>
  apiFetch<{ message: string; booking: Booking }>('/bookings/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Get all bookings for the current user
export const getMyBookings = () =>
  apiFetch<{ bookings: Booking[]; total: number }>('/bookings/my');
