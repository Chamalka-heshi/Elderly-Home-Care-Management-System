import { apiFetch } from '../core/apiClient';
import type { Payment, PaymentMethod, PayHereCheckoutResponse } from './payment.types';

// Create a new payment record
export const createPayment = (data: {
  bookingId?: string;
  appointmentId?: string;
  paymentMethod: PaymentMethod;
}) =>
  apiFetch<{ message: string; payment: Payment }>('/payments/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Prepare PayHere checkout for a booking or appointment payment
export const initiatePayHerePayment = (data: {
  bookingId?: string;
  appointmentId?: string;
}) =>
  apiFetch<PayHereCheckoutResponse>('/payments/payhere/initiate', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Get all payments for the current user
export const getMyPayments = () =>
  apiFetch<{ payments: Payment[]; total: number }>('/payments/my');
