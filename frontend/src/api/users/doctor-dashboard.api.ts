import { apiFetch } from '../core/apiClient';

// ── Response types ─────────────────────────────────────────────────────────

export interface DashboardRecentPatient {
  id: string;
  name: string;
  age: number;
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

export const getDoctorDashboardStats = () =>
  apiFetch<DoctorDashboardStats>('/doctors/dashboard');