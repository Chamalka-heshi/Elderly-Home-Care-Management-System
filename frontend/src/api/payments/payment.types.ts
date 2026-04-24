export type PaymentMethod = 'card' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'pending_approval' | 'rejected';

export interface Payment {
  id: string;
  bookingId?: string | null;
  appointmentId?: string | null;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}
