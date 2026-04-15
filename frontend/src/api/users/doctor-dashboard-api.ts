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

// ── API calls ──────────────────────────────────────────────────────────────

/**
 * GET /doctors/dashboard
 * Returns the aggregated stats + recent patients for the doctor's home page.
 */
export const getDoctorDashboardStats = () =>
  apiFetch<DoctorDashboardStats>('/doctors/dashboard');