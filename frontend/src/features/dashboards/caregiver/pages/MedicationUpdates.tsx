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

type ViewStatus = "Administered" | "Pending" | "Missed";
type LogStatus  = "Administered" | "Pending" | "Missed" | "Refused";

const statusTone = (s: string) =>
  s === "Administered" ? ("emerald" as const)
  : s === "Pending"    ? ("amber"   as const)
  : s === "Missed"     ? ("red"     as const)
  :                      ("slate"   as const);

const VIEW_TABS: ViewStatus[] = ["Administered", "Pending", "Missed"];

interface LogForm {
  patientId: string;
  status: LogStatus;
}

const emptyForm = (): LogForm => ({ patientId: "", status: "Pending" });

const MedicationUpdates: React.FC = () => {
  const [patients,     setPatients]     = useState<Patient[]>([]);
  const [logs,         setLogs]         = useState<MedicationLog[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [activeTab,    setActiveTab]    = useState<ViewStatus>("Pending");
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState<LogForm>(emptyForm());

  const patientName = (id: string) =>
    patients.find((p) => p.id === id)?.fullName ?? "Unknown";

  useEffect(() => {
    Promise.all([getAssignedPatients(), getAllMedicationLogs()])
      .then(([pRes, lRes]) => {
        setPatients(pRes.patients as Patient[]);
        setLogs(lRes);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openNew = () => { setForm(emptyForm()); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setForm(emptyForm()); };

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
    if (!form.patientId) { setError("Please select a patient."); return; }
    setSaving(true);
    setError(null);
    try {
      const created = await createMedicationLog({
        patientId: form.patientId,
        medicationName: "General",   // backend requires this field; set a default
        status: form.status,
      });
      setLogs((prev) => [created, ...prev]);
      closeForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Counts for the summary cards (Administered / Pending / Missed only)
  const counts = Object.fromEntries(
    VIEW_TABS.map((s) => [s, logs.filter((l) => l.status === s).length])
  );

  // Rows shown in the active tab
  const filtered = logs.filter((l) => l.status === activeTab);

  return (
    <div className="space-y-6">

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {VIEW_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveTab(s)}
            className={[
              "rounded-2xl border p-4 text-center transition",
              activeTab === s
                ? "border-emerald-300 bg-emerald-50 shadow-md shadow-emerald-100"
                : "border-slate-200/60 bg-white/70 backdrop-blur-xl hover:shadow-md",
            ].join(" ")}
          >
            <p className="text-2xl font-extrabold text-slate-900">{counts[s] ?? 0}</p>
            <div className="mt-1">
              <Badge tone={statusTone(s)}>{s}</Badge>
            </div>
          </button>
        ))}
      </div>

      {/* ── Tab bar + Add button ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              "rounded-2xl px-4 py-2 text-xs font-semibold transition",
              activeTab === tab
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                : "border border-slate-200 bg-white text-slate-700 hover:shadow-md",
            ].join(" ")}
          >
            {tab}
          </button>
        ))}
        <button
          onClick={openNew}
          className="ml-auto rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          + Log Medication
        </button>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
          ⚠ {error}
        </div>
      )}

      {/* ── Add form ──────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
          <h3 className="mb-5 text-sm font-bold text-slate-900">Log New Medication</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Patient */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.patientId}
                  onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="">Select patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LogStatus }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="Administered">Administered</option>
                  <option value="Pending">Pending</option>
                  <option value="Missed">Missed</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Log"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:shadow-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <TableShell
        title={`${activeTab} Medications`}
        subtitle={`Showing all ${activeTab.toLowerCase()} medication entries for your assigned patients.`}
      >
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Loading medication logs…
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Medication</th>
                  <th className="px-4 py-3">Scheduled</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  {activeTab === "Pending" && (
                    <th className="px-4 py-3 text-right">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {patientName(l.patientId)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{l.medicationName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {l.scheduledTime ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{l.scheduledDate ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-xs text-slate-500">
                      {l.notes ?? "—"}
                    </td>
                    {activeTab === "Pending" && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => markDone(l)}
                          disabled={saving}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Mark Done
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={activeTab === "Pending" ? 9 : 8}
                      className="px-4 py-10 text-center text-sm text-slate-400"
                    >
                      {logs.length === 0
                        ? `No medication logs yet. Click "Log Medication" to add the first entry.`
                        : `No ${activeTab.toLowerCase()} medications found.`}
                    </td>
                  </tr>
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