import { apiFetch } from '../core/apiClient';

// Response types

export interface DashboardRecentPatient {
  id: string;
  name: string;
  age: number;
  bloodGroup: string | null;
  diagnosis: string | null;
  /** 'Prescription Pending' — payment confirmed, waiting for doctor to prescribe */
  status: 'Prescription Pending';
  slotDate: string;
  /** @deprecated use slotDate */
  prescriptionDate: string;
}

export interface DoctorDashboardStats {
  myPatientsCount: number;
  todaysAppointmentsCount: number;
  activePrescriptionsCount: number;
  pendingAppointmentsCount: number;
  recentPatients: DashboardRecentPatient[];
}

// Get statistics for the doctor dashboard
export const getDoctorDashboardStats = () =>
  apiFetch<DoctorDashboardStats>('/doctors/dashboard');
