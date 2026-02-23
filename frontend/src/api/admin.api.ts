// Admin API Service - Complete Backend Integration
// Place this file in: src/api/admin.api.ts

import type { User } from '../auth/AuthContext';

// ============ TYPE DEFINITIONS ============

export interface Admin {
  id: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  isActive: boolean;
  createdAt: string;
  user: User;
}

export interface Doctor {
  id: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  isActive: boolean;
  patientsCount?: number;
  createdAt: string;
}

export interface Caregiver {
  id: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  shiftPreference: 'day' | 'night' | 'flexible';
  certifications: string[];
  yearsOfExperience: number;
  availabilityStatus: 'available' | 'busy' | 'off-duty';
  isActive: boolean;
  patientsCount?: number;
  createdAt: string;
}

export interface Family {
  id: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  relationship?: string;
  emergencyContact?: string;
  address?: string;
  isActive: boolean;
  patientsCount: number;
  joinedDate: string;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth?: string;
  admissionDate: string;
  medicalCondition?: string;
  status: 'Confirmed' | 'Incoming' | 'Cancelled' | 'Discharged';
  familyId: string;
  familyName?: string;
  assignedDoctorId?: string;
  assignedCaregiverId?: string;
}

export interface DashboardStats {
  totalFamilies: number;
  totalPatients: number;
  totalDoctors: number;
  totalCaregivers: number;
  totalAdmins: number;
  activePatients: number;
  newPatientsThisMonth: number;
  upcomingAppointments: number;
  earnings: number;
}

// ============ REQUEST DTOs ============

export interface CreateAdminRequest {
  fullName: string;
  email: string;
  password: string;
  contactNumber?: string;
}

export interface CreateDoctorRequest {
  fullName: string;
  email: string;
  password: string;
  contactNumber?: string;
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
}

export interface UpdateDoctorRequest {
  fullName?: string;
  contactNumber?: string;
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
}

export interface CreateCaregiverRequest {
  fullName: string;
  email: string;
  password: string;
  contactNumber?: string;
  shiftPreference: 'day' | 'night' | 'flexible';
  certifications: string[];
  yearsOfExperience: number;
  availabilityStatus: 'available' | 'busy' | 'off-duty';
}

export interface UpdateCaregiverRequest {
  fullName?: string;
  contactNumber?: string;
  shiftPreference?: 'day' | 'night' | 'flexible';
  certifications?: string[];
  yearsOfExperience?: number;
  availabilityStatus?: 'available' | 'busy' | 'off-duty';
}

// ============ API CONFIGURATION ============

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const handleApiError = async (response: Response): Promise<never> => {
  const data = await response.json().catch(() => ({}));
  const errorMessage = data.message || data.error || 'An error occurred';

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw new Error('Session expired. Please login again.');
  }

  throw new Error(errorMessage);
};

// ============ ADMIN MANAGEMENT ============

/** POST /api/admin/admins */
export const createAdmin = async (
  data: CreateAdminRequest
): Promise<{ message: string; admin: Admin }> => {
  const response = await fetch(`${API_BASE_URL}/admin/admins`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** GET /api/admin/admins */
export const getAllAdmins = async (): Promise<{ admins: Admin[]; total: number }> => {
  const response = await fetch(`${API_BASE_URL}/admin/admins`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

// ============ DOCTOR MANAGEMENT ============

/** POST /api/admin/doctors */
export const createDoctor = async (
  data: CreateDoctorRequest
): Promise<{ message: string; doctor: Doctor }> => {
  const response = await fetch(`${API_BASE_URL}/admin/doctors`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** GET /api/admin/doctors */
export const getAllDoctors = async (): Promise<{ doctors: Doctor[]; total: number }> => {
  const response = await fetch(`${API_BASE_URL}/admin/doctors`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** GET /api/admin/doctors/:id */
export const getDoctor = async (id: string): Promise<Doctor> => {
  const response = await fetch(`${API_BASE_URL}/admin/doctors/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** PATCH /api/admin/doctors/:id */
export const updateDoctor = async (
  id: string,
  data: UpdateDoctorRequest
): Promise<{ message: string; doctor: Doctor }> => {
  const response = await fetch(`${API_BASE_URL}/admin/doctors/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** DELETE /api/admin/doctors/:id/deactivate */
export const deactivateDoctor = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/admin/doctors/${id}/deactivate`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** PATCH /api/admin/doctors/:id/activate */
export const activateDoctor = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/admin/doctors/${id}/activate`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

// ============ CAREGIVER MANAGEMENT ============

/** POST /api/admin/caregivers */
export const createCaregiver = async (
  data: CreateCaregiverRequest
): Promise<{ message: string; caregiver: Caregiver }> => {
  const response = await fetch(`${API_BASE_URL}/admin/caregivers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** GET /api/admin/caregivers */
export const getAllCaregivers = async (): Promise<{ caregivers: Caregiver[]; total: number }> => {
  const response = await fetch(`${API_BASE_URL}/admin/caregivers`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** GET /api/admin/caregivers/:id */
export const getCaregiver = async (id: string): Promise<Caregiver> => {
  const response = await fetch(`${API_BASE_URL}/admin/caregivers/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** PATCH /api/admin/caregivers/:id */
export const updateCaregiver = async (
  id: string,
  data: UpdateCaregiverRequest
): Promise<{ message: string; caregiver: Caregiver }> => {
  const response = await fetch(`${API_BASE_URL}/admin/caregivers/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** DELETE /api/admin/caregivers/:id/deactivate */
export const deactivateCaregiver = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/admin/caregivers/${id}/deactivate`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** PATCH /api/admin/caregivers/:id/activate */
export const activateCaregiver = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/admin/caregivers/${id}/activate`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

// ============ FAMILY MANAGEMENT ============

/** GET /api/admin/families */
export const getAllFamilies = async (): Promise<{ families: Family[]; total: number }> => {
  const response = await fetch(`${API_BASE_URL}/admin/families`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** GET /api/admin/families/:id */
export const getFamily = async (id: string): Promise<Family> => {
  const response = await fetch(`${API_BASE_URL}/admin/families/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** PATCH /api/admin/families/:id/status */
export const toggleFamilyStatus = async (
  id: string,
  isActive: boolean
): Promise<{ message: string; family: Family }> => {
  const response = await fetch(`${API_BASE_URL}/admin/families/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ isActive }),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

// ============ PATIENT MANAGEMENT ============

/** GET /api/admin/patients */
export const getAllPatients = async (): Promise<{ patients: Patient[]; total: number }> => {
  const response = await fetch(`${API_BASE_URL}/admin/patients`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** GET /api/admin/patients/:id */
export const getPatient = async (id: string): Promise<Patient> => {
  const response = await fetch(`${API_BASE_URL}/admin/patients/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

/** DELETE /api/admin/patients/:id */
export const deletePatient = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/admin/patients/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

// ============ DASHBOARD STATISTICS ============

/** GET /api/admin/dashboard/stats */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};