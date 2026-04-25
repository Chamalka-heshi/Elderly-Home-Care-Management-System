/**
 * src/api/appointment/admin-appointment.api.ts
 * ─────────────────────────────────────────────
 * Backward-compatibility re-export.
 * All logic now lives in appointment.api.ts — import from there directly.
 */
export {
  getAllAppointmentsAdmin,
  updateAppointmentStatusAdmin,
  deleteAppointmentAdmin,
} from './appointment.api';
