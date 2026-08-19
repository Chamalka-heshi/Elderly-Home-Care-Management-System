import React, { useEffect, useState, useMemo } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";
import {
  getAssignedPatients,
  getAllMedicationLogs,
  createMedicationLog,
  updateMedicationLog,
  getActivePrescriptionsForCaregiver,
  type MedicationLog,
  type CaregiverPrescription,
  type PrescribedMedicine,
} from "../../../../api/caregivers/caregiver.api";
import type { Patient } from "../../../../api/patients/patient.types";
import {
  IconPill,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconSearch,
  IconPlus,
  IconX,
  IconUser,
  IconStethoscope,
} from "../../common/icons";

type MedicationStatus = "Administered" | "Pending" | "Missed";
type FilterTab = "All" | "Pending" | "Administered" | "Missed";

const statusTone = (s: string) =>
  s === "Administered" ? ("emerald" as const)
  : s === "Pending"    ? ("amber"   as const)
  : s === "Missed"     ? ("red"     as const)
  :                      ("slate"   as const);

interface ActivePrescribedMedication {
  key: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  patientPlan?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
  instructions?: string;
  doctorName: string;
  doctorSpecialization?: string;
  diagnosis?: string;
  status: MedicationStatus;
  logId?: string;
}

interface NewLogForm {
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  notes: string;
}

const emptyForm = (): NewLogForm => ({
  patientId: "",
  medicationName: "",
  dosage: "",
  frequency: "",
  notes: "",
});

