import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  getDoctorAppointments,
  updateAppointmentStatusDoctor,
  type Appointment,
} from "../../../../api/appointment/doctor-appointment.api";

import {
  createPrescription,
  type Medicine,
  type CreatePrescriptionPayload,
} from "../../../../api/prescriptions/doctor-prescription.api";

import {
  getPatientMedicalHistory,
  type PatientMedicalHistory,
} from "../../../../api/patients/doctor-patient.api";

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
  IconSpinner,
} from "../../common/icons";

// Constants & Utilities

const today = () => new Date().toISOString().slice(0, 10);

// Standardized medication frequency options to ensure consistent clinical documentation.
const FREQ = [
  "Once daily", "Twice daily", "Three times daily", "Four times daily",
  "Every 6 hours", "Every 8 hours", "Every 12 hours", "PRN (as needed)",
  "Before meals", "After meals", "With food", "At bedtime",
];

const inp =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-300";

const EMPTY_MED: Medicine = {
  medicineName: "",
  dosage:       "",
  frequency:    FREQ[0],
  durationDays: 7,
  instructions: "",
};

// Prescription Creation Workflow

// Provides a comprehensive interface for issuing digital prescriptions, allowing doctors to detail dosages, frequencies, and clinical notes.
interface PrescribeModalProps {
  appointment: Appointment;
  onClose:     () => void;
  onSuccess:   (prescriptionId: string, appointmentId: string) => void;
}

