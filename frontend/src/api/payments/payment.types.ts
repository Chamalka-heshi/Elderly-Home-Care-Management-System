/**
 * src/api/payments/payment.types.ts
 * ───────────────────────────────────
 * Payment entity types — mirrors the fixed backend Payment entity exactly.
 * A payment row links to EITHER a care-plan booking OR a doctor appointment
 * (exactly one of bookingId / appointmentId is set).
 */

export type PaymentMethod = 'card' | 'bank_transfer';

export type PaymentStatus =
  | 'pending'          // initial state (unused currently — always jumps to one below)
  | 'paid'             // card: immediately paid; bank_transfer: after admin approval
  | 'pending_approval' // bank_transfer submitted, waiting for admin
  | 'rejected';        // admin rejected the bank-transfer

export interface PaymentUser {
  id: string;
  user: {
    fullName: string;
    email: string;
  };
}

export interface PaymentBookingSnapshot {
  name: string;
  price: number;
  duration: number;
  durationUnit: string;
}

export interface PaymentBooking {
  id: string;
  status: string;
  carePlanSnapshot: PaymentBookingSnapshot | null;
  patient?: { fullName: string };
}

export interface PaymentAppointment {
  id: string;
  status: string;
  prescriptionId: string | null;
  patient?: { fullName: string; gender?: string };
  slot?: {
    date: string;
    startTime: string;
    endTime: string;
    consultationFee: number | null;
    careHomeFee: number | null;
    doctor?: { specialization: string; user: { fullName: string } };
  };
}

export interface Payment {
  id: string;
  /** Set for care-plan booking payments; null for appointment payments. */
  bookingId: string | null;
  /** Set for doctor appointment payments; null for booking payments. */
  appointmentId: string | null;
  /** FamilyMember.id (not User.id). */
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  /** Populated when fetched via admin endpoints */
  user?: PaymentUser;
  booking?: PaymentBooking | null;
  appointment?: PaymentAppointment | null;
}