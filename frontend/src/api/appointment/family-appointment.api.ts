/**
 * src/api/appointment/family-appointment.api.ts
 * ─────────────────────────────────────────────
 * Backward-compatibility re-export.
 * All logic now lives in appointment.api.ts — import from there directly.
 */
export {
  createAppointment,
  getMyAppointments,
  cancelMyAppointment,
} from './appointment.api';
