import { apiFetch } from '../core/apiClient';
import type { Booking } from './booking.types';

export const getAllBookings = async (): Promise<Booking[]> => {
  const data = await apiFetch<{ bookings: Booking[]; total: number }>('/bookings/all');
  return data.bookings;
};