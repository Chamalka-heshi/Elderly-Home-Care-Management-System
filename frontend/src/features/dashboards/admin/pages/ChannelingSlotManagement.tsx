import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import * as channelingApi from '../../../../api/channeling/admin-channeling.api';
import { getAllDoctors } from '../../../../api/users/admin-users.api';
import type { ChannelingSlot, SlotStatus } from '../../../../api/channeling/channeling.types';
import { bookingCutoffDate, fmt12, fmtDate, isBookingOpen } from '../../../../api/channeling/channeling.types';

import {
  IconCalendar,
  IconClock,
  IconPlus,
  IconX,
  IconTrash,
  IconBan,
  IconFilter,
  IconStethoscope,
  IconEdit,
} from '../../common/icons';

const today = () => new Date().toISOString().split('T')[0];

// Doctor name resolver - admin API returns flat Doctor objects (fullName at top level)
function resolveDoctorName(slot: ChannelingSlot, doctors: any[]): string {
  // Try nested slot.doctor first (populated by backend on slot fetch)
  const fromSlot =
    (slot.doctor as any)?.fullName ||
    slot.doctor?.user?.fullName;
  if (fromSlot) return fromSlot;

  // Fallback: look up from the separately-fetched doctors array
  const found = doctors.find((d) => d.id === slot.doctorId);
  return found?.fullName || 'Unknown Doctor';
}

function resolveDoctorSpecialization(slot: ChannelingSlot, doctors: any[]): string {
  const fromSlot = slot.doctor?.specialization;
  if (fromSlot) return fromSlot;
  const found = doctors.find((d) => d.id === slot.doctorId);
  return found?.specialization || '—';
}

function statusBadge(slot: ChannelingSlot) {
  if (slot.status === 'cancelled')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-100">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Cancelled
      </span>
    );
  if (slot.status === 'completed')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Completed
      </span>
    );
  if (slot.status === 'rejected')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-100">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Rejected
      </span>
    );
  if (slot.status === 'pending')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> Pending
      </span>
    );

  const slotEnd = new Date(`${slot.date}T${slot.endTime}:00`);
  const isPast = slotEnd < new Date();

  if (isPast)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Past
      </span>
    );
  if (isBookingOpen(slot))
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Booking Open
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Booking Closed
    </span>
  );
}

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10';

// ─── ADD SLOT MODAL ────────────────────────────────────────────────────────
interface AddSlotModalProps {
  doctors: any[];
  onClose: () => void;
  onCreated: () => void;
  addToast: (kind: 'success' | 'error', msg: string) => void;
}

