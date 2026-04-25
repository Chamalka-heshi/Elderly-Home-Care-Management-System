/**
 * src/api/appointment/appointment.api.ts
 * ────────────────────────────────────────────────────────────────────────────
 * ONE file for ALL appointment API calls — family, admin, and doctor.
 *
 * Backend routes (all handled by the single AppointmentController / FamilyController):
 *
 *   FAMILY  (via FamilyController)
 *     POST   /family/appointments               → createAppointment
 *     GET    /family/appointments               → getMyAppointments
 *     PATCH  /family/appointments/:id/cancel    → cancelMyAppointment
 *
 *   DOCTOR  (via AppointmentController)
 *     GET    /appointments/doctor               → getDoctorAppointments
 *     PATCH  /appointments/doctor/:id/status    → updateAppointmentStatusDoctor
 *
 *   ADMIN   (via AppointmentController)
 *     GET    /appointments/admin                → getAllAppointmentsAdmin
 *     PATCH  /appointments/admin/:id/status     → updateAppointmentStatusAdmin
 *     DELETE /appointments/admin/:id            → deleteAppointmentAdmin
 */

import { apiFetch } from '../core/apiClient';
import type { Appointment, AppointmentStatus } from './appointment.types';

// ── Re-export types so consumers don't need a second import ──────────────────
export type { Appointment, AppointmentStatus } from './appointment.types';

// ─────────────────────────────────────────────────────────────────────────────
// FAMILY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Book a channeling slot for one of the family's patients.
 * Returns an Appointment with status = 'pending_payment'.
 * The family member must then pay via POST /payments/create.
 */
export const createAppointment = (data: {
  slotId: string;
  patientId: string;
  notes?: string;
}) =>
  apiFetch<Appointment>('/family/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });

/** List all appointments made by the authenticated family member. */
export const getMyAppointments = () =>
  apiFetch<Appointment[]>('/family/appointments');

/**
 * Cancel a family member's own appointment.
 * Only allowed while status is 'pending_payment' or 'pending'.
 */
export const cancelMyAppointment = (id: string) =>
  apiFetch<{ message: string }>(`/family/appointments/${id}/cancel`, {
    method: 'PATCH',
  });

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR
// ─────────────────────────────────────────────────────────────────────────────

/** Get all appointments for this doctor's slots (confirmed / completed). */
export const getDoctorAppointments = () =>
  apiFetch<Appointment[]>('/appointments/doctor');

/**
 * Doctor updates an appointment's status.
 * Allowed transitions: pending → confirmed, confirmed → completed, any → cancelled.
 */
export const updateAppointmentStatusDoctor = (
  id: string,
  status: AppointmentStatus,
  notes?: string,
) =>
  apiFetch<Appointment>(`/appointments/doctor/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(notes !== undefined ? { notes } : {}) }),
  });

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

/** Get all appointments with optional filters. */
export const getAllAppointmentsAdmin = (params?: {
  status?: AppointmentStatus;
  patientId?: string;
  doctorId?: string;
}) => {
  const qs = new URLSearchParams();
  if (params?.status)    qs.set('status',    params.status);
  if (params?.patientId) qs.set('patientId', params.patientId);
  if (params?.doctorId)  qs.set('doctorId',  params.doctorId);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<Appointment[]>(`/appointments/admin${query}`);
};

/** Admin updates an appointment's status (all transitions allowed). */
export const updateAppointmentStatusAdmin = (
  id: string,
  status: AppointmentStatus,
  notes?: string,
) =>
  apiFetch<{ message: string }>(`/appointments/admin/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(notes !== undefined ? { notes } : {}) }),
  });

/** Admin hard-deletes an appointment record. */
export const deleteAppointmentAdmin = (id: string) =>
  apiFetch<{ message: string }>(`/appointments/admin/${id}`, {
    method: 'DELETE',
  });
