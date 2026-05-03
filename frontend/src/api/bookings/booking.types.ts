// Care plan booking status
export type BookingStatus = 'pending_payment' | 'active' | 'cancelled';

// Care plan details at time of booking
export interface CarePlanSnapshot {
  name: string;
  price: number;
  duration: number;
  durationUnit: 'days' | 'months';
}

// Care plan booking record
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