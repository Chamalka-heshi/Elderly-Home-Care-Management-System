export type AppointmentBookingStatus = 'pending_payment' | 'confirmed' | 'cancelled';

export interface AppointmentBooking {
  id: string;
  userId: string;
  patientId: string;
  doctorId: string | null;
  caregiverId: string | null;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentBookingStatus;
  createdAt: string;
  updatedAt: string;
}

