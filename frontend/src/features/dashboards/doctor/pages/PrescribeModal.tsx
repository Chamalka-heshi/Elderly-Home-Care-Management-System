import React, { useEffect, useState } from "react";

import {
  createPrescription,
  discontinuePrescription,
  getPatientPrescriptions,
  type CreatePrescriptionPayload,
  type Medicine,
  type PrescriptionEmailAction,
  type Prescription as RxRecord,
} from "../../../../api/prescriptions/doctor-prescription.api";

import type { Appointment } from "../../../../api/appointment/doctor-appointment.api";

import {
  IconAlertCircle,
  IconCheckCircle,
  IconFileText,
  IconPill,
  IconPlus,
  IconSpinner,
  IconTrash,
  IconX,
} from "../../common/icons";
import { fmtDateShort } from '../../../../utils/dateTime';

// Helper functions and default values for prescriptions

const today = () => new Date().toISOString().slice(0, 10);

const FREQ = [
  "Once daily", "Twice daily", "Three times daily", "Four times daily",
  "Every 6 hours", "Every 8 hours", "Every 12 hours", "PRN (as needed)",
  "Before meals", "After meals", "With food", "At bedtime",
];

const inp =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-300";

const EMPTY_MED: Medicine = {
  medicineName: "",
  dosage: "",
  frequency: FREQ[0],
  durationDays: 7,
  instructions: "",
};

// ActiveRxReview
// Shows a box with the patient's current active prescription details
interface ActiveRxReviewProps {
  rx: RxRecord;
  onDiscontinue: (id: string) => Promise<void>;
  onContinueAndAdd: (rx: RxRecord) => void;
  isDiscontinuing: boolean;
}

