import { apiFetch } from '../core/apiClient';
import type { BaseUser, Doctor, Caregiver, Family } from './user.types';

// Admins
export const createAdmin = (data: any) => apiFetch<{admin: BaseUser}>('/admin/admins', { method: 'POST', body: JSON.stringify(data) });
export const getAllAdmins = () => apiFetch<{admins: BaseUser[]}>('/admin/admins');

// Doctors
export const createDoctor = (data: any) => apiFetch<{doctor: Doctor}>('/admin/doctors', { method: 'POST', body: JSON.stringify(data) });
export const getAllDoctors = () => apiFetch<{doctors: Doctor[]}>('/admin/doctors');
export const getDoctor = (id: string) => apiFetch<Doctor>(`/admin/doctors/${id}`);
export const updateDoctor = (id: string, data: any) => apiFetch<{doctor: Doctor}>(`/admin/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deactivateDoctor = (id: string) => apiFetch<{message: string}>(`/admin/doctors/${id}/deactivate`, { method: 'DELETE' });
export const activateDoctor = (id: string) => apiFetch<{message: string}>(`/admin/doctors/${id}/activate`, { method: 'PATCH' });

// Caregivers
export const createCaregiver = (data: any) => apiFetch<{caregiver: Caregiver}>('/admin/caregivers', { method: 'POST', body: JSON.stringify(data) });
export const getAllCaregivers = () => apiFetch<{caregivers: Caregiver[]}>('/admin/caregivers');
export const getCaregiver = (id: string) => apiFetch<Caregiver>(`/admin/caregivers/${id}`);
export const updateCaregiver = (id: string, data: any) => apiFetch<{caregiver: Caregiver}>(`/admin/caregivers/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deactivateCaregiver = (id: string) => apiFetch<{message: string}>(`/admin/caregivers/${id}/deactivate`, { method: 'DELETE' });
export const activateCaregiver = (id: string) => apiFetch<{message: string}>(`/admin/caregivers/${id}/activate`, { method: 'PATCH' });

// Families
export const getAllFamilies = () => apiFetch<{families: Family[]}>('/admin/families');
export const getFamily = (id: string) => apiFetch<Family>(`/admin/families/${id}`);
export const toggleFamilyStatus = (id: string, isActive: boolean) => apiFetch<{family: Family}>(`/admin/families/${id}/status`, { method: 'PATCH', body: JSON.stringify({isActive}) });