import { apiFetch } from '../core/apiClient';
import type { Patient } from './patient.types';

// Retrieve the complete patient registry to oversee the facility's clinical population
export const getAllPatientsAdmin = () =>
  apiFetch<{ patients: Patient[]; total: number }>('/admin/patients');

// Get detailed patient records to support clinical case reviews and administrative audits
export const getPatientAdmin = (id: string) =>
  apiFetch<Patient>(`/admin/patients/${id}`);

// Remove patient records to handle account deletions while maintaining regulatory compliance
export const deletePatientAdmin = (id: string) =>
  apiFetch<{ message: string }>(`/admin/patients/${id}`, {
    method: 'DELETE',
  });