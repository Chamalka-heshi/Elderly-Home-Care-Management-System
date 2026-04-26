/**
 * src/api/payments/family-payment.api.ts
 * ────────────────────────────────────────
 * Payment API calls available to family members.
 */
import { apiFetch } from '../core/apiClient';
import type { Payment, PaymentMethod } from './payment.types';

/**
 * Submit a payment for either a care-plan booking OR a doctor appointment.
 * Provide exactly one of bookingId / appointmentId, never both.
 *
 * - paymentMethod = 'card'          → instantly marks booking/appointment as paid/active
 * - paymentMethod = 'bank_transfer' → creates a pending_approval record; admin must approve
 */
export const createPayment = (data: {
  bookingId?: string;
  appointmentId?: string;
  paymentMethod: PaymentMethod;
}) =>
  apiFetch<{ message: string; payment: Payment }>('/payments/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });

/** Get all payments made by the current family member. */
export const getMyPayments = () =>
  apiFetch<{ payments: Payment[]; total: number }>('/payments/my');