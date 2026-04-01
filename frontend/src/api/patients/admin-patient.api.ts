import { apiFetch } from '../core/apiClient';
import type { Patient } from './patient.types';

export const getAllPatientsAdmin = () => apiFetch<{ patients: Patient[]; total: number }>('/admin/patients');
export const getPatientAdmin = (id: string) => apiFetch<Patient>(`/admin/patients/${id}`);
export const deletePatientAdmin = (id: string) => apiFetch<{ message: string }>(`/admin/patients/${id}`, { method: 'DELETE' });