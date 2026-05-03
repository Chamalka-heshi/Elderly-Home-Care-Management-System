import { apiFetch } from '../core/apiClient';
import type { Admin, Doctor, Caregiver, Family } from './user.types';

// Create a new admin account
export const createAdmin = (data: any) =>
  apiFetch<{ admin: Admin }>('/admin/admins', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Get all admin accounts
export const getAllAdmins = () =>
  apiFetch<{ admins: Admin[] }>('/admin/admins');

// Delete an admin account
export const deleteAdmin = (id: string) =>
  apiFetch<{ message: string }>(`/admin/admins/${id}`, {
    method: 'DELETE',
  });

// Create a new doctor account
export const createDoctor = (data: any) =>
  apiFetch<{ doctor: Doctor }>('/admin/doctors', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Get all doctor accounts
export const getAllDoctors = () =>
  apiFetch<{ doctors: Doctor[]; total: number }>('/admin/doctors');

// Deactivate a doctor account
export const deactivateDoctor = (id: string) =>
  apiFetch<{ message: string }>(`/admin/doctors/${id}/deactivate`, {
    method: 'DELETE',
  });

// Activate a doctor account
export const activateDoctor = (id: string) =>
  apiFetch<{ message: string }>(`/admin/doctors/${id}/activate`, {
    method: 'PATCH',
  });

// Create a new caregiver account
export const createCaregiver = (data: any) =>
  apiFetch<{ caregiver: Caregiver }>('/admin/caregivers', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Get all caregiver accounts
export const getAllCaregivers = () =>
  apiFetch<{ caregivers: Caregiver[] }>('/admin/caregivers');

// Deactivate a caregiver account
export const deactivateCaregiver = (id: string) =>
  apiFetch<{ message: string }>(`/admin/caregivers/${id}/deactivate`, {
    method: 'DELETE',
  });

// Activate a caregiver account
export const activateCaregiver = (id: string) =>
  apiFetch<{ message: string }>(`/admin/caregivers/${id}/activate`, {
    method: 'PATCH',
  });

// Get all family accounts
export const getAllFamilies = () =>
  apiFetch<{ families: Family[] }>('/admin/families');

// Toggle family account status
export const toggleFamilyStatus = (id: string, isActive: boolean) =>
  apiFetch<{ family: Family }>(`/admin/families/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });