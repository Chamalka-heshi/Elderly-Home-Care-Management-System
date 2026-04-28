import { apiFetch } from '../core/apiClient';
import type { Patient } from './patient.types';

// Retrieve all patients registered by the family to manage their clinical and care profiles
export const getMyPatients = () =>
  apiFetch<{ patients: Patient[]; total: number }>('/family/patients');

// Get specific patient details to support clinical review and profile management
export const getPatient = (id: string) =>
  apiFetch<Patient>(`/family/patients/${id}`);

// Register a new patient to enable their participation in care plans and consultations
export const createPatient = (data: any) =>
  apiFetch<{ patient: Patient }>('/family/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Modify existing patient information to ensure medical and contact records remain accurate
export const updatePatient = (id: string, data: any) =>
  apiFetch<{ patient: Patient }>(`/family/patients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Remove patient profiles when care services are no longer required by the family
export const deletePatient = (id: string) =>
  apiFetch<void>(`/family/patients/${id}`, {
    method: 'DELETE',
  });