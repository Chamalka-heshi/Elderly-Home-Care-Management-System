import { apiFetch } from '../core/apiClient';

// ── Shared types ─────────────────────────────────────────────────────────────

export interface Medicine {
  medicineName:  string;
  dosage:        string;
  frequency:     string;
  durationDays:  number;
  instructions?: string;
}

export interface CreatePrescriptionPayload {
  appointmentId: string;  
  patientId:     string;
  patientName:   string;
  patientAge:    number;
  diagnosis?:    string;
  notes?:        string;
  issuedDate:    string;
  validUntil?:   string;
  medicines:     Medicine[];
}

export interface Prescription {
  id:            string;
  appointmentId?: string | null;
  patientId?:    string | null;
  patientName:   string;
  patientAge:    number;
  diagnosis?:    string;
  notes?:        string;
  issuedDate:    string;
  validUntil?:   string;
  medicines:     Medicine[];           // was: any[]
  status:        string;
  doctor?: {
    user:           { fullName: string };
    specialization: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildQs = (params?: Record<string, any>): string => {
  if (!params) return '';
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) p.set(k, String(v));
  });
  return p.toString();
};

// ── API calls ─────────────────────────────────────────────────────────────────

export const getAllPrescriptions = (params?: Record<string, any>) => {
  const qs = buildQs(params);
  return apiFetch<{ data: Prescription[]; total: number; page: number; limit: number }>(
    `/prescriptions${qs ? `?${qs}` : ''}`,
  );
};

export const getPrescription = (id: string) =>
  apiFetch<Prescription>(`/prescriptions/${id}`);

/** Typed — accepts a full CreatePrescriptionPayload (used by DoctorAppointments) */
export const createPrescription = (data: CreatePrescriptionPayload) =>
  apiFetch<Prescription>('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const discontinuePrescription = (id: string) =>
  apiFetch<Prescription>(`/prescriptions/${id}/discontinue`, { method: 'PATCH' });

export const completePrescription = (id: string) =>
  apiFetch<Prescription>(`/prescriptions/${id}/complete`, { method: 'PATCH' });

export const deletePrescription = (id: string) =>
  apiFetch<void>(`/prescriptions/${id}`, { method: 'DELETE' });