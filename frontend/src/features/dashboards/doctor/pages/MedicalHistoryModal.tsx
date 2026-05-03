import React, { useEffect, useState } from "react";

import {
  getPatientMedicalHistory,
  type PatientMedicalHistory,
} from "../../../../api/patients/doctor-patient.api";

import {
  IconActivity,
  IconChevronDown,
  IconChevronUp,
  IconPill,
  IconSpinner,
  IconX,
} from "../../common/icons";

// Helper functions to calculate age and badge styles

// Changes colors for health status badges to show how serious they are
const statusBadge = (s: string) => {
  if (s === "Warning") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (s === "Critical") return "bg-red-50 text-red-700 ring-red-100";
  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
};

const rxBadge = (s: string | null) => {
  if (s === "completed") return "bg-slate-100 text-slate-600";
  if (s === "discontinued") return "bg-red-50 text-red-600";
  return "bg-emerald-50 text-emerald-700";
};

const calcAge = (dob: string) => {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
};

// MedicalHistoryModal
// Shows a patient's full medical history and past medicines to help the doctor

export interface MedicalHistoryModalProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
}

export const MedicalHistoryModal: React.FC<MedicalHistoryModalProps> = ({
  patientId,
  patientName,
  onClose,
}) => {
  const [data, setData] = useState<PatientMedicalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openRx, setOpenRx] = useState<string | null>(null);

  // Fetches the patient's medical history from the server
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

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto p-4 pt-6">
      <button
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 mb-8">

        {/* Modal Header */}
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

        <div className="divide-y divide-slate-100">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <IconSpinner className="h-9 w-9 text-blue-500" />
            </div>
          )}
          {!loading && error && (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-red-600">{error}</p>
            </div>
          )}
          {!loading && !error && patient && (
            <>
              {/* Patient's basic information like age and NIC */}
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Patient Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Full Name", value: patient.fullName },
                    { label: "Age", value: patient.dateOfBirth ? `${calcAge(patient.dateOfBirth)} yrs` : "—" },
                    { label: "Gender", value: patient.gender ?? "—" },
                    { label: "Blood Group", value: patient.bloodGroup ?? "—" },
                    { label: "NIC", value: patient.nic },
                    { label: "Contact", value: patient.contactNumber ?? "—" },
                    { label: "Emergency", value: patient.emergencyContact ?? "—" },
                    { label: "Address", value: patient.address ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
                      <p className="text-xs font-semibold text-slate-800 break-words">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient's medical conditions and allergies */}
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Medical Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Medical History", value: patient.medicalHistory, color: "bg-blue-50 ring-blue-100" },
                    { label: "Allergies", value: patient.allergies, color: "bg-red-50 ring-red-100" },
                    { label: "Current Medications", value: patient.currentMedications, color: "bg-purple-50 ring-purple-100" },
                    { label: "Chronic Conditions", value: patient.chronicConditions, color: "bg-amber-50 ring-amber-100" },
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

              {/* Past health measurements like blood pressure and heart rate */}
              {patient.paymentPlan && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Vital Records</h3>
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
                                {new Date(v.recordedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
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
              )}

              {/* List of past prescriptions issued to this patient */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Previous Prescriptions</h3>
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
                                  {new Date(rx.issuedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                  {" · "}
                                  {rx.doctor?.user?.fullName ? `Dr. ${rx.doctor.user.fullName}` : "Unknown Doctor"}
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
                          {isOpen && (
                            <div className="border-t border-slate-100 bg-slate-50 px-4 pb-4 pt-3 space-y-3">
                              {rx.notes && (
                                <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 ring-1 ring-blue-100">
                                  <span className="font-bold">Notes: </span>{rx.notes}
                                </p>
                              )}
                              <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="min-w-full text-xs bg-white">
                                  <thead>
                                    <tr className="bg-slate-50 text-left border-b border-slate-200">
                                      {["Medicine", "Dosage", "Frequency", "Duration", "Instructions"].map((h) => (
                                        <th key={h} className="px-3 py-2 font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {rx.medicines.map((med, mi) => (
                                      <tr key={mi} className="hover:bg-slate-50/60 transition">
                                        <td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">{med.medicineName}</td>
                                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{med.dosage}</td>
                                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{med.frequency}</td>
                                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{med.durationDays}d</td>
                                        <td className="px-3 py-2 text-slate-400 italic">
                                          {med.instructions?.trim() || <span className="text-slate-300 not-italic">—</span>}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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