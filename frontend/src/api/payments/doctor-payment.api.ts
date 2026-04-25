/**
 * src/api/payments/doctor-payment.api.ts
 * ─────────────────────────────────────────
 * Payment API calls available to doctors.
 * Returns only doctor-appointment payments (no care-plan / care-home fees).
 */
import { apiFetch } from '../core/apiClient';

export type DoctorPaymentStatus = 'pending' | 'paid' | 'pending_approval' | 'rejected';
export type DoctorPaymentMethod = 'card' | 'bank_transfer';

export interface DoctorPaymentSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export interface DoctorPaymentRecord {
  id: string;
  appointmentId: string;
  /** Total amount paid (consultationFee + careHomeFee). */
  amount: number;
  /** Doctor's own consultation fee — the income the doctor earns. */
  consultationFee: number;
  /** Care-home service charge — NOT counted as the doctor's income. */
  careHomeFee: number;
  paymentMethod: DoctorPaymentMethod;
  status: DoctorPaymentStatus;
  createdAt: string;
  updatedAt: string;
  familyMember: {
    id: string;
    fullName: string;
    email: string;
  };
  patient: {
    id: string;
    fullName: string;
  };
  slot: DoctorPaymentSlot;
}

export interface DoctorPaymentsResponse {
  payments: DoctorPaymentRecord[];
  total: number;
  /** Sum of consultationFee for all PAID payments. */
  totalIncome: number;
}

/** GET /payments/doctor — all family payments for this doctor's slots. */
export const getDoctorPayments = () =>
  apiFetch<DoctorPaymentsResponse>('/payments/doctor');