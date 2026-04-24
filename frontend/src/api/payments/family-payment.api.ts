import { apiFetch } from '../core/apiClient';
import type { Payment, PaymentMethod } from './payment.types';

export const createPayment = (data: {
  bookingId?: string;
  appointmentId?: string;
  paymentMethod: PaymentMethod;
}) =>
  apiFetch<{ message: string; payment: Payment }>('/payments/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getMyPayments = () =>
  apiFetch<{ payments: Payment[]; total: number }>('/payments/my');
