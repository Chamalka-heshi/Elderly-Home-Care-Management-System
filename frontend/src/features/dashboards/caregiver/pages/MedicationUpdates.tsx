import React, { useEffect, useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";
import {
  getAssignedPatients,
  getAllMedicationLogs,
  createMedicationLog,
  updateMedicationLog,
} from "../../../../api/caregivers/caregiver.api";
import type { MedicationLog } from "../../../../api/caregivers/caregiver.api";
import type { Patient } from "../../../../api/patients/patient.types";

type Status = "Administered" | "Pending" | "Missed" | "Refused";

const statusTone = (s: string) =>
  s === "Administered" ? ("emerald" as const) : s === "Pending" ? ("amber" as const) : s === "Missed" ? ("red" as const) : ("slate" as const);

const STATUSES: Status[] = ["Administered", "Pending", "Missed", "Refused"];

interface LogForm {
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  scheduledTime: string;
  scheduledDate: string;
  status: Status;
  notes: string;
}
const emptyForm = (): LogForm => ({
  patientId: "", medicationName: "", dosage: "", frequency: "", scheduledTime: "", scheduledDate: "", status: "Pending", notes: "",
});

const MedicationUpdates: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editLog, setEditLog] = useState<MedicationLog | null>(null);
  const [form, setForm] = useState<LogForm>(emptyForm());

  const patientName = (id: string) => patients.find((p) => p.id === id)?.fullName ?? "Unknown";

  useEffect(() => {
    Promise.all([getAssignedPatients(), getAllMedicationLogs()])
      .then(([pRes, lRes]) => {
        setPatients(pRes.patients as Patient[]);
        setLogs(lRes);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openNew = () => { setEditLog(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (l: MedicationLog) => {
    setEditLog(l);
    setForm({
      patientId: l.patientId,
      medicationName: l.medicationName,
      dosage: l.dosage ?? "",
      frequency: l.frequency ?? "",
      scheduledTime: l.scheduledTime ?? "",
      scheduledDate: l.scheduledDate ?? "",
      status: l.status as Status,
      notes: l.notes ?? "",
    });
    setShowForm(true);
  };

  const markDone = async (l: MedicationLog) => {
    setSaving(true);
    try {
      const updated = await updateMedicationLog(l.id, { status: "Administered" });
      setLogs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editLog) {
        const updated = await updateMedicationLog(editLog.id, {
          status: form.status,
          notes: form.notes || undefined,
          dosage: form.dosage || undefined,
          frequency: form.frequency || undefined,
          scheduledTime: form.scheduledTime || undefined,
        });
        setLogs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await createMedicationLog({
          patientId: form.patientId,
          medicationName: form.medicationName,
          dosage: form.dosage || undefined,
          frequency: form.frequency || undefined,
          scheduledTime: form.scheduledTime || undefined,
          scheduledDate: form.scheduledDate || undefined,
          status: form.status,
          notes: form.notes || undefined,
        });
        setLogs((prev) => [created, ...prev]);
      }
      setShowForm(false); setEditLog(null); setForm(emptyForm());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = statusFilter === "All" ? logs : logs.filter((l) => l.status === statusFilter);
  const counts = Object.fromEntries(STATUSES.map((s) => [s, logs.filter((l) => l.status === s).length]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 text-center backdrop-blur-xl">
            <p className="text-2xl font-extrabold text-slate-900">{counts[s] ?? 0}</p>
            <div className="mt-1"><Badge tone={statusTone(s)}>{s}</Badge></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {["All", ...STATUSES].map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={["rounded-2xl px-4 py-2 text-xs font-semibold transition", statusFilter === f ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "border border-slate-200 bg-white text-slate-700 hover:shadow-md"].join(" ")}>
            {f}
          </button>
        ))}
        <button onClick={openNew} className="ml-auto rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700">
          + Log Medication
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">⚠ {error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
          <h3 className="mb-4 text-sm font-bold text-slate-900">{editLog ? "Edit Medication Log" : "Log New Medication"}</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {!editLog && (
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
              { key: "medicationName", label: "Medication Name *", placeholder: "e.g. Amoxicillin 500mg", required: true },
              { key: "dosage", label: "Dosage", placeholder: "e.g. 500mg" },
              { key: "frequency", label: "Frequency", placeholder: "e.g. 3× daily" },
              { key: "scheduledTime", label: "Scheduled Time", placeholder: "e.g. 08:00" },
              { key: "scheduledDate", label: "Scheduled Date", placeholder: "YYYY-MM-DD" },
            ].map(({ key, label, placeholder, required }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
                <input required={required} placeholder={placeholder} value={form[key as keyof LogForm]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10" />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Notes</label>
              <textarea rows={2} placeholder="Any observations…" value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={saving}
              className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60">
              {saving ? "Saving…" : editLog ? "Update Log" : "Save Log"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditLog(null); setForm(emptyForm()); }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:shadow-md">Cancel</button>
          </div>
        </form>
      )}

      <TableShell title="Medication Updates" subtitle="Track and update patient medication administration.">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading medication logs…</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Medication</th>
                  <th className="px-4 py-3">Dosage</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Scheduled</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{patientName(l.patientId)}</td>
                    <td className="px-4 py-3 text-slate-700">{l.medicationName}</td>
                    <td className="px-4 py-3 text-slate-600">{l.dosage ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{l.frequency ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{l.scheduledTime ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{l.scheduledDate ?? "—"}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(l.status)}>{l.status}</Badge></td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-xs text-slate-500">{l.notes ?? "—"}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {l.status === "Pending" && (
                        <button onClick={() => markDone(l)} disabled={saving}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60">
                          Mark Done
                        </button>
                      )}
                      <button onClick={() => openEdit(l)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:shadow-md">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">
                    {logs.length === 0 ? "No medication logs yet. Click \"Log Medication\" to add the first entry." : "No logs match this filter."}
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

export default MedicationUpdates;
