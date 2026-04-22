import React, { useEffect, useState, useCallback } from "react";
import TableShell from "../../common/widgets/TableShell";
import { getAssignedPatients, createCareNote, updateCareNote } from "../../../../api/caregivers/caregiver.api";
import type { CareNote } from "../../../../api/caregivers/caregiver.api";
import type { Patient } from "../../../../api/patients/patient.types";

const CATEGORIES = ["general", "medical", "behavioral"] as const;
type Category = typeof CATEGORIES[number];

const categoryLabel: Record<Category, string> = {
  general: "General",
  medical: "Medical",
  behavioral: "Behavioral",
};

const categoryColor: Record<string, string> = {
  general: "bg-sky-50 text-sky-700",
  medical: "bg-purple-50 text-purple-700",
  behavioral: "bg-orange-50 text-orange-700",
};

const CareNotes: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notes, setNotes] = useState<(CareNote & { patientName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientFilter, setPatientFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState<CareNote | null>(null);

  const [form, setForm] = useState({
    residentId: "",
    note: "",
    category: "general" as Category,
  });

  // Load assigned patients + existing notes
  useEffect(() => {
    setLoading(true);
    getAssignedPatients()
      .then((res) => {
        const pts = res.patients as Patient[];
        setPatients(pts);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const patientName = useCallback(
    (id: string) => patients.find((p) => p.id === id)?.fullName ?? id,
    [patients]
  );

  const resetForm = () => {
    setForm({ residentId: "", note: "", category: "general" });
    setEditNote(null);
    setShowForm(false);
  };

  const openEdit = (n: CareNote) => {
    setEditNote(n);
    setForm({ residentId: n.residentId, note: n.note, category: n.category as Category });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.residentId || !form.note.trim()) return;
    setSaving(true);
    try {
      if (editNote) {
        const updated = await updateCareNote(editNote.id, {
          note: form.note,
          category: form.category,
        });
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? { ...updated, patientName: patientName(updated.residentId) } : n)));
      } else {
        const created = await createCareNote({
          residentId: form.residentId,
          note: form.note,
          category: form.category,
        });
        setNotes((prev) => [{ ...created, patientName: patientName(created.residentId) }, ...prev]);
      }
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredNotes = patientFilter === "All"
    ? notes
    : notes.filter((n) => n.residentId === patientFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPatientFilter("All")}
            className={["rounded-2xl px-4 py-2 text-xs font-semibold transition", patientFilter === "All" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "border border-slate-200 bg-white text-slate-700 hover:shadow-md"].join(" ")}
          >All</button>
          {patients.map((p) => (
            <button key={p.id} onClick={() => setPatientFilter(p.id)}
              className={["rounded-2xl px-4 py-2 text-xs font-semibold transition", patientFilter === p.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "border border-slate-200 bg-white text-slate-700 hover:shadow-md"].join(" ")}>
              {p.fullName}
            </button>
          ))}
        </div>
        <button
          onClick={() => { resetForm(); setShowForm((s) => !s); }}
          className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
        >+ Add Note</button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">⚠ {error}</div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
          <h3 className="mb-4 text-sm font-bold text-slate-900">{editNote ? "Edit Care Note" : "New Care Note"}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {!editNote && (
              <select
                required
                value={form.residentId}
                onChange={(e) => setForm((f) => ({ ...f, residentId: e.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="">Select patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            )}
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel[c]}</option>)}
            </select>
            <textarea
              required
              placeholder="Note details…"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={3}
              className={`rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 resize-none ${editNote ? "md:col-span-3" : "md:col-span-3"}`}
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={saving}
              className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60">
              {saving ? "Saving…" : editNote ? "Update Note" : "Save Note"}
            </button>
            <button type="button" onClick={resetForm}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:shadow-md">
              Cancel
            </button>
          </div>
        </form>
      )}

      <TableShell title="Care Notes" subtitle={loading ? "Loading…" : `${filteredNotes.length} care log entr${filteredNotes.length !== 1 ? "ies" : "y"}.`}>
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading…</div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((n) => (
              <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{n.patientName ?? patientName(n.residentId)}</p>
                      <span className={["rounded-full px-2.5 py-0.5 text-xs font-semibold", categoryColor[n.category] ?? "bg-slate-100 text-slate-600"].join(" ")}>
                        {categoryLabel[n.category as Category] ?? n.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
                    <p className="mt-2 text-sm text-slate-600">{n.note}</p>
                  </div>
                  <button onClick={() => openEdit(n)}
                    className="self-start rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:shadow-md">
                    Edit
                  </button>
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
                {notes.length === 0 ? "No care notes yet. Add the first one using the button above." : "No notes for this patient."}
              </div>
            )}
          </div>
        )}
      </TableShell>
    </div>
  );
};

export default CareNotes;
