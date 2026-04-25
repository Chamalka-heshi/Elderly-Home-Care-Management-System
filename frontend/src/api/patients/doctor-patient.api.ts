import { apiFetch } from '../core/apiClient';

// ── Vital Record ──────────────────────────────────────────────────────────────

export interface VitalRecord {
  id: string;
  patientId: string;
  caregiverId: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  status: 'Normal' | 'Warning' | 'Critical';
  recordedAt: string;
  updatedAt: string;
}

// ── Prescription (summary for history) ───────────────────────────────────────

export interface MedicineItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface PrescriptionHistory {
  id: string;
  patientId?: string | null;
  patientName: string;
  patientAge: number;
  diagnosis?: string | null;
  notes?: string | null;
  issuedDate: string;
  validUntil?: string | null;
  medicines: MedicineItem[];
  status: 'active' | 'completed' | 'discontinued' | null;
  createdAt: string;
  doctor?: {
    user: { fullName: string };
    specialization: string;
  };
}

// ── Patient (full medical details) ───────────────────────────────────────────

export interface PatientMedicalDetail {
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
  createdAt: string;
}

// ── Combined response ─────────────────────────────────────────────────────────

export interface PatientMedicalHistory {
  patient: PatientMedicalDetail;
  vitalRecords: VitalRecord[];
  prescriptions: PrescriptionHistory[];
}

// ── API call ──────────────────────────────────────────────────────────────────

export const getPatientMedicalHistory = (patientId: string) =>
  apiFetch<PatientMedicalHistory>(`/patients/${patientId}/medical-history`);