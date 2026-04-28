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

// Fetch all prescriptions with filters to allow clinicians to review past medical interventions
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

// Get specific prescription details to support pharmacy verification and patient inquiries
export const getPrescription = (id: string) =>
  apiFetch<Prescription>(`/prescriptions/${id}`);

// Submit new prescriptions to finalize clinical sessions and enable medication fulfillment
export const createPrescription = (data: CreatePrescriptionPayload) =>
  apiFetch<Prescription>('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Halt medication cycles prematurely to manage adverse reactions or changes in treatment plans
export const discontinuePrescription = (id: string) =>
  apiFetch<Prescription>(`/prescriptions/${id}/discontinue`, {
    method: 'PATCH',
  });

// Mark prescriptions as fulfilled to maintain an accurate record of completed treatment cycles
export const completePrescription = (id: string) =>
  apiFetch<Prescription>(`/prescriptions/${id}/complete`, {
    method: 'PATCH',
  });