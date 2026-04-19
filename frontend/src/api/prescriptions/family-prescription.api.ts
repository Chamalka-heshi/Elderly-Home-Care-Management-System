import { apiFetch } from '../core/apiClient';

export interface FamilyPrescription {
  id:             string;
  appointmentId?: string | null;
  patientId?:     string | null;
  patientName:    string;
  patientAge:     number;
  diagnosis?:     string | null;
  notes?:         string | null;
  issuedDate:     string;
  validUntil?:    string | null;
  medicines: {
    medicineName:  string;
    dosage:        string;
    frequency:     string;
    durationDays:  number;
    instructions?: string;
  }[];
  status:   'active' | 'completed' | 'discontinued';
  doctor?: {
    specialization: string;
    user: { fullName: string };
  };
  createdAt?: string;
}

export const getFamilyPrescriptions = () =>
  apiFetch<{ data: FamilyPrescription[]; total: number }>('/family/prescriptions');

export const getFamilyPrescription = (id: string) =>
  apiFetch<FamilyPrescription>(`/family/prescriptions/${id}`);