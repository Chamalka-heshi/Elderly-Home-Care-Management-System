import { apiFetch } from '../core/apiClient';

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
  paymentPlan?: string;
  createdAt: string;
}

export interface PatientMedicalHistory {
  patient: PatientMedicalDetail;
  vitalRecords: VitalRecord[];
  prescriptions: PrescriptionHistory[];
}

//Provides a consolidated medical timeline to assist doctors in clinical decision-making
export const getPatientMedicalHistory = (patientId: string) =>
  apiFetch<PatientMedicalHistory>(`/patients/${patientId}/medical-history`);