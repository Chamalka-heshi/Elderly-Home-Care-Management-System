import { apiFetch } from '../core/apiClient';
import type { Patient } from '../patients/patient.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CareNote {
  id: string;
  residentId: string;
  caregiverId: string;
  note: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface MedicationLog {
  id: string;
  patientId: string;
  caregiverId: string;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  scheduledTime?: string;
  scheduledDate?: string;
  status: 'Administered' | 'Pending' | 'Missed' | 'Refused';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Assigned Patients ────────────────────────────────────────────────────────

export const getAssignedPatients = () =>
  apiFetch<{ patients: Patient[]; total: number }>('/patients/assigned');

// ─── Care Notes ───────────────────────────────────────────────────────────────

export const createCareNote = (data: {
  residentId: string;
  note: string;
  category?: string;
}) => apiFetch<CareNote>('/care-notes', { method: 'POST', body: JSON.stringify(data) });

export const updateCareNote = (
  id: string,
  data: { note?: string; category?: string },
) =>
  apiFetch<CareNote>(`/care-notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// ─── Vital Records ────────────────────────────────────────────────────────────

export const createVitalRecord = (data: {
  patientId: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  status?: string;
}) =>
  apiFetch<VitalRecord>('/vital-records', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateVitalRecord = (
  id: string,
  data: Partial<Omit<VitalRecord, 'id' | 'patientId' | 'caregiverId' | 'recordedAt' | 'updatedAt'>>,
) =>
  apiFetch<VitalRecord>(`/vital-records/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const getAllVitalRecords = () =>
  apiFetch<VitalRecord[]>('/vital-records');

export const getVitalsForPatient = (patientId: string) =>
  apiFetch<VitalRecord[]>(`/vital-records/patient/${patientId}`);

// ─── Medication Logs ──────────────────────────────────────────────────────────

export const createMedicationLog = (data: {
  patientId: string;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  scheduledTime?: string;
  scheduledDate?: string;
  status?: string;
  notes?: string;
}) =>
  apiFetch<MedicationLog>('/medication-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateMedicationLog = (
  id: string,
  data: { status?: string; notes?: string; dosage?: string; frequency?: string; scheduledTime?: string },
) =>
  apiFetch<MedicationLog>(`/medication-logs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const getAllMedicationLogs = () =>
  apiFetch<MedicationLog[]>('/medication-logs');

export const getMedicationLogsForPatient = (patientId: string) =>
  apiFetch<MedicationLog[]>(`/medication-logs/patient/${patientId}`);

// ─── Payment Plan (Family) ────────────────────────────────────────────────────

export const selectPaymentPlan = (patientId: string, plan: string) =>
  apiFetch<Patient>(`/patients/${patientId}/plan`, {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
