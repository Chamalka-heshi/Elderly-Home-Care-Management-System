export type BookingStatus = 'pending_payment' | 'active' | 'cancelled';

export interface CarePlanSnapshot {
  name: string;
  price: number;
  duration: number;
  durationUnit: 'days' | 'months';
}

export interface Booking {
  id: string;
  userId: string;
  patientId: string;
  carePlanId: string;
  status: BookingStatus;
  carePlanSnapshot: CarePlanSnapshot;
  createdAt: string;
  updatedAt: string;
}