const ActiveRxReview: React.FC<ActiveRxReviewProps> = ({
  rx,
  onDiscontinue,
  onContinueAndAdd,
  isDiscontinuing,
}) => (
  <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 overflow-hidden">
    <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-100/60 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-200">
        <IconPill className="h-4 w-4 text-amber-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900">Active Prescription Detected</p>
        <p className="text-xs text-amber-700 truncate">
          {rx.diagnosis ?? "Existing prescription"} ·{" "}
          Issued {fmtDateShort(rx.issuedDate)}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800">
        Active
      </span>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-amber-100/40 text-left">
            {["Medicine", "Dosage", "Frequency", "Duration", "Instructions"].map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 font-bold uppercase tracking-wider text-amber-700 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-100">
          {rx.medicines.map((med, mi) => (
            <tr key={mi} className="bg-white/50 hover:bg-white/80 transition">
              <td className="px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{med.medicineName}</td>
              <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{med.dosage}</td>
              <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{med.frequency}</td>
              <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{med.durationDays}d</td>
              <td className="px-4 py-2.5 text-slate-400 italic">
                {med.instructions?.trim() || <span className="text-slate-300 not-italic">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {rx.notes && (
      <div className="px-4 py-2.5 border-t border-amber-100 bg-white/40">
        <span className="text-xs font-bold text-amber-700">Clinical Notes: </span>
        <span className="text-xs text-amber-800">{rx.notes}</span>
      </div>
    )}

    <div className="flex items-center gap-3 border-t border-amber-200 bg-amber-50 px-4 py-3">
      <p className="flex-1 text-xs text-amber-700 font-medium">
        How would you like to proceed with this prescription?
      </p>
      <button
        type="button"
        disabled={isDiscontinuing}
        onClick={() => onDiscontinue(rx.id)}
        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
      >
        {isDiscontinuing ? (
          <IconSpinner className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <IconX className="h-3.5 w-3.5" />
        )}
        Discontinue
      </button>
      <button
        type="button"
        onClick={() => onContinueAndAdd(rx)}
        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/20"
      >
        <IconPlus className="h-3.5 w-3.5" />
        Continue &amp; Add New
      </button>
    </div>
  </div>
);

// PrescribeModal
// Full screen popup for doctors to write and save a new prescription
export interface PrescribeModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: (prescriptionId: string, appointmentId: string) => void;
}

export const PrescribeModal: React.FC<PrescribeModalProps> = ({
  appointment,
  onClose,
  onSuccess,
}) => {
  const { patient, id: appointmentId, familyMember } = appointment;

  // Determine whether clinical notes field should be shown. Rely on patient's paymentPlan as a lightweight indicator;
  // backend enforces the rule strictly so this is a UI convenience only.
  const hasActiveCarePlan = Boolean(patient?.paymentPlan);

  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [issuedDate, setIssuedDate] = useState(today());
  const [validUntil, setValidUntil] = useState("");
  // Start with no medicines by default. New prescriptions must be created empty — medicines are added manually.
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [medErrors, setMedErrors] = useState<Record<number, Record<string, string>>>({});
  const [dateErr, setDateErr] = useState<string | null>(null);

  const [activeRx, setActiveRx] = useState<RxRecord | null>(null);
  const [loadingRx, setLoadingRx] = useState(true);
  const [rxFetchError, setRxFetchError] = useState<string | null>(null);
  const [discontinuing, setDiscontinuing] = useState(false);
  const [discontinueErr, setDiscontinueErr] = useState<string | null>(null);
  const [carriedForward, setCarriedForward] = useState(false);

  // Tracks what the doctor chose to do with the previous prescription for email context.
  const [prescriptionAction, setPrescriptionAction] = useState<PrescriptionEmailAction>('NEW');
  const [previousRxId, setPreviousRxId] = useState<string | null>(null);

  // Loads any active prescriptions the patient already has
  useEffect(() => {
    let cancelled = false;
    setLoadingRx(true);
    setRxFetchError(null);
    getPatientPrescriptions(patient.id)
      .then((data) => {
        if (!cancelled) {
          const active = data.find((r) => r.status === "active") ?? null;
          setActiveRx(active);
        }
      })
      .catch((e: any) => {
        if (!cancelled)
          setRxFetchError(e?.message ?? "Could not load existing prescriptions. You may still proceed.");
      })
      .finally(() => { if (!cancelled) setLoadingRx(false); });
    return () => { cancelled = true; };
  }, [patient.id]);

  // Stops the current active prescription so a new one can be started
  const handleDiscontinue = async (rxId: string) => {
    setDiscontinuing(true);
    setDiscontinueErr(null);
    try {
      await discontinuePrescription(rxId);
      // Record: doctor cancelled the old Rx and will create a new one
      setPrescriptionAction('CANCELLED_AND_REPLACED');
      setPreviousRxId(rxId);
      setActiveRx(null);
      setCarriedForward(false);
    } catch (e: any) {
      setDiscontinueErr(e?.message ?? "Failed to discontinue prescription. Please try again.");
    } finally {
      setDiscontinuing(false);
    }
  };

  // Open a fresh new prescription form. Do NOT copy medicines from the existing prescription.
  const handleContinueAndAdd = (rx: RxRecord) => {
    // Record: doctor kept the old Rx active and is adding a supplemental new one
    setPrescriptionAction('CONTINUED');
    setPreviousRxId(rx.id);
    setCarriedForward(true);
    // Ensure the new prescription starts blank — doctor must add medicines manually.
    setDiagnosis("");
    setMeds([]);
    setDiscontinueErr(null);
  };

  const addMed = () => setMeds((m) => [...m, { ...EMPTY_MED }]);
  const removeMed = (i: number) => {
    setMeds((m) => m.filter((_, x) => x !== i));
    setMedErrors((prev) => {
      const next = { ...prev };
      delete next[i];
      const reindexed: Record<number, Record<string, string>> = {};
      Object.entries(next).forEach(([k, v]) => {
        const idx = parseInt(k, 10);
        reindexed[idx > i ? idx - 1 : idx] = v;
      });
      return reindexed;
    });
  };
  const changeMed = (i: number, field: keyof Medicine, val: string | number) => {
    setMeds((m) => m.map((x, idx) => (idx === i ? { ...x, [field]: val } : x)));
    setMedErrors((prev) => ({
      ...prev,
      [i]: { ...(prev[i] ?? {}), [field]: "" },
    }));
    setErr(null);
  };

  // Checks if all medicine fields are filled in correctly
  const validateMeds = (): boolean => {
    const errors: Record<number, Record<string, string>> = {};
    meds.forEach((m, i) => {
      const row: Record<string, string> = {};

      if (!m.medicineName.trim())
        row.medicineName = "Medicine name is required.";
      else if (m.medicineName.trim().length < 2)
        row.medicineName = "Name must be at least 2 characters.";

      const dosageVal = m.dosage.trim();
      if (!dosageVal)
        row.dosage = "Dosage is required.";
      else if (/^\d+\.?\d*$/.test(dosageVal))
        row.dosage = "Include a unit — e.g. 500mg, 1g, 2 tablets, 5ml.";

      const days = Number(m.durationDays);
      if (isNaN(days) || days < 1)
        row.durationDays = "Duration must be at least 1 day.";
      else if (days > 365)
        row.durationDays = "Duration cannot exceed 365 days.";
      else if (validUntil && issuedDate) {
        const issued = new Date(issuedDate);
        const medEnd = new Date(issued);
        medEnd.setDate(issued.getDate() + days - 1);
        const validEnd = new Date(validUntil);
        if (medEnd > validEnd) {
          const fmt = (d: Date) => fmtDateShort(d);
          row.durationDays =
            `Last dose falls on ${fmt(medEnd)}, which is after "Valid Until" (${fmt(validEnd)}). ` +
            `Reduce duration to ${Math.max(1, Math.floor((validEnd.getTime() - issued.getTime()) / 86_400_000) + 1)} days or extend "Valid Until".`;
        }
      }

      if (Object.keys(row).length) errors[i] = row;
    });
    setMedErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validates the form and sends the prescription data to the server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setDateErr(null);

    if (validUntil && validUntil < issuedDate) {
      setDateErr("\"Valid Until\" must be on or after the Issued Date.");
      return;
    }
    if (!validateMeds()) {
      setErr("Please fix the highlighted fields above before saving.");
      return;
    }

    const payload: CreatePrescriptionPayload = {
      appointmentId,
      patientId: patient.id,
      patientName: patient.fullName,
      patientAge: patient.age ?? 0,
      issuedDate,
      ...(diagnosis.trim() && { diagnosis: diagnosis.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
      ...(validUntil && { validUntil }),
      medicines: meds.map((m) => ({
        ...m,
        durationDays: Number(m.durationDays),
        ...(m.instructions?.trim()
          ? { instructions: m.instructions.trim() }
          : { instructions: undefined }),
      })),
      // Tell the backend which action the doctor performed so the email is accurate.
      action: prescriptionAction,
      ...(previousRxId && { previousPrescriptionId: previousRxId }),
    };

    try {
      setSaving(true);
      const rx = await createPrescription(payload);
      onSuccess(rx.id, appointmentId);
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save prescription. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const showNewRxForm = !activeRx || carriedForward;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 pt-8">
      <button
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        type="button"
        aria-label="Close"
      />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 mb-10">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
              <IconFileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">New Prescription</h2>
              <p className="text-xs text-slate-400">
                For:{" "}
                <span className="font-semibold text-slate-700">{patient.fullName}</span>
                {" · "}
                <span>
                  Booked by{" "}
                  <span className="font-semibold text-slate-600">
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

        <div className="divide-y divide-slate-100">
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Name", value: patient.fullName },
                { label: "Age", value: patient.age != null ? `${patient.age} yrs` : "—" },
                { label: "Gender", value: patient.gender ?? "—" },
                { label: "Blood Group", value: patient.bloodGroup ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
                  <p className="text-xs font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Current Active Prescription
            </h3>

            {loadingRx ? (
              <div className="flex items-center justify-center py-6">
                <IconSpinner className="h-6 w-6 text-slate-300" />
              </div>
            ) : rxFetchError ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <IconAlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">Could not check for existing prescriptions</p>
                  <p className="text-xs text-amber-700 mt-0.5">{rxFetchError}</p>
                  <p className="text-xs text-amber-600 mt-1 italic">Proceed with caution — verify manually if needed.</p>
                </div>
              </div>
            ) : !activeRx ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <IconCheckCircle className="h-4 w-4 text-slate-300 shrink-0" />
                <p className="text-xs text-slate-400 italic">
                  {carriedForward
                    ? "Previous prescription discontinued. New prescription is blank — add medicines below."
                    : "No active prescription — proceed to prescribe below."}
                </p>
              </div>
            ) : !carriedForward ? (
              <div className="space-y-2">
                <ActiveRxReview
                  rx={activeRx}
                  onDiscontinue={handleDiscontinue}
                  onContinueAndAdd={handleContinueAndAdd}
                  isDiscontinuing={discontinuing}
                />
                {discontinueErr && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
                    <IconAlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-xs font-medium text-red-700">{discontinueErr}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <IconCheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800">
                    Existing prescription remains active
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    New prescription below is blank. Add medicines manually before saving.
                  </p>
                </div>
              </div>
            )}
          </div>

          {showNewRxForm && (
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Prescription Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Issued Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      className={inp}
                      value={issuedDate}
                      onChange={(e) => {
                        setIssuedDate(e.target.value);
                        setDateErr(null);
                        setMedErrors((prev) => {
                          const next: typeof prev = {};
                          Object.entries(prev).forEach(([k, v]) => {
                            next[Number(k)] = { ...v, durationDays: "" };
                          });
                          return next;
                        });
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      className={`${inp}${dateErr ? " !border-red-300 !bg-red-50/30" : ""}`}
                      value={validUntil}
                      min={issuedDate}
                      onChange={(e) => {
                        setValidUntil(e.target.value);
                        setDateErr(null);
                        setMedErrors((prev) => {
                          const next: typeof prev = {};
                          Object.entries(prev).forEach(([k, v]) => {
                            next[Number(k)] = { ...v, durationDays: "" };
                          });
                          return next;
                        });
                      }}
                    />
                  </div>
                  {dateErr && (
                    <div className="col-span-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                      <IconAlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <p className="text-xs font-medium text-red-600">{dateErr}</p>
                    </div>
                  )}
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

                  {hasActiveCarePlan ? (
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
                  ) : (
                    <div>
                      <p className="text-xs italic text-slate-400">
                        Clinical notes are available for patients with an active care plan.
                      </p>
                    </div>
                  )}
                </div>
              </div>

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
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <IconAlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-red-700">{err}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {meds.map((med, i) => {
                    const mErr = medErrors[i] ?? {};
                    const inpField = (hasErr: boolean) =>
                      `${inp}${hasErr ? " !border-red-300 !bg-red-50/30 focus:!border-red-400" : ""}`;

                    const days = Number(med.durationDays);
                    const medEnd = issuedDate && days >= 1
                      ? (() => { const d = new Date(issuedDate); d.setDate(d.getDate() + days - 1); return d; })()
                      : null;
                    const overruns = medEnd && validUntil && medEnd > new Date(validUntil);
                    const medEndLabel = medEnd
                      ? fmtDateShort(medEnd)
                      : null;

                    return (
                      <div
                        key={i}
                        className={`rounded-2xl border p-4 ${overruns
                            ? "border-amber-300 bg-amber-50/30"
                            : Object.keys(mErr).length
                              ? "border-red-200 bg-red-50/20"
                              : "border-slate-200 bg-slate-50"
                          }`}
                      >
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
                              className={inpField(!!mErr.medicineName)}
                              value={med.medicineName}
                              onChange={(e) => changeMed(i, "medicineName", e.target.value)}
                              placeholder="e.g. Amoxicillin 500mg"
                            />
                            {mErr.medicineName && (
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                                <IconAlertCircle className="h-3 w-3 shrink-0" />{mErr.medicineName}
                              </p>
                            )}
                          </div>
                          <div className="col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-slate-500">
                              Dosage <span className="text-red-400">*</span>
                            </label>
                            <input
                              className={inpField(!!mErr.dosage)}
                              value={med.dosage}
                              onChange={(e) => changeMed(i, "dosage", e.target.value)}
                              placeholder="e.g. 2 tablets · 500mg"
                            />
                            {mErr.dosage && (
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                                <IconAlertCircle className="h-3 w-3 shrink-0" />{mErr.dosage}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500">
                              Duration (days) <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={365}
                              className={inpField(!!mErr.durationDays || !!overruns)}
                              value={med.durationDays}
                              onChange={(e) => changeMed(i, "durationDays", Number(e.target.value))}
                            />
                            {medEndLabel && !mErr.durationDays && (
                              <p className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${overruns ? "text-amber-600" : "text-slate-400"
                                }`}>
                                {overruns && <IconAlertCircle className="h-3 w-3 shrink-0" />}
                                Last dose: {medEndLabel}
                                {overruns && " — exceeds Valid Until"}
                              </p>
                            )}
                            {mErr.durationDays && (
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                                <IconAlertCircle className="h-3 w-3 shrink-0" />{mErr.durationDays}
                              </p>
                            )}
                          </div>
                          <div className="col-span-3">
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
                          <div className="col-span-4">
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
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-100 px-6 py-5">
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
          )}

          {!showNewRxForm && (
            <div className="flex gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};