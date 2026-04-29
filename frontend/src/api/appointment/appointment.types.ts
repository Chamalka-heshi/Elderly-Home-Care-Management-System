// Single source of truth for all appointment-related data structures to ensure consistency across the platform
export type AppointmentStatus =
  | 'pending_payment'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

// Patient data relevant to appointments to provide clinicians and admins with necessary medical context
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

// Channeling slot details to define the time and practitioner for medical consultations
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

// Full appointment record to track the relationship between patients, practitioners, and family members
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

// Formatting helpers
// Convert 24-hour time to a user-friendly 12-hour format for display in schedules
export const fmt12 = (hhmm: string): string => {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// Format ISO date strings into a readable localized format for consistent presentation
export const fmtDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Status metadata
// Define visual styles for appointment statuses to provide immediate visual feedback in the UI
export const statusColor: Record<AppointmentStatus, string> = {
  pending_payment: 'bg-blue-50 text-blue-700 ring-blue-100',
  pending: 'bg-amber-50 text-amber-700 ring-amber-100',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  cancelled: 'bg-red-50 text-red-700 ring-red-100',
  completed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

// Define human-readable labels for appointment statuses to ensure clear communication with users
export const statusLabel: Record<AppointmentStatus, string> = {
  pending_payment: 'Pending Payment',
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};
