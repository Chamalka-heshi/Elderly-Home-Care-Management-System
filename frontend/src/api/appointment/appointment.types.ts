export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface AppointmentPatient {
  id: string;
  fullName: string;
  nic: string;
  dateOfBirth: string;
  age?: number;          // computed by backend from dateOfBirth
  gender: string;
  bloodGroup?: string;
  address?: string;
  contactNumber?: string;
  emergencyContact?: string;
  // Medical fields — ONLY present in doctor responses, stripped for admin
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
  prescriptionId: string;  
  createdAt: string;
  updatedAt: string;
  slot: AppointmentSlot;
  patient: AppointmentPatient;
  familyMember: {
    id: string;
    user: { fullName: string; email: string };
  };
}

export const fmt12 = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const fmtDate = (dateStr: string): string =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });

export const statusColor: Record<AppointmentStatus, string> = {
  pending:   'bg-amber-50 text-amber-700 ring-amber-100',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  cancelled: 'bg-red-50 text-red-700 ring-red-100',
  completed: 'bg-slate-100 text-slate-600 ring-slate-200',
};