import { apiFetch } from '../core/apiClient';
import type { Patient } from './patient.types';

export const getMyPatients = () => apiFetch<{ patients: Patient[]; total: number }>('/patients/my-patients');
export const getPatient = (id: string) => apiFetch<Patient>(`/patients/${id}`);
export const createPatient = (data: any) => apiFetch<{patient: Patient}>('/patients', { method: 'POST', body: JSON.stringify(data) });
export const updatePatient = (id: string, data: any) => apiFetch<{patient: Patient}>(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePatient = (id: string) => apiFetch<void>(`/patients/${id}`, { method: 'DELETE' });