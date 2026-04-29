import { apiFetch } from '../core/apiClient';

export type DoctorPaymentStatus = 'paid';

export type DoctorPaymentMethod = 'card' | 'bank_transfer';

export interface DoctorPaymentSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export interface DoctorPaymentRecord {
  id: string;
  appointmentId: string;
  amount: number;
  consultationFee: number;
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
  totalIncome: number;
}

// Fetch payment records to allow doctors to track their earned income from clinical sessions
export const getDoctorPayments = () =>
  apiFetch<DoctorPaymentsResponse>('/payments/doctor');