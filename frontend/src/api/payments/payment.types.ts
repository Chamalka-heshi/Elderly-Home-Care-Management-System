// Payment method types
export type PaymentMethod = 'card' | 'bank_transfer';

// Payment status types
export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'pending_approval'
  | 'rejected';

// User details in payment records
export interface PaymentUser {
  id: string;
  user: {
    fullName: string;
    email: string;
  };
}

// Care plan details in payment records
export interface PaymentBookingSnapshot {
  name: string;
  price: number;
  duration: number;
  durationUnit: string;
}

// Booking details in payment records
export interface PaymentBooking {
  id: string;
  status: string;
  carePlanSnapshot: PaymentBookingSnapshot | null;
  patient?: {
    fullName: string;
  };
}

// Appointment details in payment records
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

// Main payment record structure
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
