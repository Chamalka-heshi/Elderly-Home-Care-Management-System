/**
 * src/api/payments/admin-payment.api.ts
 * ───────────────────────────────────────
 * Payment API calls available to admins / super-admins.
 */
import { apiFetch } from '../core/apiClient';
import type { Payment } from './payment.types';

/** Get all bank-transfer payments currently awaiting approval. */
export const getPendingPayments = () =>
  apiFetch<{ payments: Payment[]; total: number }>('/payments/pending');

/** Get all payments (full history) — admin only. */
export const getAllPayments = () =>
  apiFetch<{ payments: Payment[]; total: number }>('/payments/all');

/**
 * Approve a pending bank-transfer payment.
 * Side-effects on backend:
 *   - booking payment  → sets Booking.status = ACTIVE
 *   - appointment pay  → sets Appointment.status = PENDING (awaiting doctor confirmation)
 */
export const approvePayment = (id: string) =>
  apiFetch<{ message: string; payment: Payment }>(`/payments/${id}/approve`, {
    method: 'PATCH',
  });

/**
 * Reject a pending bank-transfer payment.
 * Side-effects on backend:
 *   - booking payment  → sets Booking.status = CANCELLED
 *   - appointment pay  → sets Appointment.status = CANCELLED
 */
export const rejectPayment = (id: string) =>
  apiFetch<{ message: string; payment: Payment }>(`/payments/${id}/reject`, {
    method: 'PATCH',
  });