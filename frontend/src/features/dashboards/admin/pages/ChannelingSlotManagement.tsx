import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as channelingApi from "../../../../api/channeling/admin-channeling.api";
import { getAllDoctors } from "../../../../api/users/admin-users.api";
import type { ChannelingSlot, SlotStatus } from "../../../../api/channeling/channeling.types";
import { bookingCutoffDate, fmt12, fmtDate, isBookingOpen } from "../../../../api/channeling/channeling.types";
import {
  IconCalendar,
  IconClock,
  IconPlus,
  IconX,
  IconTrash,
  IconBan,
  IconFilter,
  IconEdit,
} from "../../common/icons";

const today = () => new Date().toISOString().split("T")[0];

// Helper functions for resolving doctor data and availability

function resolveDoctorName(slot: ChannelingSlot, doctors: any[]): string {
  const fromSlot = (slot.doctor as any)?.fullName || slot.doctor?.user?.fullName;
  if (fromSlot) return fromSlot;
  const found = doctors.find((d) => d.id === slot.doctorId);
  return found?.fullName || "Unknown Doctor";
}

function resolveDoctorSpecialization(slot: ChannelingSlot, doctors: any[]): string {
  const fromSlot = slot.doctor?.specialization;
  if (fromSlot) return fromSlot;
  const found = doctors.find((d) => d.id === slot.doctorId);
  return found?.specialization || "—";
}

// Component that renders the status badge for a channeling slot

function statusBadge(slot: ChannelingSlot) {
  if (slot.status === "cancelled")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 ring-1 ring-red-100">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Cancelled
      </span>
    );
  if (slot.status === "completed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Completed
      </span>
    );
  if (slot.status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 ring-1 ring-red-100">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Rejected
      </span>
    );
  if (slot.status === "pending")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> Pending
      </span>
    );

  const slotEnd = new Date(`${slot.date}T${slot.endTime}:00`);
  const isPast = slotEnd < new Date();

  // Badge for past slots
  if (isPast)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Past
      </span>
    );
  // Badge for slots where booking is currently open
  if (isBookingOpen(slot))
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Booking Open
      </span>
    );
  // Badge for slots where booking is closed
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Booking Closed
    </span>
  );
}

function slotAccentColor(slot: ChannelingSlot): string {
  if (slot.status === "cancelled" || slot.status === "rejected") return "from-red-400 to-rose-500";
  if (slot.status === "completed") return "from-slate-300 to-slate-400";
  if (slot.status === "pending") return "from-amber-400 to-orange-500";
  const slotEnd = new Date(`${slot.date}T${slot.endTime}:00`);
  if (slotEnd < new Date()) return "from-slate-300 to-slate-400";
  if (isBookingOpen(slot)) return "from-emerald-400 to-teal-500";
  return "from-blue-400 to-indigo-500";
}

// Time slot generation and input styling constants

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10";

// Modal component for creating a new channeling slot

interface AddSlotModalProps {
  doctors: any[];
  onClose: () => void;
  onCreated: () => void;
  addToast: (kind: "success" | "error", msg: string) => void;
}

