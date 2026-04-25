/**
 * src/api/appointment/appointment.types.ts
 * ─────────────────────────────────────────
 * Single source of truth for all appointment-related types.
 * Mirrors the fixed backend AppointmentStatus enum exactly.
 */

// ── Status ────────────────────────────────────────────────────────────────────
export type AppointmentStatus =
  | 'pending_payment' // family created — slot is held, waiting for payment
  | 'pending'         // paid; waiting for doctor/admin confirmation
  | 'confirmed'
  | 'cancelled'
  | 'completed';

// ── Nested shapes returned by the backend ────────────────────────────────────
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
  // Medical fields — present in doctor responses only
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  chronicConditions?: string;
  isActive: boolean;
}

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
  /** Doctor's consultation fee for this slot. */
  consultationFee: number | null;
  /** Care-home service charge set by Admin. */
  careHomeFee: number | null;
  doctor: {
    id: string;
    specialization: string;
    user: { fullName: string; isActive: boolean };
  };
}

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

// ── Formatting helpers (used by all roles) ───────────────────────────────────
export const fmt12 = (hhmm: string): string => {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const fmtDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ── Status badge colours (Tailwind utility classes) ──────────────────────────
export const statusColor: Record<AppointmentStatus, string> = {
  pending_payment: 'bg-blue-50 text-blue-700 ring-blue-100',
  pending:         'bg-amber-50 text-amber-700 ring-amber-100',
  confirmed:       'bg-emerald-50 text-emerald-700 ring-emerald-100',
  cancelled:       'bg-red-50 text-red-700 ring-red-100',
  completed:       'bg-slate-100 text-slate-600 ring-slate-200',
};

export const statusLabel: Record<AppointmentStatus, string> = {
  pending_payment: 'Pending Payment',
  pending:         'Pending',
  confirmed:       'Confirmed',
  cancelled:       'Cancelled',
  completed:       'Completed',
};