const AddSlotModal: React.FC<AddSlotModalProps> = ({ doctors, onClose, onCreated, addToast }) => {
  const activeDoctors = doctors.filter((d) => d.isActive);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [maxPatients, setMaxPatients] = useState(20);
  const [cutoff, setCutoff] = useState(15);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedDoc = useMemo(() => activeDoctors.find((d) => d.id === doctorId), [activeDoctors, doctorId]);

  const parsedAvailableDays = useMemo(() => {
    if (!selectedDoc || !selectedDoc.availableDays) return [];
    let rawData: any = selectedDoc.availableDays;
    if (Array.isArray(rawData)) return rawData;
    if (typeof rawData === 'string') {
      try { rawData = JSON.parse(rawData); } catch (e) {}
      try { if (typeof rawData === 'string') rawData = JSON.parse(rawData); } catch (e) {}
      if (Array.isArray(rawData)) return rawData;
      if (typeof rawData === 'string') {
        return String(selectedDoc.availableDays)
          .replace(/[\[\]"'\\]/g, '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
    }
    return [];
  }, [selectedDoc]);

  const hasAvailability = parsedAvailableDays.length > 0 || (selectedDoc && selectedDoc.availableTimeStart);
  const validEndTimes = useMemo(() => TIMES.filter((t) => t > startTime), [startTime]);

  useEffect(() => {
    if (endTime <= startTime) setEndTime(validEndTimes[0] ?? '23:30');
  }, [startTime, endTime, validEndTimes]);

  const cutoffDisplay = useMemo(() => {
    if (!date || !startTime) return null;
    return bookingCutoffDate(date, startTime, cutoff).toLocaleString('en-GB', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short',
    });
  }, [date, startTime, cutoff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !date || !startTime || !endTime) {
      addToast('error', 'Please fill all required fields');
      return;
    }
    if (endTime <= startTime) {
      addToast('error', 'End time must be after start time');
      return;
    }
    try {
      setSaving(true);
      await channelingApi.createChannelingSlot({
        doctorId, date, startTime, endTime,
        bookingCutoffMinutes: cutoff,
        maxPatients,
        notes: notes || undefined,
      });
      addToast('success', 'Channeling slot created successfully. Waiting for doctor approval.');
      onCreated();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to create slot');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600 text-white">
              <IconCalendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">New Channeling Slot</p>
              <p className="text-xs text-slate-500">Assign a session time to a doctor</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Doctor <span className="text-red-500">*</span></label>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={inputCls} required>
              <option value="">— Select active doctor —</option>
              {activeDoctors.map((d) => (
                <option key={d.id} value={d.id}>{d.fullName} · {d.specialization}</option>
              ))}
            </select>

            {selectedDoc && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-blue-50/70 px-3 py-2 text-[11px] text-blue-800 ring-1 ring-blue-100/50">
                <IconClock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                {hasAvailability ? (
                  <span>
                    <strong className="font-semibold text-blue-900 mr-1">Preferred:</strong>
                    {parsedAvailableDays.length > 0 ? parsedAvailableDays.join(', ') : 'Any day'}
                    {selectedDoc.availableTimeStart && selectedDoc.availableTimeEnd
                      ? ` (${fmt12(selectedDoc.availableTimeStart)} - ${fmt12(selectedDoc.availableTimeEnd)})`
                      : ''}
                  </span>
                ) : (
                  <span className="italic text-blue-600/70">No availability set by this doctor yet.</span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Date <span className="text-red-500">*</span></label>
            <input type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Start Time <span className="text-red-500">*</span></label>
              <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} required>
                {TIMES.map((t) => <option key={t} value={t}>{fmt12(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">End Time <span className="text-red-500">*</span></label>
              <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} required>
                {validEndTimes.map((t) => <option key={t} value={t}>{fmt12(t)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Booking Cutoff (min before start)</label>
              <input type="number" min={5} max={120} value={cutoff} onChange={(e) => setCutoff(Number(e.target.value))} className={inputCls} />
              {cutoffDisplay && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                  <IconClock className="h-3 w-3" /> Bookings close at {cutoffDisplay}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Max Patients</label>
              <input type="number" min={1} max={200} value={maxPatients} onChange={(e) => setMaxPatients(Number(e.target.value))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Notes (optional)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Cardiology clinic only" className={`${inputCls} resize-none`} />
          </div>

          <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500 ring-1 ring-slate-100">
            ℹ️ Doctors can be assigned slots on a maximum of <strong>3 days per week</strong>.
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <IconPlus />}
              {saving ? 'Creating…' : 'Create Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── EDIT SLOT MODAL ───────────────────────────────────────────────────────
interface EditSlotModalProps {
  slot: ChannelingSlot;
  doctors: any[];
  onClose: () => void;
  onUpdated: () => void;
  addToast: (kind: 'success' | 'error', msg: string) => void;
}

const EditSlotModal: React.FC<EditSlotModalProps> = ({ slot, doctors, onClose, onUpdated, addToast }) => {
  const [startTime, setStartTime] = useState(slot.startTime);
  const [endTime, setEndTime] = useState(slot.endTime);
  const [maxPatients, setMaxPatients] = useState(slot.maxPatients);
  const [cutoff, setCutoff] = useState(slot.bookingCutoffMinutes);
  const [notes, setNotes] = useState(slot.notes ?? '');
  const [saving, setSaving] = useState(false);

  const doctorName = resolveDoctorName(slot, doctors);
  const doctorSpec = resolveDoctorSpecialization(slot, doctors);
  const doctorObj  = doctors.find((d) => d.id === slot.doctorId);

  const validEndTimes = useMemo(() => TIMES.filter((t) => t > startTime), [startTime]);
  useEffect(() => {
    if (endTime <= startTime) setEndTime(validEndTimes[0] ?? '23:30');
  }, [startTime, endTime, validEndTimes]);

  const cutoffDisplay = useMemo(() =>
    bookingCutoffDate(slot.date, startTime, cutoff).toLocaleString('en-GB', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short',
    }),
    [slot.date, startTime, cutoff]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endTime <= startTime) return addToast('error', 'End time must be after start time');
    try {
      setSaving(true);
      await channelingApi.updateChannelingSlot(slot.id, {
        startTime, endTime, maxPatients, bookingCutoffMinutes: cutoff, notes: notes || undefined,
      });
      addToast('success', 'Channeling slot updated successfully');
      onUpdated();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to update slot');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl my-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-white">
              <IconEdit className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Edit Channeling Slot</p>
              <p className="text-xs text-slate-500">Pending — changes require doctor re-approval</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">

          {/* ── Doctor info (read-only) ── */}
          <div className="px-6 py-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Doctor Details</p>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100">
                <IconStethoscope className="h-5 w-5 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800 truncate">{doctorName}</p>
                <p className="text-xs text-slate-500">{doctorSpec}</p>
                {doctorObj?.availableTimeStart && doctorObj?.availableTimeEnd && (
                  <p className="mt-0.5 text-xs text-blue-600 font-medium">
                    Preferred: {fmt12(doctorObj.availableTimeStart)} – {fmt12(doctorObj.availableTimeEnd)}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-xl bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-100">
                Pending
              </span>
            </div>
          </div>

          {/* ── Slot identity (read-only) ── */}
          <div className="px-6 py-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Slot Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold text-slate-400">Date</p>
                <p className="mt-0.5 text-sm font-bold text-slate-800">{fmtDate(slot.date)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold text-slate-400">Slot ID</p>
                <p className="mt-0.5 truncate text-xs font-mono text-slate-500">{slot.id.slice(0,18)}…</p>
              </div>
            </div>
          </div>

          {/* ── Editable fields ── */}
          <div className="space-y-4 px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Edit Timings &amp; Capacity</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Start Time <span className="text-red-500">*</span></label>
                <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} required>
                  {TIMES.map((t) => <option key={t} value={t}>{fmt12(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">End Time <span className="text-red-500">*</span></label>
                <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} required>
                  {validEndTimes.map((t) => <option key={t} value={t}>{fmt12(t)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Booking Cutoff (min before)</label>
                <input type="number" min={5} max={120} value={cutoff} onChange={(e) => setCutoff(Number(e.target.value))} className={inputCls} />
                <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                  <IconClock className="h-3 w-3" /> Closes at {cutoffDisplay}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Max Patients</label>
                <input type="number" min={1} max={200} value={maxPatients} onChange={(e) => setMaxPatients(Number(e.target.value))} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Notes (optional)</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Cardiology clinic only" className={`${inputCls} resize-none`} />
            </div>

            <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-[11px] text-amber-700 ring-1 ring-amber-100">
              ⚠️ Editing a pending slot will require the doctor to re-approve it.
            </p>
          </div>

          {/* ── Footer ── */}
          <div className="flex justify-end gap-3 px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-60">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <IconEdit />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── SLOT CARD ─────────────────────────────────────────────────────────────
interface SlotCardProps {
  slot: ChannelingSlot;
  doctors: any[]; // ← ADDED
  onEdit: (slot: ChannelingSlot) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, doctors, onEdit, onCancel, onDelete }) => {
  const slotEnd = new Date(`${slot.date}T${slot.endTime}:00`);
  const isPast = slotEnd < new Date();
  const isCancelled = slot.status === 'cancelled';
  const isRejected = slot.status === 'rejected';

  // FIX: Always resolved from doctors array as fallback
  const doctorName = resolveDoctorName(slot, doctors);
  const doctorSpec = resolveDoctorSpecialization(slot, doctors);

  return (
    <div className={`group relative rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
      isCancelled || isRejected ? 'border-red-100 opacity-70' : isPast ? 'border-slate-200 opacity-80' : 'border-slate-200 hover:-translate-y-0.5'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50">
            <IconStethoscope className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="min-w-0">
            {/* FIX: doctorName always resolved */}
            <p className="truncate text-sm font-bold text-slate-800">{doctorName}</p>
            <p className="truncate text-xs text-slate-500">{doctorSpec}</p>
          </div>
        </div>
        {statusBadge(slot)}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
        <IconCalendar className="h-4 w-4 shrink-0 text-emerald-600" />
        <span className="text-xs font-semibold text-slate-700">{fmtDate(slot.date)}</span>
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
        <IconClock className="h-4 w-4 shrink-0 text-emerald-700" />
        <span className="text-xs font-bold text-emerald-800">{fmt12(slot.startTime)} – {fmt12(slot.endTime)}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-lg bg-slate-100 px-2 py-0.5">Max {slot.maxPatients} patients</span>
        <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-amber-700">Booking closes {slot.bookingCutoffMinutes} min before</span>
      </div>

      {slot.notes && <p className="mt-2 text-xs italic text-slate-500 line-clamp-1">{slot.notes}</p>}

      {!isCancelled && !isPast && !isRejected && (
        <div className="mt-3 flex justify-end gap-2">
          {/* Only show Edit & Delete when still pending — once doctor approves (active), lock those actions */}
          {slot.status !== 'active' && (
            <>
              <button onClick={() => onEdit(slot)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                <IconEdit className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => onDelete(slot.id)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700">
                <IconTrash className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          )}
          <button onClick={() => onCancel(slot.id)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700">
            <IconBan className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      )}
      {(isCancelled || isPast || isRejected) && (
        <div className="mt-3 flex justify-end">
          <button onClick={() => onDelete(slot.id)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700">
            <IconTrash className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ─── WEEKLY STRIP ──────────────────────────────────────────────────────────
interface WeeklyStripProps {
  slots: ChannelingSlot[];
  doctors: any[];
}

const WeeklyStrip: React.FC<WeeklyStripProps> = ({ slots, doctors }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const activeDoctors = doctors.filter((d) => d.isActive);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().split('T')[0];
  }), []);

  const relevantSlots = useMemo(() => slots.filter((s) =>
    (s.status === 'active' || s.status === 'pending') &&
    days.includes(s.date) &&
    (selectedDoctorId ? s.doctorId === selectedDoctorId : true)
  ), [slots, days, selectedDoctorId]);

  const slotsByDay = useMemo(() => {
    const map: Record<string, ChannelingSlot[]> = {};
    for (const d of days) map[d] = [];
    for (const s of relevantSlots) { if (map[s.date]) map[s.date].push(s); }
    return map;
  }, [relevantSlots, days]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">7-Day Schedule Overview</h3>
          <p className="text-xs text-slate-500">Active and Pending slots for the next 7 days</p>
        </div>
        <select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10">
          <option value="">All Doctors</option>
          {activeDoctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
        </select>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const daySlots = slotsByDay[day];
          const isToday = day === today();
          return (
            <div key={day} className="min-h-[90px]">
              <div className={`mb-1 rounded-xl px-2 py-1.5 text-center ${isToday ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'}`}>
                <p className="text-[10px] font-semibold">{new Date(day + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                <p className="text-xs font-bold">{new Date(day + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
              </div>
              <div className="space-y-0.5">
                {daySlots.map((s) => {
                  // FIX: Tooltip uses resolved name
                  const name = resolveDoctorName(s, doctors);
                  return (
                    <div
                      key={s.id}
                      title={`${name} · ${fmt12(s.startTime)}–${fmt12(s.endTime)}`}
                      className={`truncate rounded-lg px-1.5 py-1 text-[10px] font-semibold ring-1 ${s.status === 'pending' ? 'bg-amber-50 text-amber-800 ring-amber-100' : 'bg-emerald-50 text-emerald-800 ring-emerald-100'}`}
                    >
                      {fmt12(s.startTime)}
                    </div>
                  );
                })}
                {daySlots.length === 0 && (
                  <div className="rounded-lg bg-slate-50 px-1.5 py-1 text-center text-[10px] text-slate-300">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
interface Props { addToast: (kind: 'success' | 'error', message: string) => void; }

const ChannelingSlotManagement: React.FC<Props> = ({ addToast }) => {
  const [slots, setSlots] = useState<ChannelingSlot[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ChannelingSlot | null>(null);

  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | SlotStatus>('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const addToastRef = useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [slotsData, doctorsData] = await Promise.all([
        channelingApi.getChannelingSlots({
          doctorId: filterDoctor || undefined,
          status: (filterStatus || undefined) as SlotStatus | undefined,
          fromDate: filterFromDate || undefined,
          toDate: filterToDate || undefined,
        }),
        getAllDoctors(),
      ]);
      setSlots(slotsData.slots);
      setDoctors(doctorsData.doctors);
    } catch (err) {
      addToastRef.current('error', err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filterDoctor, filterStatus, filterFromDate, filterToDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCancelSlot = async (id: string) => {
    if (!window.confirm('Cancel this channeling slot?')) return;
    try {
      const res = await channelingApi.cancelChannelingSlot(id);
      addToast('success', res.message);
      loadData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to cancel slot');
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!window.confirm('Permanently delete this slot?')) return;
    try {
      const res = await channelingApi.deleteChannelingSlot(id);
      addToast('success', res.message);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete slot');
    }
  };

  const handleSlotCreated = () => { loadData(); setShowAddModal(false); };
  const handleSlotUpdated = () => { loadData(); setEditingSlot(null); };

  const stats = useMemo(() => {
    const upcomingActive = slots.filter((s) => s.status === 'active' && s.date >= today());
    const bookingOpen = upcomingActive.filter(isBookingOpen);
    const uniqueDoctors = new Set(upcomingActive.map((s) => s.doctorId)).size;
    return { total: slots.length, upcomingActive: upcomingActive.length, bookingOpen: bookingOpen.length, uniqueDoctors };
  }, [slots]);

  const filterInputCls = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Channeling Slot Management</h1>
          <p className="mt-1 text-sm text-slate-500">Assign channeling time slots to doctors · patients book during the open window</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-700">
          <IconPlus className="h-4 w-4" /> New Channeling Slot
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Slots', value: stats.total, color: 'slate' },
          { label: 'Upcoming Active', value: stats.upcomingActive, color: 'emerald' },
          { label: 'Booking Open', value: stats.bookingOpen, color: 'green' },
          { label: 'Doctors Scheduled', value: stats.uniqueDoctors, color: 'blue' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold text-${color}-600`}>{value}</p>
          </div>
        ))}
      </div>

      <WeeklyStrip slots={slots} doctors={doctors} />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800">All Slots</h3>
          <button onClick={() => setShowFilters((f) => !f)} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <IconFilter /> Filters {showFilters ? '▲' : '▼'}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">Doctor</label>
              <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} className={filterInputCls + ' w-full'}>
                <option value="">All Doctors</option>
                {doctors.filter((d) => d.isActive).map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as '' | SlotStatus)} className={filterInputCls + ' w-full'}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">From Date</label>
              <input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} className={filterInputCls + ' w-full'} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">To Date</label>
              <input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} className={filterInputCls + ' w-full'} />
            </div>
          </div>
        )}

        <div className="mt-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100">
                <IconCalendar className="h-8 w-8 text-slate-400" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-600">No channeling slots found</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {slots.map((slot) => (
                // FIX: doctors passed into SlotCard
                <SlotCard key={slot.id} slot={slot} doctors={doctors} onEdit={setEditingSlot} onCancel={handleCancelSlot} onDelete={handleDeleteSlot} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddSlotModal doctors={doctors} onClose={() => setShowAddModal(false)} onCreated={handleSlotCreated} addToast={addToast} />
      )}
      {editingSlot && (
        // FIX: doctors passed into EditSlotModal
        <EditSlotModal slot={editingSlot} doctors={doctors} onClose={() => setEditingSlot(null)} onUpdated={handleSlotUpdated} addToast={addToast} />
      )}
    </div>
  );
};

export default ChannelingSlotManagement;