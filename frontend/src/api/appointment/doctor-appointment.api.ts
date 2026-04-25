/**
 * src/api/appointment/doctor-appointment.api.ts
 * ──────────────────────────────────────────────
 * Backward-compatibility re-export.
 * All logic now lives in appointment.api.ts — import from there directly.
 */
export type { Appointment, AppointmentStatus } from './appointment.types';
export {
  getDoctorAppointments,
  updateAppointmentStatusDoctor,
} from './appointment.api';
