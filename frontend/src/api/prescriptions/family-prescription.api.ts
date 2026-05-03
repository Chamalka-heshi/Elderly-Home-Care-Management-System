import { apiFetch } from '../core/apiClient';

// Prescription data structure for families
export interface FamilyPrescription {
  id: string;
  appointmentId?: string | null;
  patientId?: string | null;
  patientName: string;
  patientAge: number;
  diagnosis?: string | null;
  notes?: string | null;
  issuedDate: string;
  validUntil?: string | null;
  medicines: {
    medicineName: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    instructions?: string;
  }[];
  status: 'active' | 'completed' | 'discontinued';
  doctor?: {
    specialization: string;
    user: {
      fullName: string;
    };
  };
  createdAt?: string;
}

// Get all prescriptions for the family's patients
export const getFamilyPrescriptions = () =>
  apiFetch<{ data: FamilyPrescription[]; total: number }>('/family/prescriptions');

// Get a specific prescription for the family
export const getFamilyPrescription = (id: string) =>
  apiFetch<FamilyPrescription>(`/family/prescriptions/${id}`);