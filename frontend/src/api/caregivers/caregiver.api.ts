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

export interface PrescribedMedicine {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
  instructions?: string;
}

export interface CaregiverPrescription {
  id: string;
  appointmentId?: string | null;
  patientId?: string | null;
  patientName: string;
  patientAge?: number;
  diagnosis?: string | null;
  notes?: string | null;
  issuedDate: string;
  validUntil?: string | null;
  medicines: PrescribedMedicine[];
  status: string;
  doctor?: {
    user?: { fullName: string };
    specialization?: string;
  };
  createdAt?: string;
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
// Get patients assigned to the caregiver
export const getAssignedPatients = () =>
  apiFetch<{ patients: Patient[]; total: number }>('/patients/assigned');

// Care Notes
// Create a new care note
export const createCareNote = (data: {
  residentId: string;
  note: string;
  category?: string;
}) =>
  apiFetch<CareNote>('/care-notes', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Update an existing care note
export const updateCareNote = (
  id: string,
  data: { note?: string; category?: string },
) =>
  apiFetch<CareNote>(`/care-notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Vital Records
// Create a new vital record
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

// Update an existing vital record
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

// Get all vital records
export const getAllVitalRecords = () =>
  apiFetch<VitalRecord[]>('/vital-records');

// Get vitals for a specific patient
export const getVitalsForPatient = (patientId: string) =>
  apiFetch<VitalRecord[]>(`/vital-records/patient/${patientId}`);

// Medication Logs
// Create a new medication log
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

// Update a medication log status
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

// Get all medication logs
export const getAllMedicationLogs = () =>
  apiFetch<MedicationLog[]>('/medication-logs');

// Get medication logs for a specific patient
export const getMedicationLogsForPatient = (patientId: string) =>
  apiFetch<MedicationLog[]>(`/medication-logs/patient/${patientId}`);

// Payment Plan
// Select a care plan for a patient
export const selectPaymentPlan = (patientId: string, plan: string) =>
  apiFetch<Patient>(`/patients/${patientId}/plan`, {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });

// Active Prescriptions
// Get all active doctor prescriptions for patients registered to a care plan
export const getActivePrescriptionsForCaregiver = () =>
  apiFetch<CaregiverPrescription[]>('/prescriptions/active-assigned');

// Get all prescriptions for a specific patient
export const getPrescriptionsForPatient = (patientId: string) =>
  apiFetch<CaregiverPrescription[]>(`/prescriptions/patient/${patientId}`);

