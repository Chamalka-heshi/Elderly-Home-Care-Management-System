import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllAppointmentsAdmin,
  updateAppointmentStatusAdmin,
  deleteAppointmentAdmin,
} from '../../../../api/appointment/admin-appointment.api';
import type { Appointment, AppointmentStatus } from '../../../../api/appointment/appointment.types';
import { fmt12, fmtDate, statusColor } from '../../../../api/appointment/appointment.types';
import { IconCalendar, IconFilter, IconTrash, IconUser ,IconX,IconCheck} from '../../common/icons';

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: AppointmentStatus }> = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusColor[status]}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${
      status === 'pending'   ? 'bg-amber-400 animate-pulse' :
      status === 'confirmed' ? 'bg-emerald-500' :
      status === 'cancelled' ? 'bg-red-400' : 'bg-slate-400'
    }`} />
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

// ── Confirmation modal ────────────────────────────────────────────────────────
interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onClose: () => void;
}
const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, confirmLabel, confirmClass, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      <div className="mt-5 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        <button onClick={onConfirm} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm ${confirmClass}`}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
interface Props {
  addToast: (kind: 'success' | 'error', message: string) => void;
}

const AppointmentRequests: React.FC<Props> = ({ addToast }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState<'' | AppointmentStatus>('');
  const [showFilters, setShowFilters]   = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | {
    id: string; action: 'approve' | 'cancel' | 'delete'; patientName: string;
  }>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllAppointmentsAdmin(
        filterStatus ? { status: filterStatus } : undefined,
      );
      setAppointments(data);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, addToast]);

  useEffect(() => { load(); }, [load]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total     = appointments.length;
    const pending   = appointments.filter(a => a.status === 'pending').length;
    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const uniquePts = new Set(appointments.map(a => a.patientId)).size;
    return { total, pending, confirmed, uniquePatients: uniquePts };
  }, [appointments]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { id, action } = confirmAction;
    try {
      if (action === 'delete') {
        await deleteAppointmentAdmin(id);
        addToast('success', 'Appointment deleted');
      } else {
        const status: AppointmentStatus = action === 'approve' ? 'confirmed' : 'cancelled';
        await updateAppointmentStatusAdmin(id, status);
        addToast('success', action === 'approve' ? 'Appointment approved!' : 'Appointment cancelled');
      }
      load();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Action failed');
    } finally {
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointment Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Review and approve patient appointment requests from family members</p>
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <IconFilter /> Filters {showFilters ? '▲' : '▼'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Requests',    value: stats.total,          color: 'slate' },
          { label: 'Pending Approval',  value: stats.pending,        color: 'amber' },
          { label: 'Confirmed',         value: stats.confirmed,      color: 'emerald' },
          { label: 'Unique Patients',   value: stats.uniquePatients, color: 'blue' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold text-${color}-600`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as '' | AppointmentStatus)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-800">
            All Appointment Requests
            {stats.pending > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {stats.pending}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500">{appointments.length} requests shown</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100">
              <IconCalendar />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-600">No appointment requests found</p>
            <p className="mt-1 text-xs text-slate-400">Requests from family members will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Requested By</th>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map(appt => (
                  <tr
                    key={appt.id}
                    className={`transition hover:bg-slate-50/60 ${appt.status === 'pending' ? 'bg-amber-50/30' : ''}`}
                  >
                    {/* Patient */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                          <IconUser />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{appt.patient?.fullName ?? '—'}</p>
                          <p className="text-xs text-slate-400">
                            {appt.patient?.gender ?? ''}{appt.patient?.bloodGroup ? ` · ${appt.patient.bloodGroup}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Requested by (family member) */}
                    <td className="px-5 py-3.5 text-slate-600">
                      <p className="font-medium">{appt.familyMember?.user?.fullName ?? '—'}</p>
                      <p className="text-xs text-slate-400">{appt.familyMember?.user?.email ?? ''}</p>
                    </td>

                    {/* Doctor */}
                    <td className="px-5 py-3.5 text-slate-600">
                      <p className="font-medium">{appt.slot?.doctor?.user?.fullName ?? '—'}</p>
                      <p className="text-xs text-slate-400">{appt.slot?.doctor?.specialization ?? ''}</p>
                    </td>

                    {/* Date & Time */}
                    <td className="px-5 py-3.5 text-slate-600">
                      <p className="font-medium">{appt.slot ? fmtDate(appt.slot.date) : '—'}</p>
                      <p className="text-xs text-slate-400">
                        {appt.slot ? `${fmt12(appt.slot.startTime)} – ${fmt12(appt.slot.endTime)}` : ''}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={appt.status} />
                    </td>

                    {/* Created at */}
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {new Date(appt.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {appt.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setConfirmAction({ id: appt.id, action: 'approve', patientName: appt.patient?.fullName ?? 'this patient' })}
                              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                            >
                              <IconCheck /> Approve
                            </button>
                            <button
                              onClick={() => setConfirmAction({ id: appt.id, action: 'cancel', patientName: appt.patient?.fullName ?? 'this patient' })}
                              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 active:scale-95"
                            >
                              <IconX /> Reject
                            </button>
                          </>
                        )}
                        {appt.status !== 'pending' && (
                          <button
                            onClick={() => setConfirmAction({ id: appt.id, action: 'delete', patientName: appt.patient?.fullName ?? 'this appointment' })}
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            <IconTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirmAction && (
        <ConfirmModal
          title={
            confirmAction.action === 'approve' ? 'Approve Appointment' :
            confirmAction.action === 'cancel'  ? 'Reject Appointment'  : 'Delete Appointment'
          }
          message={
            confirmAction.action === 'approve'
              ? `Confirm the appointment for ${confirmAction.patientName}? This will notify the family member.`
              : confirmAction.action === 'cancel'
              ? `Reject the appointment request for ${confirmAction.patientName}?`
              : `Permanently delete this appointment record for ${confirmAction.patientName}?`
          }
          confirmLabel={
            confirmAction.action === 'approve' ? 'Yes, Approve' :
            confirmAction.action === 'cancel'  ? 'Yes, Reject'  : 'Delete'
          }
          confirmClass={
            confirmAction.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
            'bg-red-600 hover:bg-red-700'
          }
          onConfirm={handleConfirm}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};

export default AppointmentRequests;
