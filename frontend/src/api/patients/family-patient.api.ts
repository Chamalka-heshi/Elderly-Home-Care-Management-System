import { apiFetch } from '../core/apiClient';
import type { Patient } from './patient.types';

// Get all patients registered by the current user
export const getMyPatients = () =>
  apiFetch<{ patients: Patient[]; total: number }>('/family/patients');

// Get a specific patient record
export const getPatient = (id: string) =>
  apiFetch<Patient>(`/family/patients/${id}`);

// Register a new patient
export const createPatient = (data: any) =>
  apiFetch<{ patient: Patient }>('/family/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Update a patient record
export const updatePatient = (id: string, data: any) =>
  apiFetch<{ patient: Patient }>(`/family/patients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Delete a patient record
export const deletePatient = (id: string) =>
  apiFetch<void>(`/family/patients/${id}`, {
    method: 'DELETE',
  });