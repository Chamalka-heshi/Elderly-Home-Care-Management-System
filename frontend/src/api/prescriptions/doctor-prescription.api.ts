import { apiFetch } from '../core/apiClient';

export interface Prescription { id: string; patientName: string; patientAge: number; diagnosis?: string; notes?: string; issuedDate: string; validUntil?: string; medicines: any[]; status: string; }

export const getAllPrescriptions = (params?: any) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch<{ data: Prescription[]; total: number }>(`/prescriptions${qs ? `?${qs}` : ''}`);
};
export const getPrescription = (id: string) => apiFetch<Prescription>(`/prescriptions/${id}`);
export const createPrescription = (data: any) => apiFetch<Prescription>('/prescriptions', { method: 'POST', body: JSON.stringify(data) });
export const updatePrescription = (id: string, data: any) => apiFetch<Prescription>(`/prescriptions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const discontinuePrescription = (id: string) => apiFetch<Prescription>(`/prescriptions/${id}/discontinue`, { method: 'PATCH' });
export const completePrescription = (id: string) => apiFetch<Prescription>(`/prescriptions/${id}/complete`, { method: 'PATCH' });
export const deletePrescription = (id: string) => apiFetch<void>(`/prescriptions/${id}`, { method: 'DELETE' });