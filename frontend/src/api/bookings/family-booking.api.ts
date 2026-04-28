import { apiFetch } from '../core/apiClient';
import type { Booking } from './booking.types';

// Register a new care plan subscription to enable specialized long-term services for a patient
export const createBooking = (data: {
  carePlanId: string;
  patientId: string;
}) =>
  apiFetch<{ message: string; booking: Booking }>('/bookings/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Retrieve all active and past care plan subscriptions to track patient coverage and service history
export const getMyBookings = () =>
  apiFetch<{ bookings: Booking[]; total: number }>('/bookings/my');
