import { apiFetch } from '../core/apiClient';
import type { Patient } from './patient.types';

export const getMyPatients  = () => apiFetch<{ patients: Patient[]; total: number }>('/family/patients');
export const getPatient     = (id: string) => apiFetch<Patient>(`/family/patients/${id}`);
export const createPatient  = (data: any)  => apiFetch<{ patient: Patient }>('/family/patients', { method: 'POST',  body: JSON.stringify(data) });
export const updatePatient  = (id: string, data: any) => apiFetch<{ patient: Patient }>(`/family/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePatient  = (id: string) => apiFetch<void>(`/family/patients/${id}`, { method: 'DELETE' });