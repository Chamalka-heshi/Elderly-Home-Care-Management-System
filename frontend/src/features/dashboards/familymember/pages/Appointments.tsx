/**
 * src/features/dashboards/familymember/pages/Appointments.tsx
 * ─────────────────────────────────────────────────────────────
 * Family member: pick a patient → browse active channeling slots → book.
 * Shows the family member's existing bookings with cancel support.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { getMyPatients } from '../../../../api/patients/family-patient.api';
import { getAvailableSlots } from '../../../../api/channeling/public-channeling.api';
import {
  createAppointment,
  getMyAppointments,
  cancelMyAppointment,
} from '../../../../api/appointment/family-appointment.api';
import {
  getFamilyPrescriptions,
  type FamilyPrescription,
} from '../../../../api/prescriptions/family-prescription.api';
import type { Patient } from '../../../../api/patients/patient.types';
import type { ChannelingSlot } from '../../../../api/channeling/channeling.types';
import { fmt12, fmtDate } from '../../../../api/channeling/channeling.types';
import type { Appointment } from '../../../../api/appointment/appointment.types';
import { statusColor, fmtDate as fmtApptDate } from '../../../../api/appointment/appointment.types';

// ── Style helpers ─────────────────────────────────────────────────────────────
const inputCls =
  'w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10';

// ── Icon helper ───────────────────────────────────────────────────────────────
const Ico = ({ d, cls = 'h-4 w-4' }: { d: string; cls?: string }) => (
  <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const docIcon = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
const eyeIcon = 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z';
const pillIcon = 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18';
const closeIcon = 'M6 18L18 6M6 6l12 12';

// ── Prescription detail modal (family read-only) ───────────────────────────────
const PrescriptionModal: React.FC<{ rx: FamilyPrescription; onClose: () => void }> = ({ rx, onClose }) => {
  const fmtD = (d?: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };
  const statusBg    = rx.status === 'active' ? '#d1fae5' : rx.status === 'completed' ? '#dbeafe' : '#fee2e2';
  const statusClr   = rx.status === 'active' ? '#065f46' : rx.status === 'completed' ? '#1e40af' : '#991b1b';
  const statusLabel = rx.status === 'active' ? 'Active' : rx.status === 'completed' ? 'Completed' : 'Discontinued';
  const doctorName  = rx.doctor?.user?.fullName ? `Dr. ${rx.doctor.user.fullName}` : null;

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-10">
      <button className="fixed inset-0" onClick={onClose} type="button" aria-label="Close" />
      <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl">
        {/* status bar */}
        <div className={`h-1.5 rounded-t-3xl ${
          rx.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
          : rx.status === 'completed' ? 'bg-gradient-to-r from-blue-400 to-blue-500'
          : 'bg-gradient-to-r from-red-300 to-red-400'
        }`} />
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50">
              <Ico d={docIcon} cls="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Prescription</p>
              <p className="text-xs text-slate-400">ID: {rx.id.slice(0,8)}…</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition">
            <Ico d={closeIcon} cls="h-5 w-5" />
          </button>
        </div>
        {/* body */}
        <div className="p-6 space-y-5">
          {/* status + dates */}
          <div className="flex items-center justify-between">
            <span style={{ display:'inline-block', padding:'4px 14px', borderRadius:999, fontSize:'.75rem', fontWeight:700, background:statusBg, color:statusClr }}>
              {statusLabel}
            </span>
            <p className="text-xs text-slate-400">Issued {fmtD(rx.issuedDate)}{rx.validUntil ? ` · Valid until ${fmtD(rx.validUntil)}` : ''}</p>
          </div>
          {/* patient + doctor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient</p>
              <p className="mt-1 font-bold text-slate-900">{rx.patientName}</p>
              <p className="text-sm text-slate-500">Age {rx.patientAge}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doctor</p>
              <p className="mt-1 font-bold text-slate-900">{doctorName ?? '—'}</p>
              {rx.doctor?.specialization && <p className="text-sm text-slate-500">{rx.doctor.specialization}</p>}
            </div>
          </div>
          {rx.diagnosis && (
            <div className="rounded-2xl bg-blue-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Diagnosis</p>
              <p className="mt-1 text-sm font-medium text-blue-900">{rx.diagnosis}</p>
            </div>
          )}
          {/* medicines */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Medicines ({rx.medicines.length})
            </p>
            <div className="space-y-2">
              {rx.medicines.map((m, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{i+1}</div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{m.medicineName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{m.dosage} · {m.frequency} · {m.durationDays} day{m.durationDays !== 1 ? 's' : ''}</p>
                    {m.instructions && (
                      <span className="mt-1 inline-flex rounded-lg bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{m.instructions}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {rx.notes && (
            <div className="rounded-2xl bg-amber-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Notes</p>
              <p className="mt-1 text-sm text-amber-900">{rx.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface SlotCardProps {
  slot: ChannelingSlot;
  onBook: (slot: ChannelingSlot) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, onBook }) => (
  <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-sm font-bold text-slate-800">
          {slot.doctor?.user?.fullName ?? 'Doctor'}
        </p>
        <p className="text-xs text-slate-500">{slot.doctor?.specialization ?? ''}</p>
      </div>
      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
        Open
      </span>
    </div>

    <div className="mt-3 space-y-1.5">
      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
        <span className="text-slate-400">📅</span>
        <span className="font-semibold text-slate-700">{fmtDate(slot.date)}</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs">
        <span className="text-emerald-500">🕐</span>
        <span className="font-semibold text-emerald-800">
          {fmt12(slot.startTime)} – {fmt12(slot.endTime)}
        </span>
      </div>
    </div>

    {slot.notes && (
      <p className="mt-2 text-xs italic text-slate-400 line-clamp-1">{slot.notes}</p>
    )}

    <button
      onClick={() => onBook(slot)}
      className="mt-4 w-full rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 active:scale-95"
    >
      Book Appointment
    </button>
  </div>
);

// ── Confirm Booking Modal ─────────────────────────────────────────────────────

interface BookModalProps {
  slot: ChannelingSlot;
  patient: Patient;
  onConfirm: (notes: string) => void;
  onClose: () => void;
  loading: boolean;
}

const BookModal: React.FC<BookModalProps> = ({ slot, patient, onConfirm, onClose, loading }) => {
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-sm font-bold text-slate-800">Confirm Booking</p>
            <p className="text-xs text-slate-500">Review and confirm appointment details</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient</span>
              <span className="font-semibold text-slate-800">{patient.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Doctor</span>
              <span className="font-semibold text-slate-800">{slot.doctor?.user?.fullName ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-semibold text-slate-800">{fmtDate(slot.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Time</span>
              <span className="font-semibold text-slate-800">{fmt12(slot.startTime)} – {fmt12(slot.endTime)}</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or information for the doctor…"
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(notes)}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {loading ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const Appointments: React.FC = () => {
  const [tab, setTab] = useState<'book' | 'mine'>('book');

  // Data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [slots, setSlots] = useState<ChannelingSlot[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<FamilyPrescription[]>([]);

  // UI state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState<ChannelingSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);
  const [viewRx, setViewRx] = useState<FamilyPrescription | null>(null);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) ?? null,
    [patients, selectedPatientId]
  );

  // Build a map: appointmentId → prescription (for O(1) lookup)
  const prescriptionByAppt = useMemo<Record<string, FamilyPrescription>>(() => {
    const map: Record<string, FamilyPrescription> = {};
    for (const rx of prescriptions) {
      if (rx.appointmentId) map[rx.appointmentId] = rx;
    }
    return map;
  }, [prescriptions]);

  const showToast = (kind: 'success' | 'error', msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [patientsRes, slotsRes, apptRes, rxRes] = await Promise.all([
          getMyPatients(),
          getAvailableSlots(),
          getMyAppointments(),
          getFamilyPrescriptions().catch(() => ({ data: [] as FamilyPrescription[], total: 0 })),
        ]);
        const activePats = (patientsRes.patients ?? []).filter((p) => p.isActive);
        setPatients(activePats);
        if (activePats.length > 0) setSelectedPatientId(activePats[0].id);
        setSlots(Array.isArray(slotsRes) ? slotsRes : []);
        setMyAppointments(Array.isArray(apptRes) ? apptRes : []);
        setPrescriptions(rxRes.data ?? []);
      } catch (err: any) {
        showToast('error', err.message ?? 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleBook = async (notes: string) => {
    if (!bookingSlot || !selectedPatientId) return;
    try {
      setBookingLoading(true);
      const newAppt = await createAppointment({
        slotId: bookingSlot.id,
        patientId: selectedPatientId,
        notes: notes || undefined,
      });
      setMyAppointments((prev) => [newAppt, ...prev]);
      setBookingSlot(null);
      showToast('success', 'Appointment booked successfully!');
    } catch (err: any) {
      showToast('error', err.message ?? 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      setCancellingId(id);
      await cancelMyAppointment(id);
      setMyAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' as const } : a))
      );
      showToast('success', 'Appointment cancelled.');
    } catch (err: any) {
      showToast('error', err.message ?? 'Failed to cancel');
    } finally {
      setCancellingId(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={[
          'fixed right-4 top-4 z-[100] flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-xl',
          toast.kind === 'success' ? 'bg-emerald-600' : 'bg-red-600',
        ].join(' ')}>
          {toast.kind === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
        <p className="text-sm text-slate-500">Book channeling slots for your patients or view existing appointments.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 w-fit">
        {(['book', 'mine'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'rounded-xl px-5 py-2 text-sm font-semibold transition',
              tab === t ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100',
            ].join(' ')}
          >
            {t === 'book' ? '📅 Book Appointment' : '📋 My Appointments'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
        </div>
      ) : tab === 'book' ? (
        // ── BOOK TAB ───────────────────────────────────────────────────────────
        <div className="space-y-5">
          {/* Patient selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Patient
            </label>
            {patients.length === 0 ? (
              <p className="text-sm text-slate-500">
                No active patients found. Please add a patient in <strong>Elderly Profile</strong> first.
              </p>
            ) : (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className={inputCls}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} — NIC: {p.nic}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Slots grid */}
          {patients.length > 0 && (
            <>
              <p className="text-sm font-semibold text-slate-600">
                Available Channeling Slots ({slots.length})
              </p>
              {slots.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-3xl">📅</div>
                  <p className="mt-4 text-sm font-semibold text-slate-600">No open slots right now</p>
                  <p className="mt-1 text-xs text-slate-400">Check back soon — new slots are added regularly.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {slots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onBook={(s) => selectedPatient && setBookingSlot(s)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // ── MY APPOINTMENTS TAB ───────────────────────────────────────────────
        <div className="space-y-4">
          {myAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-3xl">📋</div>
              <p className="mt-4 text-sm font-semibold text-slate-600">No appointments yet</p>
              <button
                onClick={() => setTab('book')}
                className="mt-3 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
              >
                Book Your First Appointment
              </button>
            </div>
          ) : (
            myAppointments.map((appt) => {
              const linkedRx = appt.prescriptionId
                ? prescriptionByAppt[appt.id] ?? null
                : null;
              return (
                <div key={appt.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* Appointment header */}
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {appt.slot?.doctor?.user?.fullName ?? 'Doctor'}
                        </p>
                        <p className="text-xs text-slate-500">{appt.slot?.doctor?.specialization ?? ''}</p>
                      </div>
                      <span className={[
                        'rounded-full px-3 py-0.5 text-[11px] font-semibold ring-1',
                        statusColor[appt.status],
                      ].join(' ')}>
                        {appt.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-slate-400">Patient</p>
                        <p className="mt-0.5 font-semibold text-slate-700">{appt.patient?.fullName}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-slate-400">Date</p>
                        <p className="mt-0.5 font-semibold text-slate-700">{fmtApptDate(appt.slot?.date ?? '')}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-slate-400">Time</p>
                        <p className="mt-0.5 font-semibold text-slate-700">
                          {fmt12(appt.slot?.startTime ?? '')} – {fmt12(appt.slot?.endTime ?? '')}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-slate-400">Booked on</p>
                        <p className="mt-0.5 font-semibold text-slate-700">
                          {new Date(appt.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {appt.notes && (
                      <p className="mt-2 text-xs italic text-slate-500">Notes: {appt.notes}</p>
                    )}

                    {appt.status === 'pending' && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleCancel(appt.id)}
                          disabled={cancellingId === appt.id}
                          className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          {cancellingId === appt.id && (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          )}
                          Cancel Appointment
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Prescription section (shown when linked) ── */}
                  {linkedRx ? (
                    <div className="border-t border-emerald-100 bg-emerald-50/60 px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                            <Ico d={docIcon} cls="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-800">Prescription Issued</p>
                            <p className="text-[11px] text-emerald-600">
                              {linkedRx.medicines.length} medicine{linkedRx.medicines.length !== 1 ? 's' : ''}
                              {linkedRx.diagnosis ? ` · ${linkedRx.diagnosis}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewRx(linkedRx)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                        >
                          <Ico d={eyeIcon} cls="h-3.5 w-3.5" /> View Rx
                        </button>
                      </div>
                      {/* Medicine pill badges */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {linkedRx.medicines.slice(0, 4).map((m, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                            <Ico d={pillIcon} cls="h-3 w-3" />
                            {m.medicineName}
                          </span>
                        ))}
                        {linkedRx.medicines.length > 4 && (
                          <span className="inline-flex items-center rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                            +{linkedRx.medicines.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : appt.status === 'completed' ? (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                      <p className="text-xs text-slate-400 italic">No prescription linked to this appointment.</p>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Book Confirmation Modal */}
      {bookingSlot && selectedPatient && (
        <BookModal
          slot={bookingSlot}
          patient={selectedPatient}
          onConfirm={handleBook}
          onClose={() => setBookingSlot(null)}
          loading={bookingLoading}
        />
      )}

      {/* Prescription Detail Modal */}
      {viewRx && <PrescriptionModal rx={viewRx} onClose={() => setViewRx(null)} />}
    </div>
  );
};

export default Appointments;