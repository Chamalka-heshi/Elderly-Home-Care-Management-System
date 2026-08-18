// Appointment data types
export type AppointmentStatus =
  | 'payment_pending'
  | 'prescription_pending'
  | 'cancelled'
  | 'completed';

// Patient details in appointment
export interface AppointmentPatient {
  id: string;
  fullName: string;
  nic: string;
  dateOfBirth: string;
  age?: number;
  gender: string;
  bloodGroup?: string;
  address?: string;
  contactNumber?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  chronicConditions?: string;
  isActive: boolean;
  paymentPlan?: string;
}

// Time slot details
export interface AppointmentSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxPatients: number;
  bookingCutoffMinutes: number;
  status: string;
  notes: string | null;
  consultationFee: number | null;
  careHomeFee: number | null;
  doctor: {
    id: string;
    specialization: string;
    user: { fullName: string; isActive: boolean };
  };
}

// Appointment record
export interface Appointment {
  id: string;
  slotId: string;
  patientId: string;
  familyMemberId: string;
  status: AppointmentStatus;
  notes: string | null;
  prescriptionId: string | null;
  createdAt: string;
  updatedAt: string;
  slot: AppointmentSlot;
  patient: AppointmentPatient;
  familyMember: {
    id: string;
    user: { fullName: string; email: string };
  };
}

// Convert to 12-hour time
export const fmt12 = (hhmm: string): string => {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// Format date string
export const fmtDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00+05:30').toLocaleDateString('en-LK', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    timeZone: 'Asia/Colombo',
  });
};

// Status styles and labels
// Status colors
export const statusColor: Record<AppointmentStatus, string> = {
  payment_pending:      'bg-blue-50 text-blue-700 ring-blue-100',
  prescription_pending: 'bg-amber-50 text-amber-700 ring-amber-100',
  cancelled:            'bg-red-50 text-red-700 ring-red-100',
  completed:            'bg-slate-100 text-slate-600 ring-slate-200',
};

// Status labels
export const statusLabel: Record<AppointmentStatus, string> = {
  payment_pending:      'Pending Payment',
  prescription_pending: 'Pending Prescription',
  cancelled:            'Cancelled',
  completed:            'Completed',
};

export const isExpiredPrescriptionPending = (
  appointment: Pick<Appointment, 'status' | 'prescriptionId' | 'slot'>,
): boolean => {
  if (appointment.status !== 'prescription_pending' || appointment.prescriptionId) return false;
  if (!appointment.slot?.date || !appointment.slot?.endTime) return false;

  const slotEnd = new Date(`${appointment.slot.date}T${appointment.slot.endTime}:00+05:30`);
  return Number.isFinite(slotEnd.getTime()) && slotEnd < new Date();
};

export const getEffectiveAppointmentStatus = (
  appointment: Pick<Appointment, 'status' | 'prescriptionId' | 'slot'>,
): AppointmentStatus =>
  isExpiredPrescriptionPending(appointment) ? 'cancelled' : appointment.status;