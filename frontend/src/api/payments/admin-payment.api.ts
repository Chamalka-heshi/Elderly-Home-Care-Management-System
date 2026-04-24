import { apiFetch } from '../core/apiClient';
import type { Payment } from './payment.types';

export const getPendingPayments = () =>
  apiFetch<{ payments: Payment[]; total: number }>('/payments/pending');

export const approvePayment = (id: string) =>
  apiFetch<{ message: string; payment: Payment }>(`/payments/${id}/approve`, {
    method: 'PATCH',
  });

export const rejectPayment = (id: string) =>
  apiFetch<{ message: string; payment: Payment }>(`/payments/${id}/reject`, {
    method: 'PATCH',
  });
