// Status options for care plan bookings to track the payment and activation lifecycle
export type BookingStatus = 'pending_payment' | 'active' | 'cancelled';

// Snapshot of care plan details at the time of booking to ensure historical billing accuracy
export interface CarePlanSnapshot {
  name: string;
  price: number;
  duration: number;
  durationUnit: 'days' | 'months';
}

// Booking record to link patients with care plans and manage subscription status
export interface Booking {
  id: string;
  userId: string;
  patientId: string;
  carePlanId: string;
  status: BookingStatus;
  carePlanSnapshot: CarePlanSnapshot;
  createdAt: string;
  updatedAt: string;
  user?: any;
  patient?: any;
}