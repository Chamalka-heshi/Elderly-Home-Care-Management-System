import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDoctorAppointments,
  type Appointment,
} from "../../../../api/appointment/doctor-appointment.api";
import {
  createPrescription,
  type Medicine,
  type CreatePrescriptionPayload,
} from "../../../../api/prescriptions/doctor-prescription.api";
import {
  fmt12,
  fmtDate,
} from "../../../../api/appointment/appointment.types";
import {
  IconCalendar,
  IconClock,
  IconFileText,
  IconActivity,
  IconUserCheck,
  IconX,
  IconPlus,
  IconTrash,
  IconCheckCircle,
  IconAlertCircle,
  IconChevronUp,
  IconChevronDown,
  IconPill,
  IconUser,
} from "../../common/icons";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

const FREQ = [
  "Once daily", "Twice daily", "Three times daily", "Four times daily",
  "Every 6 hours", "Every 8 hours", "Every 12 hours", "PRN (as needed)",
  "Before meals", "After meals", "With food", "At bedtime",
];

const inp =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-300";

const EMPTY_MED: Medicine = {
  medicineName: "",
  dosage: "",
  frequency: FREQ[0],
  durationDays: 7,
  instructions: "",
};

// ─── Prescription Creation Modal ──────────────────────────────────────────────

interface PrescribeModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: (prescriptionId: string, appointmentId: string) => void;
}

