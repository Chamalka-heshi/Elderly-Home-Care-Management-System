import { apiFetch } from '../core/apiClient';
import type { Payment } from './payment.types';

// Get pending bank-transfer payments
export const getPendingPayments = () =>
  apiFetch<{ payments: Payment[]; total: number }>('/payments/pending');

// Get all payment records
export const getAllPayments = () =>
  apiFetch<{ payments: Payment[]; total: number }>('/payments/all');

// Approve a bank transfer payment
export const approvePayment = (id: string) =>
  apiFetch<{ message: string; payment: Payment }>(`/payments/${id}/approve`, {
    method: 'PATCH',
  });

// Reject a bank transfer payment
export const rejectPayment = (id: string) =>
  apiFetch<{ message: string; payment: Payment }>(`/payments/${id}/reject`, {
    method: 'PATCH',
  });
