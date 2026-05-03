import { apiFetch } from '../core/apiClient';

// Shared types
export interface Medicine {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface CreatePrescriptionPayload {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  diagnosis?: string;
  notes?: string;
  issuedDate: string;
  validUntil?: string;
  medicines: Medicine[];
}

export interface Prescription {
  id: string;
  appointmentId?: string | null;
  patientId?: string | null;
  patientName: string;
  patientAge: number;
  diagnosis?: string;
  notes?: string;
  issuedDate: string;
  validUntil?: string;
  medicines: Medicine[];
  status: string;
  doctor?: {
    user: { fullName: string };
    specialization: string;
  };
}

// Helpers
const buildQs = (params?: Record<string, any>): string => {
  if (!params) return '';

  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      p.set(k, String(v));
    }
  });

  return p.toString();
};

// Get all prescriptions with filters
export const getAllPrescriptions = (params?: Record<string, any>) => {
  const qs = buildQs(params);
  const url = `/prescriptions${qs ? `?${qs}` : ''}`;

  return apiFetch<{
    data: Prescription[];
    total: number;
    page: number;
    limit: number;
  }>(url);
};

// Get a specific prescription by ID
export const getPrescription = (id: string) =>
  apiFetch<Prescription>(`/prescriptions/${id}`);

// Create a new prescription
export const createPrescription = (data: CreatePrescriptionPayload) =>
  apiFetch<Prescription>('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Discontinue an active prescription
export const discontinuePrescription = (id: string) =>
  apiFetch<Prescription>(`/prescriptions/${id}/discontinue`, {
    method: 'PATCH',
  });

// Mark a prescription as completed
export const completePrescription = (id: string) =>
  apiFetch<Prescription>(`/prescriptions/${id}/complete`, {
    method: 'PATCH',
  });

// Get all prescriptions for a specific patient
export const getPatientPrescriptions = (patientId: string) =>
  apiFetch<Prescription[]>(`/prescriptions/patient/${patientId}`);