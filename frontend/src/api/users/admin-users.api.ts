import { apiFetch } from '../core/apiClient';
import type { Admin, Doctor, Caregiver, Family } from './user.types';

// Create admins to grant system-wide management privileges to new staff
export const createAdmin = (data: any) =>
  apiFetch<{ admin: Admin }>('/admin/admins', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Fetch all admins to facilitate auditing and role management across the platform
export const getAllAdmins = () =>
  apiFetch<{ admins: Admin[] }>('/admin/admins');

// Remove admins to revoke system access when roles are no longer required
export const deleteAdmin = (id: string) =>
  apiFetch<{ message: string }>(`/admin/admins/${id}`, {
    method: 'DELETE',
  });

// Register doctors to enable medical service provision within the facility
export const createDoctor = (data: any) =>
  apiFetch<{ doctor: Doctor }>('/admin/doctors', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Retrieve doctor list to support scheduling and resource allocation
export const getAllDoctors = () =>
  apiFetch<{ doctors: Doctor[]; total: number }>('/admin/doctors');

// Disable doctor accounts to suspend their ability to provide medical services
export const deactivateDoctor = (id: string) =>
  apiFetch<{ message: string }>(`/admin/doctors/${id}/deactivate`, {
    method: 'DELETE',
  });

// Re-enable doctor accounts to restore their service provision capabilities
export const activateDoctor = (id: string) =>
  apiFetch<{ message: string }>(`/admin/doctors/${id}/activate`, {
    method: 'PATCH',
  });

// Register caregivers to maintain the staffing pool for patient care plans
export const createCaregiver = (data: any) =>
  apiFetch<{ caregiver: Caregiver }>('/admin/caregivers', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Retrieve caregiver list to monitor staffing levels and assignments
export const getAllCaregivers = () =>
  apiFetch<{ caregivers: Caregiver[] }>('/admin/caregivers');

// Disable caregiver accounts to suspend their access to patient care systems
export const deactivateCaregiver = (id: string) =>
  apiFetch<{ message: string }>(`/admin/caregivers/${id}/deactivate`, {
    method: 'DELETE',
  });

// Re-enable caregiver accounts to restore their access to patient care workflows
export const activateCaregiver = (id: string) =>
  apiFetch<{ message: string }>(`/admin/caregivers/${id}/activate`, {
    method: 'PATCH',
  });

// Fetch all families to oversee user registrations and manage billing relationships
export const getAllFamilies = () =>
  apiFetch<{ families: Family[] }>('/admin/families');

// Toggle family status to manage platform access based on compliance or subscription
export const toggleFamilyStatus = (id: string, isActive: boolean) =>
  apiFetch<{ family: Family }>(`/admin/families/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });