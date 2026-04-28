import { apiFetch } from '../core/apiClient';
import type { Payment } from './payment.types';

// Retrieve pending bank-transfer payments to allow admins to verify and approve incoming funds
export const getPendingPayments = () =>
  apiFetch<{ payments: Payment[]; total: number }>('/payments/pending');

// Fetch the complete payment history to support financial auditing and revenue tracking
export const getAllPayments = () =>
  apiFetch<{ payments: Payment[]; total: number }>('/payments/all');

// Verify and approve manual bank transfers to finalize patient bookings and activate services
export const approvePayment = (id: string) =>
  apiFetch<{ message: string; payment: Payment }>(`/payments/${id}/approve`, {
    method: 'PATCH',
  });

// Reject invalid or unconfirmed payment proof to maintain the integrity of the facility's billing system
export const rejectPayment = (id: string) =>
  apiFetch<{ message: string; payment: Payment }>(`/payments/${id}/reject`, {
    method: 'PATCH',
  });
