import React, { useEffect, useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";
import {
  getAssignedPatients,
  getAllVitalRecords,
  createVitalRecord,
  updateVitalRecord,
} from "../../../../api/caregivers/caregiver.api";
import type { VitalRecord } from "../../../../api/caregivers/caregiver.api";
import type { Patient } from "../../../../api/patients/patient.types";
import { fmtDateTime } from '../../../../utils/dateTime';

const statusTone = (s: string) =>
  s === "Normal" ? ("emerald" as const) : s === "Warning" ? ("amber" as const) : ("red" as const);

function deriveStatus(hr?: number, spo2?: number, temp?: number): string {
  if ((hr && hr > 110) || (spo2 && spo2 < 90) || (temp && temp > 38.5)) return "Critical";
  if ((hr && (hr > 100 || hr < 50)) || (spo2 && spo2 < 95) || (temp && temp > 37.5)) return "Warning";
  return "Normal";
}

interface RecordForm {
  patientId: string;
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  oxygenSaturation: string;
  weight: string;
}

const emptyForm = (): RecordForm => ({
  patientId: "", bloodPressure: "", heartRate: "", temperature: "", oxygenSaturation: "", weight: "",
});

const VitalRecords: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<VitalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientFilter, setPatientFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<VitalRecord | null>(null);
  const [form, setForm] = useState<RecordForm>(emptyForm());

  const patientName = (id: string) => patients.find((p) => p.id === id)?.fullName ?? "Unknown";

  useEffect(() => {
    Promise.all([getAssignedPatients(), getAllVitalRecords()])
      .then(([pRes, vRes]) => {
        setPatients(pRes.patients as Patient[]);
        setRecords(vRes);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openNew = () => { setEditRecord(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (r: VitalRecord) => {
    setEditRecord(r);
    setForm({
      patientId: r.patientId,
      bloodPressure: r.bloodPressure ?? "",
      heartRate: r.heartRate?.toString() ?? "",
      temperature: r.temperature?.toString() ?? "",
      oxygenSaturation: r.oxygenSaturation?.toString() ?? "",
      weight: r.weight?.toString() ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hr = form.heartRate ? Number(form.heartRate) : undefined;
    const spo2 = form.oxygenSaturation ? Number(form.oxygenSaturation) : undefined;
    const temp = form.temperature ? Number(form.temperature) : undefined;
    const status = deriveStatus(hr, spo2, temp);
    const payload = {
      patientId: form.patientId,
      bloodPressure: form.bloodPressure || undefined,
      heartRate: hr,
      temperature: temp,
      oxygenSaturation: spo2,
      weight: form.weight ? Number(form.weight) : undefined,
      status: status as 'Normal' | 'Warning' | 'Critical',
    };
    setSaving(true);
    try {
      if (editRecord) {
        const updated = await updateVitalRecord(editRecord.id, payload);
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const created = await createVitalRecord(payload);
        setRecords((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setEditRecord(null);
      setForm(emptyForm());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = patientFilter === "All" ? records : records.filter((r) => r.patientId === patientFilter);
  const counts = { Normal: records.filter((r) => r.status === "Normal").length, Warning: records.filter((r) => r.status === "Warning").length, Critical: records.filter((r) => r.status === "Critical").length };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[["Normal", "bg-emerald-50 border-emerald-200"], ["Warning", "bg-amber-50 border-amber-200"], ["Critical", "bg-red-50 border-red-200"]].map(([label, color]) => (
          <div key={label} className={`rounded-2xl border p-5 ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{counts[label as keyof typeof counts]}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setPatientFilter("All")}
          className={["rounded-2xl px-4 py-2 text-xs font-semibold transition", patientFilter === "All" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "border border-slate-200 bg-white text-slate-700 hover:shadow-md"].join(" ")}>All</button>
        {patients.map((p) => (
          <button key={p.id} onClick={() => setPatientFilter(p.id)}
            className={["rounded-2xl px-4 py-2 text-xs font-semibold transition", patientFilter === p.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "border border-slate-200 bg-white text-slate-700 hover:shadow-md"].join(" ")}>
            {p.fullName}
          </button>
        ))}
        <button onClick={openNew} className="ml-auto rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700">
          + Record Vitals
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">⚠ {error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
          <h3 className="mb-4 text-sm font-bold text-slate-900">{editRecord ? "Edit Vital Record" : "Record New Vitals"}</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {!editRecord && (
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Patient *</label>
                <select required value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10">
                  <option value="">Select patient…</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                </select>
              </div>
            )}
            {[
              { key: "bloodPressure", label: "Blood Pressure", placeholder: "e.g. 120/80" },
              { key: "heartRate", label: "Heart Rate (bpm)", placeholder: "e.g. 72" },
              { key: "temperature", label: "Temperature (°C)", placeholder: "e.g. 36.6" },
              { key: "oxygenSaturation", label: "SpO₂ (%)", placeholder: "e.g. 98" },
              { key: "weight", label: "Weight (kg)", placeholder: "e.g. 68.5" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
                <input
                  type={key === "bloodPressure" ? "text" : "number"}
                  step={key === "temperature" || key === "weight" ? "0.1" : "1"}
                  placeholder={placeholder}
                  value={form[key as keyof RecordForm]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={saving}
              className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60">
              {saving ? "Saving…" : editRecord ? "Update Record" : "Save Record"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditRecord(null); setForm(emptyForm()); }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:shadow-md">Cancel</button>
          </div>
        </form>
      )}

      <TableShell title="Vital Records" subtitle={loading ? "Loading…" : "Latest recorded patient vital signs."}>
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading vital records…</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Recorded</th>
                  <th className="px-4 py-3">BP</th>
                  <th className="px-4 py-3">Heart Rate</th>
                  <th className="px-4 py-3">Temp (°C)</th>
                  <th className="px-4 py-3">SpO₂ (%)</th>
                  <th className="px-4 py-3">Weight (kg)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{patientName(r.patientId)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDateTime(r.recordedAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{r.bloodPressure ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.heartRate ? `${r.heartRate} bpm` : "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.temperature ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.oxygenSaturation ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.weight ?? "—"}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(r)} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700">Edit</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">
                    {records.length === 0 ? "No vital records yet. Click \"Record Vitals\" to add the first entry." : "No records for this patient."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableShell>
    </div>
  );
};

export default VitalRecords;