const MedicationUpdates: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prescriptions, setPrescriptions] = useState<CaregiverPrescription[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatusKey, setSavingStatusKey] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewLogForm>(emptyForm());
  const [customMedicine, setCustomMedicine] = useState(false);

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [patientsRes, prescriptionsRes, logsRes] = await Promise.all([
        getAssignedPatients(),
        getActivePrescriptionsForCaregiver(),
        getAllMedicationLogs(),
      ]);

      setPatients(patientsRes.patients ?? []);
      setPrescriptions(prescriptionsRes ?? []);
      setLogs(logsRes ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load medication updates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Map active prescriptions to structured list of prescribed medicines
  const activeMedications = useMemo<ActivePrescribedMedication[]>(() => {
    const list: ActivePrescribedMedication[] = [];

    prescriptions.forEach((rx) => {
      const patient = patients.find((p) => p.id === rx.patientId);
      const patientName = rx.patientName || patient?.fullName || "Unknown Patient";
      const patientPlan = patient?.paymentPlan;
      const doctorName = rx.doctor?.user?.fullName
        ? `Dr. ${rx.doctor.user.fullName}`
        : "Attending Doctor";
      const doctorSpecialization = rx.doctor?.specialization;

      (rx.medicines ?? []).forEach((med: PrescribedMedicine, idx: number) => {
        // Find most recent log for this patient and medication
        const matchingLog = logs.find(
          (l) =>
            l.patientId === rx.patientId &&
            l.medicationName.trim().toLowerCase() === med.medicineName.trim().toLowerCase()
        );

        const currentStatus: MedicationStatus =
          matchingLog?.status === "Administered"
            ? "Administered"
            : matchingLog?.status === "Missed"
            ? "Missed"
            : "Pending";

        list.push({
          key: `${rx.id}-${med.medicineName}-${idx}`,
          prescriptionId: rx.id,
          patientId: rx.patientId ?? "",
          patientName,
          patientPlan,
          medicineName: med.medicineName,
          dosage: med.dosage || "As prescribed",
          frequency: med.frequency || "Daily",
          durationDays: med.durationDays,
          instructions: med.instructions || rx.notes || "",
          doctorName,
          doctorSpecialization,
          diagnosis: rx.diagnosis ?? undefined,
          status: currentStatus,
          logId: matchingLog?.id,
        });
      });
    });

    return list;
  }, [prescriptions, patients, logs]);

  // Counts for summary cards
  const counts = useMemo(() => {
    return {
      Administered: activeMedications.filter((m) => m.status === "Administered").length,
      Pending: activeMedications.filter((m) => m.status === "Pending").length,
      Missed: activeMedications.filter((m) => m.status === "Missed").length,
    };
  }, [activeMedications]);

  // Filtered active medications based on search and tab
  const filteredActiveMedications = useMemo(() => {
    return activeMedications.filter((item) => {
      const matchesTab = activeTab === "All" || item.status === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.patientName.toLowerCase().includes(q) ||
        item.medicineName.toLowerCase().includes(q) ||
        item.doctorName.toLowerCase().includes(q) ||
        (item.diagnosis ?? "").toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [activeMedications, activeTab, searchQuery]);

  // Handle status toggle for a prescribed medication
  const handleUpdateStatus = async (
    item: ActivePrescribedMedication,
    newStatus: MedicationStatus
  ) => {
    if (item.status === newStatus) return;

    setSavingStatusKey(item.key);
    setError(null);
    try {
      if (item.logId) {
        // Update existing log
        const updated = await updateMedicationLog(item.logId, { status: newStatus });
        setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      } else {
        // Create new log record
        const created = await createMedicationLog({
          patientId: item.patientId,
          medicationName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          status: newStatus,
          notes: item.instructions || undefined,
        });
        setLogs((prev) => [created, ...prev]);
      }

      showToast(`Updated "${item.medicineName}" to ${newStatus} for ${item.patientName}`);
    } catch (err: any) {
      setError(err.message ?? "Failed to update medication status.");
    } finally {
      setSavingStatusKey(null);
    }
  };

  // Open & Close Add Medication Log Modal
  const openModal = () => {
    setForm(emptyForm());
    setCustomMedicine(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm());
    setCustomMedicine(false);
  };

  // Available medicines for selected patient in modal
  const selectedPatientPrescriptions = useMemo(() => {
    if (!form.patientId) return [];
    return prescriptions.filter((p) => p.patientId === form.patientId);
  }, [form.patientId, prescriptions]);

  const availableMedicinesForPatient = useMemo(() => {
    const meds: PrescribedMedicine[] = [];
    selectedPatientPrescriptions.forEach((rx) => {
      (rx.medicines ?? []).forEach((m) => {
        if (!meds.some((existing) => existing.medicineName.toLowerCase() === m.medicineName.toLowerCase())) {
          meds.push(m);
        }
      });
    });
    return meds;
  }, [selectedPatientPrescriptions]);

  const handlePatientSelectChange = (pId: string) => {
    setForm((f) => ({
      ...f,
      patientId: pId,
      medicationName: "",
      dosage: "",
      frequency: "",
    }));
    setCustomMedicine(false);
  };

  const handleMedicineSelectChange = (medName: string) => {
    if (medName === "__CUSTOM__") {
      setCustomMedicine(true);
      setForm((f) => ({ ...f, medicationName: "", dosage: "", frequency: "" }));
      return;
    }

    setCustomMedicine(false);
    const found = availableMedicinesForPatient.find((m) => m.medicineName === medName);
    setForm((f) => ({
      ...f,
      medicationName: medName,
      dosage: found?.dosage ?? f.dosage,
      frequency: found?.frequency ?? f.frequency,
      notes: found?.instructions ?? f.notes,
    }));
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) {
      setError("Please select a patient.");
      return;
    }
    if (!form.medicationName.trim()) {
      setError("Please specify a medication name.");
      return;
    }

    setSavingForm(true);
    setError(null);
    try {
      const created = await createMedicationLog({
        patientId: form.patientId,
        medicationName: form.medicationName.trim(),
        dosage: form.dosage.trim() || undefined,
        frequency: form.frequency.trim() || undefined,
        notes: form.notes.trim() || undefined,
        status: "Administered",
      });

      setLogs((prev) => [created, ...prev]);
      closeModal();
      showToast(`Medication "${form.medicationName.trim()}" logged successfully.`);
    } catch (err: any) {
      setError(err.message ?? "Failed to save medication log.");
    } finally {
      setSavingForm(false);
    }
  };

  const patientNameById = (id: string) =>
    patients.find((p) => p.id === id)?.fullName ?? "Unknown Patient";

  return (
    <div className="space-y-8">
      {/* ── Header Toast ──────────────────────────────────────────────────── */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-2xl transition-all">
          <IconCheck className="h-5 w-5" />
          {successToast}
        </div>
      )}

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(["Administered", "Pending", "Missed"] as MedicationStatus[]).map((st) => {
          const isSelected = activeTab === st;
          return (
            <button
              key={st}
              onClick={() => setActiveTab((prev) => (prev === st ? "All" : st))}
              className={[
                "group relative overflow-hidden rounded-3xl border p-5 text-left transition duration-200",
                isSelected
                  ? st === "Administered"
                    ? "border-emerald-400 bg-emerald-50/80 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                    : st === "Pending"
                    ? "border-amber-400 bg-amber-50/80 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20"
                    : "border-red-400 bg-red-50/80 shadow-lg shadow-red-500/10 ring-2 ring-red-500/20"
                  : "border-slate-200/70 bg-white/80 backdrop-blur-xl hover:-translate-y-0.5 hover:shadow-md",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {st}
                </span>
                <Badge tone={statusTone(st)}>{st}</Badge>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {loading ? "…" : counts[st]}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {st === "Administered"
                  ? "Prescribed medicines marked as administered"
                  : st === "Pending"
                  ? "Awaiting administration for today"
                  : "Medications marked as missed"}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar: Search + Filter Tabs + Action Button ──────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(["All", "Pending", "Administered", "Missed"] as FilterTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  "rounded-2xl px-4 py-2 text-xs font-semibold transition",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {tab}
                {tab !== "All" && !loading && ` (${counts[tab as MedicationStatus]})`}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <IconSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, medicine, doctor…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          {/* Add Log Button */}
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
          >
            <IconPlus className="h-4 w-4" />
            Log Medication
          </button>
        </div>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <div className="flex items-center gap-2">
            <IconAlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="rounded-lg p-1 text-red-500 hover:bg-red-100"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── SECTION 1: Active Doctor Prescriptions & Medication Updates ─────── */}
      <TableShell
        title="Medication Updates & Prescriptions"
        subtitle="Active doctor prescriptions for patients registered to a care plan. Mark medications as administered, pending, or missed."
      >
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Fetching active prescriptions and care plan patients…
          </div>
        ) : filteredActiveMedications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <IconPill className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {activeMedications.length === 0
                ? "No active prescriptions found for registered care plan patients."
                : `No ${activeTab.toLowerCase()} medications match your filter.`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {activeMedications.length === 0
                ? "Prescriptions issued by doctors will automatically appear here once patients are subscribed to a care plan."
                : "Try switching tabs or adjusting your search keywords."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredActiveMedications.map((item) => {
              const isUpdating = savingStatusKey === item.key;
              return (
                <div
                  key={item.key}
                  className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="space-y-3">
                    {/* Patient & Care Plan Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-700">
                          <IconUser className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {item.patientName}
                          </h4>
                          {item.patientPlan && (
                            <span className="inline-block text-[11px] font-semibold text-emerald-700">
                              {item.patientPlan} Plan
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Doctor Info */}
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                          <IconStethoscope className="h-3.5 w-3.5 text-blue-600" />
                          {item.doctorName}
                        </span>
                        {item.doctorSpecialization && (
                          <p className="text-[10px] text-slate-400">
                            {item.doctorSpecialization}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Medication details */}
                    <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <IconPill className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="text-sm font-bold text-slate-900">
                            {item.medicineName}
                          </span>
                        </div>
                        <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm border border-slate-200/60">
                          {item.dosage}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                          {item.frequency}
                        </span>
                        {item.durationDays && (
                          <span className="text-slate-400">
                            · Duration: {item.durationDays} days
                          </span>
                        )}
                      </div>

                      {item.instructions && (
                        <p className="text-xs text-slate-600 bg-white/70 rounded-xl p-2 border border-slate-200/50 italic">
                          <span className="font-semibold not-italic text-slate-500">Instructions: </span>
                          {item.instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Marking Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-500">
                      Current Status:
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Administered Button */}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(item, "Administered")}
                        className={[
                          "inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:opacity-50",
                          item.status === "Administered"
                            ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20"
                            : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700",
                        ].join(" ")}
                      >
                        <IconCheck className="h-3.5 w-3.5" />
                        Administered
                      </button>

                      {/* Pending Button */}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(item, "Pending")}
                        className={[
                          "inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:opacity-50",
                          item.status === "Pending"
                            ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20"
                            : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700",
                        ].join(" ")}
                      >
                        <IconClock className="h-3.5 w-3.5" />
                        Pending
                      </button>

                      {/* Missed Button */}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(item, "Missed")}
                        className={[
                          "inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:opacity-50",
                          item.status === "Missed"
                            ? "bg-red-600 text-white shadow-sm ring-2 ring-red-500/20"
                            : "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700",
                        ].join(" ")}
                      >
                        <IconX className="h-3.5 w-3.5" />
                        Missed
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TableShell>

      {/* ── SECTION 2: Clean Medication Log (No scheduled, date, status, action) */}
      <TableShell
        title="Medication Log"
        subtitle="Clean history of logged medications for your assigned patients."
      >
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Loading medication logs…
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Medication</th>
                  <th className="px-4 py-3">Dosage</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {patientNameById(l.patientId)}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      {l.medicationName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {l.dosage || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {l.frequency || "—"}
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-xs text-slate-500">
                      {l.notes || "—"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      No medication logs recorded yet. Use "+ Log Medication" to record an entry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableShell>

      {/* ── Modal: Add Log Medication ───────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Log Medication</h3>
                <p className="text-xs text-slate-500">
                  Record a medication log for an assigned patient.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 transition"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4">
              {/* Patient */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.patientId}
                  onChange={(e) => handlePatientSelectChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="">Select patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} {p.paymentPlan ? `(${p.paymentPlan} Plan)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Medication Selection */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">
                    Medication <span className="text-red-500">*</span>
                  </label>
                  {form.patientId && availableMedicinesForPatient.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMedicine(!customMedicine);
                        setForm((f) => ({ ...f, medicationName: "" }));
                      }}
                      className="text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      {customMedicine ? "Choose from prescriptions" : "+ Enter custom name"}
                    </button>
                  )}
                </div>

                {!customMedicine && availableMedicinesForPatient.length > 0 ? (
                  <select
                    required
                    value={form.medicationName}
                    onChange={(e) => handleMedicineSelectChange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  >
                    <option value="">Select prescribed medication…</option>
                    {availableMedicinesForPatient.map((m, idx) => (
                      <option key={idx} value={m.medicineName}>
                        {m.medicineName} {m.dosage ? `(${m.dosage})` : ""} - {m.frequency}
                      </option>
                    ))}
                    <option value="__CUSTOM__">Other (Enter custom medication)…</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 500mg"
                    value={form.medicationName}
                    onChange={(e) => setForm((f) => ({ ...f, medicationName: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  />
                )}
              </div>

              {/* Dosage & Frequency */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Dosage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg, 1 tablet"
                    value={form.dosage}
                    onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Frequency
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Twice daily after meals"
                    value={form.frequency}
                    onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Caregiver Notes / Observations
                </label>
                <textarea
                  rows={3}
                  placeholder="Patient tolerated well, taken with water, etc…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={savingForm}
                  className="flex-1 rounded-2xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingForm ? "Saving…" : "Save Log"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationUpdates;