// Payment channel options for settling facility and practitioner fees
export type PaymentMethod = 'card' | 'bank_transfer';

// Transaction states to track the lifecycle of payments from submission to verification
export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'pending_approval'
  | 'rejected';

// User structure for payment records to link transactions with specific family members
export interface PaymentUser {
  id: string;
  user: {
    fullName: string;
    email: string;
  };
}

// Snapshot of care plan details to ensure financial records reflect the state at the time of purchase
export interface PaymentBookingSnapshot {
  name: string;
  price: number;
  duration: number;
  durationUnit: string;
}

// Booking reference for payments to track revenue from long-term care plans
export interface PaymentBooking {
  id: string;
  status: string;
  carePlanSnapshot: PaymentBookingSnapshot | null;
  patient?: {
    fullName: string;
  };
}

// Appointment reference for payments to track revenue from clinical sessions and practitioner fees
export interface PaymentAppointment {
  id: string;
  status: string;
  prescriptionId: string | null;
  patient?: {
    fullName: string;
    gender?: string;
  };
  slot?: {
    date: string;
    startTime: string;
    endTime: string;
    consultationFee: number | null;
    careHomeFee: number | null;
    doctor?: {
      specialization: string;
      user: {
        fullName: string;
      };
    };
  };
}

// Central payment record to manage the facility's financial interactions with users and practitioners
export interface Payment {
  id: string;
  bookingId: string | null;
  appointmentId: string | null;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  user?: PaymentUser;
  booking?: PaymentBooking | null;
  appointment?: PaymentAppointment | null;
}
