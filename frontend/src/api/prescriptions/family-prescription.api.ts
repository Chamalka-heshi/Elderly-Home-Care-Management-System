import { apiFetch } from '../core/apiClient';

// Structure for family-accessible prescriptions to track patient medication cycles and clinical advice
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

// Retrieve all prescriptions issued to the family's registered patients to ensure adherence to treatment
export const getFamilyPrescriptions = () =>
  apiFetch<{ data: FamilyPrescription[]; total: number }>('/family/prescriptions');

// Get specific prescription details to support medication purchase and treatment follow-up
export const getFamilyPrescription = (id: string) =>
  apiFetch<FamilyPrescription>(`/family/prescriptions/${id}`);