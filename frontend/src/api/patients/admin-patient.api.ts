import { apiFetch } from '../core/apiClient';
import type { Patient } from './patient.types';

// Get all patients for admin
export const getAllPatientsAdmin = () =>
  apiFetch<{ patients: Patient[]; total: number }>('/admin/patients');

// Get a specific patient record for admin
export const getPatientAdmin = (id: string) =>
  apiFetch<Patient>(`/admin/patients/${id}`);

// Delete a patient record
export const deletePatientAdmin = (id: string) =>
  apiFetch<{ message: string }>(`/admin/patients/${id}`, {
    method: 'DELETE',
  });