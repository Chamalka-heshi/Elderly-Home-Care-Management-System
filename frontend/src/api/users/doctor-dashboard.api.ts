import { apiFetch } from '../core/apiClient';

// Response types
export interface DashboardRecentPatient {
  id: string;
  name: string;
  age: number;
  bloodGroup: string | null;
  diagnosis: string | null;
  status: 'Active' | 'Completed' | 'Discontinued';
  prescriptionDate: string;
}

export interface DoctorDashboardStats {
  myPatientsCount: number;
  todaysAppointmentsCount: number;
  activePrescriptionsCount: number;
  pendingAppointmentsCount: number;
  recentPatients: DashboardRecentPatient[];
}

// Fetch doctor-specific metrics to provide clinicians with a concise overview of their daily schedule and patient load
export const getDoctorDashboardStats = () =>
  apiFetch<DoctorDashboardStats>('/doctors/dashboard');