const AddSlotModal: React.FC<AddSlotModalProps> = ({ doctors, onClose, onCreated, addToast }) => {
  const activeDoctors = doctors.filter((d) => d.isActive);
  const [doctorId, setDoctorId]           = useState("");
  const [date, setDate]                   = useState("");
  const [startTime, setStartTime]         = useState("08:00");
  const [endTime, setEndTime]             = useState("10:00");
  const [maxPatients, setMaxPatients]     = useState(20);
  const [cutoff, setCutoff]               = useState(15);
  const [notes, setNotes]                 = useState("");
  const [careHomeFee, setCareHomeFee]     = useState<number | "">("");
  const [saving, setSaving]               = useState(false);

  const selectedDoc = useMemo(() => activeDoctors.find((d) => d.id === doctorId), [activeDoctors, doctorId]);

  const parsedAvailableDays = useMemo(() => {
    if (!selectedDoc?.availableDays) return [];
    let raw: any = selectedDoc.availableDays;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch {}
      if (Array.isArray(raw)) return raw;
    }
    return [];
  }, [selectedDoc]);

  const hasAvailability = parsedAvailableDays.length > 0 || selectedDoc?.availableTimeStart;
  const validEndTimes = useMemo(() => TIMES.filter((t) => t > startTime), [startTime]);

  useEffect(() => {
    if (endTime <= startTime) setEndTime(validEndTimes[0] ?? "23:30");
  }, [startTime, endTime, validEndTimes]);

  const cutoffDisplay = useMemo(() => {
    if (!date || !startTime) return null;
    return bookingCutoffDate(date, startTime, cutoff).toLocaleString("en-GB", {
      hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short",
    });
  }, [date, startTime, cutoff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !date || !startTime || !endTime) {
      addToast("error", "Please fill all required fields");
      return;
    }
    if (endTime <= startTime) {
      addToast("error", "End time must be after start time");
      return;
    }
    try {
      setSaving(true);
      await channelingApi.createChannelingSlot({
        doctorId, date, startTime, endTime,
        bookingCutoffMinutes: cutoff,
        maxPatients,
        notes: notes || undefined,
        careHomeFee: careHomeFee !== "" ? careHomeFee : undefined,
      });
      addToast("success", "Channeling slot created. Waiting for doctor approval.");
      onCreated();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to create slot");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <IconCalendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">New Channeling Slot</p>
              <p className="text-xs text-slate-500">Assign a session time to a doctor</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Doctor <span className="text-red-500">*</span>
            </label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className={inputCls}
              required
            >
              <option value="">— Select active doctor —</option>
              {activeDoctors.map((d) => (
                <option key={d.id} value={d.id}>{d.fullName} · {d.specialization}</option>
              ))}
            </select>

            {selectedDoc && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-sm">{selectedDoc.fullName}</p>
                    <p className="text-xs text-slate-500">{selectedDoc.specialization}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <IconClock className="h-3 w-3 text-blue-500 shrink-0" />
                      {hasAvailability ? (
                        <span className="text-[11px] text-blue-700 font-medium">
                          {parsedAvailableDays.length > 0 ? parsedAvailableDays.join(", ") : "Any day"}
                          {selectedDoc.availableTimeStart && selectedDoc.availableTimeEnd
                            ? ` · ${fmt12(selectedDoc.availableTimeStart)} – ${fmt12(selectedDoc.availableTimeEnd)}`
                            : ""}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No availability preferences set</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex items-center rounded-xl bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Date <span className="text-red-500">*</span></label>
              <input type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
            </div>
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Cutoff (min)</label>
              <input type="number" min={5} max={120} value={cutoff} onChange={(e) => setCutoff(Number(e.target.value))} className={inputCls} />
              {cutoffDisplay && (
                <p className="mt-1 flex items-center gap-1 text-[10px] text-amber-600">
                  <IconClock className="h-3 w-3" /> Closes {cutoffDisplay}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Max Patients</label>
              <input type="number" min={1} max={200} value={maxPatients} onChange={(e) => setMaxPatients(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Care Home Fee <span className="font-normal text-slate-400 text-[10px]">(LKR, opt.)</span>
              </label>
              <input
                type="number" min={0} step={0.01} value={careHomeFee}
                onChange={(e) => setCareHomeFee(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 500" className={inputCls}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Notes <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Cardiology clinic only" className={`${inputCls} resize-none`} />
          </div>

          {/* Information regarding doctor assignment limits and approval */}
          <p className="rounded-xl bg-blue-50/80 px-4 py-2.5 text-[11px] text-blue-700 ring-1 ring-blue-100">
            ℹ️ Doctors can be assigned slots on a maximum of <strong>3 days per week</strong>. The doctor must approve before the slot goes live.
          </p>

          {/* Form action buttons for cancellation and submission */}
          <div className="flex justify-end gap-3 pt-1 pb-1">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <IconPlus />}
              {saving ? "Creating…" : "Create Slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal component for editing an existing channeling slot

interface EditSlotModalProps {
  slot: ChannelingSlot;
  doctors: any[];
  onClose: () => void;
  onUpdated: () => void;
  addToast: (kind: "success" | "error", msg: string) => void;
}

const EditSlotModal: React.FC<EditSlotModalProps> = ({ slot, doctors, onClose, onUpdated, addToast }) => {
  const [startTime, setStartTime]     = useState(slot.startTime);
  const [endTime, setEndTime]         = useState(slot.endTime);
  const [maxPatients, setMaxPatients] = useState(slot.maxPatients);
  const [cutoff, setCutoff]           = useState(slot.bookingCutoffMinutes);
  const [notes, setNotes]             = useState(slot.notes ?? "");
  const [careHomeFee, setCareHomeFee] = useState<number | "">(slot.careHomeFee ?? "");
  const [saving, setSaving]           = useState(false);

  const doctorName  = resolveDoctorName(slot, doctors);
  const doctorSpec  = resolveDoctorSpecialization(slot, doctors);
  const doctorObj   = doctors.find((d) => d.id === slot.doctorId);

  const validEndTimes = useMemo(() => TIMES.filter((t) => t > startTime), [startTime]);
  useEffect(() => {
    if (endTime <= startTime) setEndTime(validEndTimes[0] ?? "23:30");
  }, [startTime, endTime, validEndTimes]);

  const cutoffDisplay = useMemo(() =>
    bookingCutoffDate(slot.date, startTime, cutoff).toLocaleString("en-GB", {
      hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short",
    }),
    [slot.date, startTime, cutoff]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endTime <= startTime) return addToast("error", "End time must be after start time");
    try {
      setSaving(true);
      await channelingApi.updateChannelingSlot(slot.id, {
        startTime, endTime, maxPatients, bookingCutoffMinutes: cutoff,
        notes: notes || undefined,
        careHomeFee: careHomeFee !== "" ? careHomeFee : undefined,
      });
      addToast("success", "Channeling slot updated successfully");
      onUpdated();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to update slot");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
              <IconEdit className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Edit Channeling Slot</p>
              <p className="text-xs text-slate-500">Changes require doctor re-approval</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="px-6 pt-5 pb-3">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800">{doctorName}</p>
                  <p className="text-xs text-slate-500">{doctorSpec}</p>
                  {doctorObj?.availableTimeStart && doctorObj?.availableTimeEnd && (
                    <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                      {fmt12(doctorObj.availableTimeStart)} – {fmt12(doctorObj.availableTimeEnd)}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Session Date</p>
                  <p className="text-sm font-bold text-slate-700">{fmtDate(slot.date)}</p>
                  <span className="mt-1 inline-flex items-center rounded-xl bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-100">
                    PENDING
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 pb-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-2">Edit Timings & Capacity</p>

            <div className="grid grid-cols-4 gap-3">
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
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Cutoff (min)</label>
                <input type="number" min={5} max={120} value={cutoff} onChange={(e) => setCutoff(Number(e.target.value))} className={inputCls} />
                <p className="mt-1 flex items-center gap-1 text-[10px] text-amber-600">
                  <IconClock className="h-2.5 w-2.5" /> {cutoffDisplay}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Max Patients</label>
                <input type="number" min={1} max={200} value={maxPatients} onChange={(e) => setMaxPatients(Number(e.target.value))} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Care Home Fee (LKR) <span className="font-normal text-slate-400 text-[10px]">optional</span>
                </label>
                <input
                  type="number" min={0} step={0.01} value={careHomeFee}
                  onChange={(e) => setCareHomeFee(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 500" className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Notes <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea rows={1} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Cardiology clinic only" className={`${inputCls} resize-none`} />
              </div>
            </div>

            <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-[11px] text-amber-700 ring-1 ring-amber-100">
              ⚠️ Editing this pending slot will require the doctor to re-approve it before it goes live.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <IconEdit />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Card component to display individual slot details and actions

interface SlotCardProps {
  slot: ChannelingSlot;
  doctors: any[];
  onEdit: (slot: ChannelingSlot) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, doctors, onEdit, onCancel, onDelete }) => {
  const slotEnd      = new Date(`${slot.date}T${slot.endTime}:00`);
  const isPast          = slotEnd < new Date();
  const isCancelled     = slot.status === "cancelled";
  const isRejected      = slot.status === "rejected";
  const isCompleted     = slot.status === "completed";
  const isPending       = slot.status === "pending";
  const isBookingOpenNow = !isPending && !isPast && slot.status === "active" && isBookingOpen(slot);

  const doctorName = resolveDoctorName(slot, doctors);
  const doctorSpec = resolveDoctorSpecialization(slot, doctors);
  const accent     = slotAccentColor(slot);

  const totalFee =
    (slot.consultationFee != null ? Number(slot.consultationFee) : 0) +
    (slot.careHomeFee != null ? Number(slot.careHomeFee) : 0);

  const hasFees = slot.consultationFee != null || slot.careHomeFee != null;

  const dimmed = isCancelled || isRejected || isCompleted || (isPast && !isCompleted);

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 ${
        dimmed
          ? "border-slate-200 opacity-75"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${accent} shrink-0`} />

      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-800 leading-tight">{doctorName}</p>
          <p className="truncate text-xs text-slate-500 mt-0.5">{doctorSpec}</p>
        </div>
        <div className="shrink-0">
          {statusBadge(slot)}
        </div>
      </div>

      <div className="mx-4 h-px bg-slate-100" />

      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-slate-100">
            <IconCalendar className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <span className="text-xs font-semibold text-slate-700">{fmtDate(slot.date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-emerald-50">
            <IconClock className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-slate-800">{fmt12(slot.startTime)} – {fmt12(slot.endTime)}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
            👥 Max {slot.maxPatients} patients
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
            ⏱ Closes {slot.bookingCutoffMinutes} min before
          </span>
        </div>
      </div>

      {hasFees && (
        <>
          <div className="mx-4 h-px bg-slate-100" />
          <div className="px-4 py-2.5 space-y-1">
            {slot.consultationFee != null && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Dr. Fee</span>
                <span className="font-semibold text-slate-700">LKR {Number(slot.consultationFee).toLocaleString()}</span>
              </div>
            )}
            {slot.careHomeFee != null && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Care Home</span>
                <span className="font-semibold text-slate-700">LKR {Number(slot.careHomeFee).toLocaleString()}</span>
              </div>
            )}
            {hasFees && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-600">Total</span>
                <span className="font-bold text-slate-800">LKR {totalFee.toLocaleString()}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Notes */}
      {slot.notes && (
        <div className="px-4 pb-2">
          <p className="text-[11px] italic text-slate-400 line-clamp-1">{slot.notes}</p>
        </div>
      )}

      <div className="mt-auto px-4 pb-4 pt-2">
        {isCompleted && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              ✓ Session Completed
            </span>
            <button
              onClick={() => onDelete(slot.id)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
            >
              <IconTrash className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {(isCancelled || isRejected) && (
          <div className="flex justify-end">
            <button
              onClick={() => onDelete(slot.id)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
            >
              <IconTrash className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}

        {isPast && !isCancelled && !isRejected && !isCompleted && (
          <div className="flex justify-end">
            <button
              onClick={() => onDelete(slot.id)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
            >
              <IconTrash className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}

        {isPending && !isPast && (
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => onEdit(slot)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              <IconEdit className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={() => onDelete(slot.id)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
            >
              <IconTrash className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onCancel(slot.id)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 transition"
            >
              <IconBan className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        )}

        {/* Active (booking open) */}
        {isBookingOpenNow && null}

        {/* Active (booking closed) */}
        {!isPending && !isPast && !isCancelled && !isRejected && !isCompleted && !isBookingOpenNow && (
          <div className="flex justify-end">
            <button
              onClick={() => onCancel(slot.id)}
              className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 hover:border-red-200 transition"
            >
              <IconBan className="h-3.5 w-3.5" /> Cancel Slot
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Component for the 7-day schedule overview strip

interface WeeklyStripProps {
  slots: ChannelingSlot[];
  doctors: any[];
}

const WeeklyStrip: React.FC<WeeklyStripProps> = ({ slots, doctors }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const activeDoctors = doctors.filter((d) => d.isActive);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().split("T")[0];
  }), []);

  const relevantSlots = useMemo(() => slots.filter((s) =>
    (s.status === "active" || s.status === "pending") &&
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
          <p className="text-xs text-slate-500">Active and pending slots for the next 7 days</p>
        </div>
        <select
          value={selectedDoctorId}
          onChange={(e) => setSelectedDoctorId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
        >
          <option value="">All Doctors</option>
          {activeDoctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
        </select>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const daySlots = slotsByDay[day];
          const isToday = day === today();
          return (
            <div key={day} className="min-h-[90px]">
              <div className={`mb-1.5 rounded-xl px-2 py-1.5 text-center ${isToday ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-50 text-slate-600"}`}>
                <p className="text-[10px] font-semibold">{new Date(day + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" })}</p>
                <p className="text-xs font-bold">{new Date(day + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</p>
              </div>
              <div className="space-y-0.5">
                {daySlots.map((s) => {
                  const name = resolveDoctorName(s, doctors);
                  return (
                    <div
                      key={s.id}
                      title={`${name} · ${fmt12(s.startTime)}–${fmt12(s.endTime)}`}
                      className={`truncate rounded-lg px-1.5 py-1 text-[10px] font-semibold ring-1 ${
                        s.status === "pending"
                          ? "bg-amber-50 text-amber-800 ring-amber-100"
                          : "bg-emerald-50 text-emerald-800 ring-emerald-100"
                      }`}
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

// Filter tab definitions for slot status categories

const SLOT_STATUS_TABS: { value: "" | SlotStatus | "booking_open"; label: string; dot: string }[] = [
  { value: "",            label: "All",          dot: "bg-slate-400" },
  { value: "booking_open",label: "Booking Open", dot: "bg-emerald-500" },
  { value: "pending",     label: "Pending",      dot: "bg-amber-400" },
  { value: "completed",   label: "Completed",    dot: "bg-slate-400" },
  { value: "cancelled",   label: "Cancelled",    dot: "bg-red-400" },
  { value: "rejected",    label: "Rejected",     dot: "bg-red-400" },
];

// Main management component for the channeling slot dashboard

interface Props { addToast: (kind: "success" | "error", message: string) => void; }

const ChannelingSlotManagement: React.FC<Props> = ({ addToast }) => {
  const [slots, setSlots]               = useState<ChannelingSlot[]>([]);
  const [doctors, setDoctors]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot]   = useState<ChannelingSlot | null>(null);

  const [filterDoctor, setFilterDoctor]     = useState("");
  const [filterStatus, setFilterStatus]     = useState<"" | SlotStatus>("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate]     = useState("");
  const [showFilters, setShowFilters]       = useState(false);
  const [activeTab, setActiveTab]           = useState<"" | SlotStatus | "booking_open">("");

  const addToastRef = useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);

  // Synchronize state with the latest channeling slots and doctor data from the API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [slotsData, doctorsData] = await Promise.all([
        channelingApi.getChannelingSlots({
          doctorId:  filterDoctor || undefined,
          status:    (filterStatus || undefined) as SlotStatus | undefined,
          fromDate:  filterFromDate || undefined,
          toDate:    filterToDate || undefined,
        }),
        getAllDoctors(),
      ]);
      setSlots(slotsData.slots);
      setDoctors(doctorsData.doctors);
    } catch (err) {
      addToastRef.current("error", err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [filterDoctor, filterStatus, filterFromDate, filterToDate]);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter and sort slots based on the active tab and chronological order
  const displayedSlots = useMemo(() => {
    let filtered: ChannelingSlot[];
    if (activeTab === "") filtered = slots;
    else if (activeTab === "booking_open") filtered = slots.filter((s) => s.status === "active" && isBookingOpen(s));
    else filtered = slots.filter((s) => s.status === activeTab);
    return [...filtered].sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.startTime.localeCompare(a.startTime);
    });
  }, [slots, activeTab]);

  // Initiate the cancellation flow for a specific channeling session
  const handleCancelSlot = async (id: string) => {
    if (!window.confirm("Cancel this channeling slot?")) return;
    try {
      const res = await channelingApi.cancelChannelingSlot(id);
      addToast("success", res.message);
      loadData();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to cancel slot");
    }
  };

  // Permanently remove a slot record from the system
  const handleDeleteSlot = async (id: string) => {
    if (!window.confirm("Permanently delete this slot? This cannot be undone.")) return;
    try {
      const res = await channelingApi.deleteChannelingSlot(id);
      addToast("success", res.message);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to delete slot");
    }
  };

  const handleSlotCreated = () => { loadData(); setShowAddModal(false); };
  const handleSlotUpdated = () => { loadData(); setEditingSlot(null); };

  // Aggregate slot statistics for the dashboard overview cards
  const stats = useMemo(() => {
    const upcomingActive = slots.filter((s) => s.status === "active" && s.date >= today());
    const bookingOpen    = upcomingActive.filter(isBookingOpen);
    const completedSlots = slots.filter((s) => s.status === "completed").length;
    const pending        = slots.filter((s) => s.status === "pending").length;
    return { total: slots.length, upcomingActive: upcomingActive.length, bookingOpen: bookingOpen.length, completedSlots, pending };
  }, [slots]);

  const filterInputCls = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Channeling Slot Management</h1>
          <p className="mt-1 text-sm text-slate-500">Assign channeling time slots to doctors · patients book during the open window</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <IconPlus className="h-4 w-4" /> New Channeling Slot
        </button>
      </div>

      {/* High-level summary cards showing key channeling statistics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: "Total Slots",        value: stats.total,          color: "slate",   bg: "bg-slate-50" },
          { label: "Upcoming Active",    value: stats.upcomingActive, color: "blue",    bg: "bg-blue-50" },
          { label: "Booking Open",       value: stats.bookingOpen,    color: "emerald", bg: "bg-emerald-50" },
          { label: "Pending Approval",   value: stats.pending,        color: "amber",   bg: "bg-amber-50" },
          { label: "Completed Slots",    value: stats.completedSlots, color: "violet",  bg: "bg-violet-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl border border-slate-200 ${bg} p-4 shadow-sm`}>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold text-${color}-600`}>{value}</p>
          </div>
        ))}
      </div>

      <WeeklyStrip slots={slots} doctors={doctors} />

      {/* Primary list workspace for managing all channeling sessions */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

        {/* View controls for toggling advanced filter parameters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-slate-800">All Slots</h3>
          <button
            onClick={() => setShowFilters((f) => !f)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <IconFilter className="h-3.5 w-3.5" /> Filters {showFilters ? "▲" : "▼"}
          </button>
        </div>

        {/* Category tabs for quick filtering by operational status */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SLOT_STATUS_TABS.map((tab) => {
            const count =
              tab.value === ""             ? slots.length :
              tab.value === "booking_open" ? slots.filter((s) => s.status === "active" && isBookingOpen(s)).length :
              slots.filter((s) => s.status === tab.value).length;

            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${tab.dot}`} />
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Advanced search parameters for granular doctor and date filtering */}
        {showFilters && (
          <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">Doctor</label>
              <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} className={filterInputCls + " w-full"}>
                <option value="">All Doctors</option>
                {doctors.filter((d) => d.isActive).map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "" | SlotStatus)} className={filterInputCls + " w-full"}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">From Date</label>
              <input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} className={filterInputCls + " w-full"} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">To Date</label>
              <input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} className={filterInputCls + " w-full"} />
            </div>
          </div>
        )}

        {/* Result grid displaying all relevant channeling slot cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
          </div>
        ) : displayedSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100">
              <IconCalendar className="h-8 w-8 text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-600">No channeling slots found</p>
            <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or create a new slot</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                doctors={doctors}
                onEdit={setEditingSlot}
                onCancel={handleCancelSlot}
                onDelete={handleDeleteSlot}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal overlays for slot creation and modification flows */}
      {showAddModal && (
        <AddSlotModal doctors={doctors} onClose={() => setShowAddModal(false)} onCreated={handleSlotCreated} addToast={addToast} />
      )}
      {editingSlot && (
        <EditSlotModal slot={editingSlot} doctors={doctors} onClose={() => setEditingSlot(null)} onUpdated={handleSlotUpdated} addToast={addToast} />
      )}
    </div>
  );
};

export default ChannelingSlotManagement;