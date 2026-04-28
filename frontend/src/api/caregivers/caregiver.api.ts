import { apiFetch } from '../core/apiClient';
import type { Patient } from '../patients/patient.types';

// Types
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

// Assigned Patients
// Retrieve patients assigned to the caregiver to define their current care responsibilities
export const getAssignedPatients = () =>
  apiFetch<{ patients: Patient[]; total: number }>('/patients/assigned');

// Care Notes
// Record daily observations and care activities to maintain a detailed patient history
export const createCareNote = (data: {
  residentId: string;
  note: string;
  category?: string;
}) =>
  apiFetch<CareNote>('/care-notes', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Modify existing notes to correct information or add follow-up details to care records
export const updateCareNote = (
  id: string,
  data: { note?: string; category?: string },
) =>
  apiFetch<CareNote>(`/care-notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Vital Records
// Submit physiological measurements to monitor the patient's immediate health status
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

// Update specific vital readings to reflect new measurements or clinical changes
export const updateVitalRecord = (
  id: string,
  data: Partial<
    Omit<VitalRecord, 'id' | 'patientId' | 'caregiverId' | 'recordedAt' | 'updatedAt'>
  >,
) =>
  apiFetch<VitalRecord>(`/vital-records/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Fetch all recorded vitals to facilitate broader clinical analysis and trend spotting
export const getAllVitalRecords = () =>
  apiFetch<VitalRecord[]>('/vital-records');

// Retrieve vitals for a specific patient to support individualized health tracking
export const getVitalsForPatient = (patientId: string) =>
  apiFetch<VitalRecord[]>(`/vital-records/patient/${patientId}`);

// Medication Logs
// Record medication administration to ensure compliance with clinical treatment plans
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

// Transition medication states to track whether prescriptions were administered or missed
export const updateMedicationLog = (
  id: string,
  data: {
    status?: string;
    notes?: string;
    dosage?: string;
    frequency?: string;
    scheduledTime?: string;
  },
) =>
  apiFetch<MedicationLog>(`/medication-logs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Fetch all medication activity to monitor adherence and staff performance
export const getAllMedicationLogs = () =>
  apiFetch<MedicationLog[]>('/medication-logs');

// Retrieve medication history for a specific patient to verify treatment consistency
export const getMedicationLogsForPatient = (patientId: string) =>
  apiFetch<MedicationLog[]>(`/medication-logs/patient/${patientId}`);

// Payment Plan
// Allow family members to select and transition between patient care plans
export const selectPaymentPlan = (patientId: string, plan: string) =>
  apiFetch<Patient>(`/patients/${patientId}/plan`, {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
