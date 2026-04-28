import { apiFetch } from '../core/apiClient';
import type { Payment, PaymentMethod } from './payment.types';

// Submit payments for care plans or appointments to finalize bookings and clinical sessions
export const createPayment = (data: {
  bookingId?: string;
  appointmentId?: string;
  paymentMethod: PaymentMethod;
}) =>
  apiFetch<{ message: string; payment: Payment }>('/payments/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Retrieve the family's transaction history to track healthcare spending and verification status
export const getMyPayments = () =>
  apiFetch<{ payments: Payment[]; total: number }>('/payments/my');