const PrescribeModal: React.FC<PrescribeModalProps> = ({
  appointment,
  onClose,
  onSuccess,
}) => {
  const { patient, id: appointmentId, familyMember } = appointment;
  const [diagnosis, setDiagnosis]   = useState("");
  const [notes, setNotes]           = useState("");
  const [issuedDate, setIssuedDate] = useState(today());
  const [validUntil, setValidUntil] = useState("");
  const [meds, setMeds]             = useState<Medicine[]>([{ ...EMPTY_MED }]);
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState<string | null>(null);

  const addMed    = () => setMeds((m) => [...m, { ...EMPTY_MED }]);
  const removeMed = (i: number) => setMeds((m) => m.filter((_, x) => x !== i));
  const changeMed = (i: number, field: keyof Medicine, val: string | number) =>
    setMeds((m) => m.map((x, idx) => (idx === i ? { ...x, [field]: val } : x)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (meds.some((m) => !m.medicineName.trim() || !m.dosage.trim())) {
      setErr("Please fill in name and dosage for every medicine.");
      return;
    }
    setErr(null);

    const payload: CreatePrescriptionPayload = {
      appointmentId,
      patientId:   patient.id,
      patientName: patient.fullName,
      patientAge:  patient.age ?? 0,
      issuedDate,
      ...(diagnosis.trim()  && { diagnosis: diagnosis.trim() }),
      ...(notes.trim()      && { notes: notes.trim() }),
      ...(validUntil        && { validUntil }),
      medicines: meds.map((m) => ({
        ...m,
        durationDays: Number(m.durationDays),
        // omit empty instructions to keep the payload clean
        ...(m.instructions?.trim()
          ? { instructions: m.instructions.trim() }
          : { instructions: undefined }),
      })),
    };

    try {
      setSaving(true);
      const rx = await createPrescription(payload);
      onSuccess(rx.id, appointmentId);
      onClose();
    } catch (e: any) {
      setErr(e.message || "Failed to save prescription.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 pt-8">
      <button
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
              <IconFileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">New Prescription</h2>
              <p className="text-xs text-slate-400">
                For: <span className="font-semibold text-slate-700">{patient.fullName}</span>
                {" · "}
                <span className="text-slate-500">
                  Booked by{" "}
                  <span className="font-semibold">
                    {familyMember?.user?.fullName ?? "—"}
                  </span>
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
          {/* Patient info banner */}
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Patient
            </h3>
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 grid grid-cols-2 gap-x-6 gap-y-1">
              <p>Name — {patient.fullName}</p>
              <p>Gender — {patient.gender ?? "—"}</p>
              <p>Age — {patient.age != null ? `${patient.age} yrs` : "—"}</p>
              <p>Blood Group — {patient.bloodGroup ?? "—"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Issued Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  className={inp}
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Valid Until
                </label>
                <input
                  type="date"
                  className={inp}
                  value={validUntil}
                  min={issuedDate}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Diagnosis
                </label>
                <input
                  className={inp}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute pharyngitis"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Clinical Notes
                </label>
                <input
                  className={inp}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes…"
                />
              </div>
            </div>
          </div>

          {/* Medicines */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Medicines ({meds.length})
              </h3>
              <button
                type="button"
                onClick={addMed}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
              >
                <IconPlus className="h-3.5 w-3.5" /> Add Medicine
              </button>
            </div>

            {err && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                {err}
              </div>
            )}

            <div className="space-y-3">
              {meds.map((med, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      <IconPill className="h-3.5 w-3.5" /> Medicine {i + 1}
                    </span>
                    {meds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMed(i)}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-500">
                        Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        className={inp}
                        value={med.medicineName}
                        onChange={(e) => changeMed(i, "medicineName", e.target.value)}
                        placeholder="e.g. Amoxicillin 500mg"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">
                        Dosage <span className="text-red-400">*</span>
                      </label>
                      <input
                        className={inp}
                        value={med.dosage}
                        onChange={(e) => changeMed(i, "dosage", e.target.value)}
                        placeholder="500 mg"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">
                        Duration (days)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        className={inp}
                        value={med.durationDays}
                        onChange={(e) => changeMed(i, "durationDays", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-500">
                        Frequency
                      </label>
                      <select
                        className={inp}
                        value={med.frequency}
                        onChange={(e) => changeMed(i, "frequency", e.target.value)}
                      >
                        {FREQ.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-500">
                        Instructions
                      </label>
                      <input
                        className={inp}
                        value={med.instructions ?? ""}
                        onChange={(e) => changeMed(i, "instructions", e.target.value)}
                        placeholder="e.g. Take after food"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60 disabled:translate-y-0 transition"
            >
              {saving ? "Saving…" : "Save Prescription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Slot Group Card ──────────────────────────────────────────────────────────

interface SlotGroup {
  slotId:    string;
  date:      string;
  startTime: string;
  endTime:   string;
  appointments: Appointment[];
}

interface SlotCardProps {
  group:           SlotGroup;
  onPrescribe:     (appt: Appointment) => void;
  localPrescribed: Set<string>;
}

const SlotCard: React.FC<SlotCardProps> = ({ group, onPrescribe, localPrescribed }) => {
  const [expanded, setExpanded] = useState(true);
  const total  = group.appointments.length;
  const isPast = new Date(`${group.date}T${group.endTime}:00`) < new Date();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-emerald-600 text-white px-3 py-2 min-w-[52px]">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              {new Date(group.date + "T00:00:00").toLocaleDateString("en-GB", { month: "short" })}
            </span>
            <span className="text-xl font-extrabold leading-tight">
              {new Date(group.date + "T00:00:00").getDate()}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{fmtDate(group.date)}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <IconClock className="h-3.5 w-3.5" />
              {fmt12(group.startTime)} – {fmt12(group.endTime)}
              {isPast && (
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  Past
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
            <IconUserCheck className="h-3.5 w-3.5" />
            {total} confirmed patient{total !== 1 ? "s" : ""}
          </span>
          {expanded
            ? <IconChevronUp className="h-4 w-4 text-slate-400" />
            : <IconChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100">
          {group.appointments.map((appt, idx) => {
            const prescribed = !!appt.prescriptionId || localPrescribed.has(appt.id);
            return (
              <div
                key={appt.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 ${
                  idx < group.appointments.length - 1 ? "border-b border-slate-100" : ""
                } hover:bg-slate-50/60 transition`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-100">
                    <IconUser className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {appt.patient?.fullName ?? "—"}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 flex-wrap">
                      {appt.patient?.age != null && (
                        <span className="font-medium text-slate-600">{appt.patient.age} yrs</span>
                      )}
                      {appt.patient?.gender && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span>{appt.patient.gender}</span>
                        </>
                      )}
                      {appt.patient?.bloodGroup && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-100">
                            {appt.patient.bloodGroup}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Booked by</p>
                  <p className="text-sm text-slate-700 truncate">
                    {appt.familyMember?.user?.fullName ?? "—"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {appt.familyMember?.user?.email ?? ""}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {prescribed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      <IconCheckCircle className="h-3.5 w-3.5" /> Prescribed
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600 ring-1 ring-amber-100">
                        Not Prescribed
                      </span>
                      <button
                        onClick={() => onPrescribe(appt)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
                      >
                        <IconFileText className="h-3.5 w-3.5" />
                        Prescribe
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Toast hook ───────────────────────────────────────────────────────────────

interface Toast { id: number; msg: string; kind: "success" | "error" }

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((msg: string, kind: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  return { toasts, add };
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments]     = useState<Appointment[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [prescribeAppt, setPrescribeAppt]   = useState<Appointment | null>(null);
  const [localPrescribed, setLocalPrescribed] = useState<Set<string>>(new Set());

  const { toasts, add: addToast } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAppointments(await getDoctorAppointments());
    } catch (e: any) {
      setError(e.message ?? "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const slotGroups = useMemo<SlotGroup[]>(() => {
    const confirmed = appointments.filter((a) => a.status === "confirmed");
    const map = new Map<string, SlotGroup>();

    for (const appt of confirmed) {
      const sid = appt.slotId;
      if (!map.has(sid)) {
        map.set(sid, {
          slotId:       sid,
          date:         appt.slot?.date ?? "",
          startTime:    appt.slot?.startTime ?? "",
          endTime:      appt.slot?.endTime ?? "",
          appointments: [],
        });
      }
      map.get(sid)!.appointments.push(appt);
    }

    return Array.from(map.values()).sort((a, b) =>
      `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`),
    );
  }, [appointments]);

  const now            = new Date();
  const upcomingGroups = slotGroups.filter((g) => new Date(`${g.date}T${g.endTime}:00`) >= now);
  const pastGroups     = slotGroups.filter((g) => new Date(`${g.date}T${g.endTime}:00`) < now);

  const handlePrescriptionCreated = useCallback(
    (prescriptionId: string, appointmentId: string) => {
      setLocalPrescribed((prev) => new Set([...prev, appointmentId]));
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? { ...a, status: "completed" as const, prescriptionId }
            : a,
        ),
      );
      addToast("Prescription saved. Appointment marked as completed.", "success");
    },
    [addToast],
  );

  // ── Render states ─────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-700">{error}</p>
      <button
        onClick={load}
        className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
      >
        Retry
      </button>
    </div>
  );

  const totalConfirmed = appointments.filter((a) => a.status === "confirmed").length;

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Confirmed patients grouped by channeling slot — prescribe directly from here
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Confirmed</p>
            <p className="text-2xl font-extrabold text-emerald-700">{totalConfirmed}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Slots</p>
            <p className="text-2xl font-extrabold text-slate-700">{slotGroups.length}</p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {slotGroups.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <IconActivity className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">No confirmed appointments yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Confirmed patient bookings will appear here, grouped by slot
          </p>
        </div>
      )}

      {/* Upcoming slots */}
      {upcomingGroups.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-600">
              Upcoming · {upcomingGroups.length} slot{upcomingGroups.length !== 1 ? "s" : ""}
            </h2>
          </div>
          {upcomingGroups.map((group) => (
            <SlotCard
              key={group.slotId}
              group={group}
              onPrescribe={setPrescribeAppt}
              localPrescribed={localPrescribed}
            />
          ))}
        </section>
      )}

      {/* Past slots */}
      {pastGroups.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <IconClock className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Past · {pastGroups.length} slot{pastGroups.length !== 1 ? "s" : ""}
            </h2>
          </div>
          {pastGroups.map((group) => (
            <SlotCard
              key={group.slotId}
              group={group}
              onPrescribe={setPrescribeAppt}
              localPrescribed={localPrescribed}
            />
          ))}
        </section>
      )}

      {/* Prescription modal */}
      {prescribeAppt && (
        <PrescribeModal
          appointment={prescribeAppt}
          onClose={() => setPrescribeAppt(null)}
          onSuccess={handlePrescriptionCreated}
        />
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${
              t.kind === "success" ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {t.kind === "success"
              ? <IconCheckCircle className="h-4 w-4 shrink-0" />
              : <IconAlertCircle className="h-4 w-4 shrink-0" />}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorAppointments;