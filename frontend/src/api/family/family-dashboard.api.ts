import { apiFetch } from '../core/apiClient';

// Shape of each patient returned by the dashboard summary
export interface DashboardPatient {
  id: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  gender: string;
  dateOfBirth: string;
  paymentPlan: string | null;
}

// Shape of the full dashboard summary response
export interface FamilyDashboardSummary {
  patientsCount: number;
  activePrescriptionsCount: number;
  pendingPaymentsCount: number;
  upcomingAppointmentsCount: number;
  patients: DashboardPatient[];
}

/**
 * GET /family/dashboard
 * Returns aggregated summary data for the family dashboard home page.
 */
export const getFamilyDashboard = () =>
  apiFetch<FamilyDashboardSummary>('/family/dashboard');