const PrescribeModal: React.FC<PrescribeModalProps> = ({
  appointment,
  onClose,
  onSuccess,
}) => {
  const { patient, id: appointmentId, familyMember } = appointment;
  const [diagnosis,  setDiagnosis]   = useState("");
  const [notes,      setNotes]       = useState("");
  const [issuedDate, setIssuedDate]  = useState(today());
  const [validUntil, setValidUntil]  = useState("");
  const [meds,       setMeds]        = useState<Medicine[]>([{ ...EMPTY_MED }]);
  const [saving,     setSaving]      = useState(false);
  const [err,        setErr]         = useState<string | null>(null);

  const addMed    = () => setMeds((m) => [...m, { ...EMPTY_MED }]);
  const removeMed = (i: number) => setMeds((m) => m.filter((_, x) => x !== i));
  const changeMed = (i: number, field: keyof Medicine, val: string | number) =>
    setMeds((m) => m.map((x, idx) => (idx === i ? { ...x, [field]: val } : x)));

  // Persists the prescription to the backend and associates it with the active appointment record.

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
      ...(notes.trim()      && { notes:     notes.trim() }),
      ...(validUntil        && { validUntil }),
      medicines: meds.map((m) => ({
        ...m,
        durationDays: Number(m.durationDays),
        // Omit empty instructions to keep the payload clean
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

// Medical History Repository

// Allows doctors to review a patient's clinical background, including vital signs and historical prescriptions, to inform current treatment.
interface MedicalHistoryModalProps {
  patientId:   string;
  patientName: string;
  onClose:     () => void;
}

const statusBadge = (s: string) => {
  if (s === "Warning")  return "bg-amber-50 text-amber-700 ring-amber-100";
  if (s === "Critical") return "bg-red-50 text-red-700 ring-red-100";
  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
};

const rxBadge = (s: string | null) => {
  if (s === "completed")    return "bg-slate-100 text-slate-600";
  if (s === "discontinued") return "bg-red-50 text-red-600";
  return "bg-emerald-50 text-emerald-700";
};

const MedicalHistoryModal: React.FC<MedicalHistoryModalProps> = ({
  patientId,
  patientName,
  onClose,
}) => {
  const [data, setData]       = useState<PatientMedicalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [openRx, setOpenRx]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPatientMedicalHistory(patientId)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e: any) => { if (!cancelled) { setError(e.message ?? "Failed to load history"); setLoading(false); } });
    return () => { cancelled = true; };
  }, [patientId]);

  const { patient, vitalRecords = [], prescriptions = [] } = data ?? {};

  const calcAge = (dob: string) => {
    const d = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
    return age;
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto p-4 pt-6">
      {/* Backdrop */}
      <button
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 mb-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100">
              <IconActivity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Medical History</h2>
              <p className="text-xs text-slate-400">
                Patient — <span className="font-semibold text-slate-700">{patientName}</span>
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

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="divide-y divide-slate-100">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <IconSpinner className="h-9 w-9 text-blue-500" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-red-600">{error}</p>
            </div>
          )}

          {/* Content */}
          {!loading && !error && patient && (
            <>
              {/* ── 1. Patient Details ───────────────────────────────────── */}
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Patient Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Full Name",   value: patient.fullName },
                    { label: "Age",         value: patient.dateOfBirth ? `${calcAge(patient.dateOfBirth)} yrs` : "—" },
                    { label: "Gender",      value: patient.gender ?? "—" },
                    { label: "Blood Group", value: patient.bloodGroup ?? "—" },
                    { label: "NIC",         value: patient.nic },
                    { label: "Contact",     value: patient.contactNumber ?? "—" },
                    { label: "Emergency",   value: patient.emergencyContact ?? "—" },
                    { label: "Address",     value: patient.address ?? "—" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
                      <p className="text-xs font-semibold text-slate-800 break-words">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 2. Medical Information ───────────────────────────────── */}
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Medical Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Medical History",      value: patient.medicalHistory,      color: "bg-blue-50 ring-blue-100" },
                    { label: "Allergies",            value: patient.allergies,            color: "bg-red-50 ring-red-100" },
                    { label: "Current Medications",  value: patient.currentMedications,   color: "bg-purple-50 ring-purple-100" },
                    { label: "Chronic Conditions",   value: patient.chronicConditions,    color: "bg-amber-50 ring-amber-100" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-xl px-4 py-3 ring-1 ${color}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {value?.trim() || <span className="italic text-slate-400">None recorded</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 3. Vital Records ─────────────────────────────────────── */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Vital Records
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                    {vitalRecords.length} record{vitalRecords.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {vitalRecords.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-4 text-sm italic text-slate-400 text-center">
                    No vital records have been recorded yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          {["Date", "Blood Pressure", "Heart Rate", "Temp (°C)", "O₂ Sat", "Weight (kg)", "Status"].map((h) => (
                            <th key={h} className="px-3 py-2.5 font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {vitalRecords.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-3 py-2.5 font-medium text-slate-700 whitespace-nowrap">
                              {new Date(v.recordedAt).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                              })}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">{v.bloodPressure ?? "—"}</td>
                            <td className="px-3 py-2.5 text-slate-600">{v.heartRate != null ? `${v.heartRate} bpm` : "—"}</td>
                            <td className="px-3 py-2.5 text-slate-600">{v.temperature != null ? v.temperature : "—"}</td>
                            <td className="px-3 py-2.5 text-slate-600">{v.oxygenSaturation != null ? `${v.oxygenSaturation}%` : "—"}</td>
                            <td className="px-3 py-2.5 text-slate-600">{v.weight != null ? v.weight : "—"}</td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex rounded-full px-2.5 py-1 font-bold ring-1 ${statusBadge(v.status)}`}>
                                {v.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── 4. Previous Prescriptions ────────────────────────────── */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Previous Prescriptions
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                    {prescriptions.length} prescription{prescriptions.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {prescriptions.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-4 text-sm italic text-slate-400 text-center">
                    No previous prescriptions on record.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map((rx) => {
                      const isOpen = openRx === rx.id;
                      return (
                        <div key={rx.id} className="rounded-2xl border border-slate-200 overflow-hidden">
                          {/* Prescription header — clickable to expand */}
                          <button
                            type="button"
                            onClick={() => setOpenRx(isOpen ? null : rx.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                                <IconPill className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                  {rx.diagnosis ?? "Prescription"}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {new Date(rx.issuedDate).toLocaleDateString("en-GB", {
                                    day: "2-digit", month: "short", year: "numeric",
                                  })}
                                  {" · "}
                                  {rx.doctor?.user?.fullName
                                    ? `Dr. ${rx.doctor.user.fullName}`
                                    : "Unknown Doctor"}
                                  {rx.doctor?.specialization && (
                                    <span className="text-slate-300"> · {rx.doctor.specialization}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${rxBadge(rx.status)}`}>
                                {rx.status ?? "active"}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
                                {rx.medicines.length} med{rx.medicines.length !== 1 ? "s" : ""}
                              </span>
                              {isOpen
                                ? <IconChevronUp className="h-4 w-4 text-slate-400" />
                                : <IconChevronDown className="h-4 w-4 text-slate-400" />}
                            </div>
                          </button>

                          {/* Expanded medicine list */}
                          {isOpen && (
                            <div className="border-t border-slate-100 bg-slate-50 px-4 pb-4 pt-3 space-y-3">
                              {rx.notes && (
                                <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 ring-1 ring-blue-100">
                                  <span className="font-bold">Notes: </span>{rx.notes}
                                </p>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {rx.medicines.map((med, mi) => (
                                  <div
                                    key={mi}
                                    className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200 space-y-0.5"
                                  >
                                    <p className="text-sm font-bold text-slate-800">{med.medicineName}</p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                                      <span>
                                        <span className="font-semibold text-slate-600">Dose:</span>{" "}
                                        {med.dosage}
                                      </span>
                                      <span>
                                        <span className="font-semibold text-slate-600">Freq:</span>{" "}
                                        {med.frequency}
                                      </span>
                                      <span>
                                        <span className="font-semibold text-slate-600">Duration:</span>{" "}
                                        {med.durationDays} day{med.durationDays !== 1 ? "s" : ""}
                                      </span>
                                    </div>
                                    {med.instructions && (
                                      <p className="text-[11px] italic text-slate-400">{med.instructions}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer close button */}
        <div className="border-t border-slate-100 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
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
  onViewHistory:   (appt: Appointment) => void;
  onConfirm:       (appt: Appointment) => void;
  localPrescribed: Set<string>;
  confirming:      string | null;
}

const SlotCard: React.FC<SlotCardProps> = ({ group, onPrescribe, onViewHistory, onConfirm, localPrescribed, confirming }) => {
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
            {total} patient{total !== 1 ? "s" : ""}
          </span>
          {expanded
            ? <IconChevronUp className="h-4 w-4 text-slate-400" />
            : <IconChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100">
          {group.appointments.map((appt, idx) => {
            const isPending  = appt.status === "pending";
            const prescribed = !!appt.prescriptionId || localPrescribed.has(appt.id);
            return (
              <div
                key={appt.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 ${
                  idx < group.appointments.length - 1 ? "border-b border-slate-100" : ""
                } hover:bg-slate-50/60 transition`}
              >
                {/* Patient info */}
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

                {/* Booked by */}
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Booked by</p>
                  <p className="text-sm text-slate-700 truncate">
                    {appt.familyMember?.user?.fullName ?? "—"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {appt.familyMember?.user?.email ?? ""}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* View Medical History — always visible */}
                  <button
                    type="button"
                    onClick={() => onViewHistory(appt)}
                    className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 active:scale-95 transition"
                  >
                    <IconActivity className="h-3.5 w-3.5" />
                    Medical History
                  </button>

                  {/* Pending → Confirm; Confirmed → Prescribe */}
                  {isPending ? (
                    <button
                      type="button"
                      onClick={() => onConfirm(appt)}
                      disabled={confirming === appt.id}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-95 disabled:opacity-60 transition"
                    >
                      <IconUserCheck className="h-3.5 w-3.5" />
                      {confirming === appt.id ? "Confirming…" : "Confirm"}
                    </button>
                  ) : prescribed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      <IconCheckCircle className="h-3.5 w-3.5" /> Prescribed
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600 ring-1 ring-amber-100">
                        Not Prescribed
                      </span>
                      <button
                        type="button"
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
  const [appointments, setAppointments]       = useState<Appointment[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [prescribeAppt, setPrescribeAppt]     = useState<Appointment | null>(null);
  const [historyAppt, setHistoryAppt]         = useState<Appointment | null>(null);
  const [localPrescribed, setLocalPrescribed] = useState<Set<string>>(new Set());
  const [confirming, setConfirming]           = useState<string | null>(null);

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

  const handleConfirm = useCallback(async (appt: Appointment) => {
    setConfirming(appt.id);
    try {
      await updateAppointmentStatusDoctor(appt.id, "confirmed" as any);
      setAppointments((prev) =>
        prev.map((a) => a.id === appt.id ? { ...a, status: "confirmed" as const } : a),
      );
      addToast("Appointment confirmed successfully.", "success");
    } catch (e: any) {
      addToast(e.message ?? "Failed to confirm appointment.", "error");
    } finally {
      setConfirming(null);
    }
  }, [addToast]);

  const slotGroups = useMemo<SlotGroup[]>(() => {
    // Show both pending (awaiting doctor confirmation) and confirmed appointments
    const active = appointments.filter(
      (a) => a.status === "pending" || a.status === "confirmed",
    );
    const map = new Map<string, SlotGroup>();

    for (const appt of active) {
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
  const totalPending   = appointments.filter((a) => a.status === "pending").length;

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
      <IconSpinner className="h-10 w-10 text-emerald-500" />
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
            Patient bookings grouped by slot — confirm pending patients or prescribe for confirmed ones
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalPending > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending</p>
              <p className="text-2xl font-extrabold text-amber-700">{totalPending}</p>
            </div>
          )}
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
              onViewHistory={setHistoryAppt}
              onConfirm={handleConfirm}
              localPrescribed={localPrescribed}
              confirming={confirming}
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
              onViewHistory={setHistoryAppt}
              onConfirm={handleConfirm}
              localPrescribed={localPrescribed}
              confirming={confirming}
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

      {/* Medical History modal */}
      {historyAppt && (
        <MedicalHistoryModal
          patientId={historyAppt.patientId}
          patientName={historyAppt.patient?.fullName ?? "Patient"}
          onClose={() => setHistoryAppt(null)}
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