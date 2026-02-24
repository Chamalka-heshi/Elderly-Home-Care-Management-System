import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

type Note = {
  id: string; patient: string; date: string; time: string;
  category: string; note: string; mood: "Good" | "Neutral" | "Low";
};

const NOTES: Note[] = [
  { id: "1", patient: "John Silva",      date: "2026-02-23", time: "08:30", category: "Morning Routine",  note: "Patient had breakfast well. Completed morning physiotherapy exercises without assistance. Mood positive.", mood: "Good"    },
  { id: "2", patient: "Anula Wickrama",  date: "2026-02-23", time: "10:00", category: "Medication",       note: "Administered Donepezil 10mg with breakfast. Patient cooperative. No side effects observed.", mood: "Good"    },
  { id: "3", patient: "Sunil Fernando",  date: "2026-02-23", time: "11:30", category: "Vital Signs",      note: "Oxygen saturation at 94% — within acceptable range for COPD patient. Blood pressure stable at 125/80.", mood: "Neutral" },
  { id: "4", patient: "Kamala Mendis",   date: "2026-02-22", time: "14:00", category: "Physiotherapy",    note: "Assisted with 20-minute physio session. Patient showing improved grip strength in left hand.", mood: "Good"    },
  { id: "5", patient: "Anula Wickrama",  date: "2026-02-22", time: "19:30", category: "Evening Routine",  note: "Patient was restless during evening. Required extra reassurance. Sleep medication administered as prescribed.", mood: "Low"     },
  { id: "6", patient: "John Silva",      date: "2026-02-21", time: "12:00", category: "Nutrition",        note: "Patient ate full lunch. Appetite improved compared to last week. Water intake adequate.", mood: "Good"    },
  { id: "7", patient: "Mary Perera",     date: "2026-02-21", time: "09:00", category: "Admission",        note: "New patient Mary Perera admitted. Initial assessment completed. Orientation to room and routine provided.", mood: "Neutral" },
];

const moodTone = (m: string) =>
  m === "Good" ? "emerald" as const : m === "Neutral" ? "amber" as const : "red" as const;

const categoryColor: Record<string, string> = {
  "Morning Routine":  "bg-sky-50 text-sky-700",
  "Medication":       "bg-purple-50 text-purple-700",
  "Vital Signs":      "bg-orange-50 text-orange-700",
  "Physiotherapy":    "bg-lime-50 text-lime-700",
  "Evening Routine":  "bg-indigo-50 text-indigo-700",
  "Nutrition":        "bg-emerald-50 text-emerald-700",
  "Admission":        "bg-blue-50 text-blue-700",
};

const CareNotes: React.FC = () => {
  const [filter, setFilter]  = useState<string>("All");
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote]   = useState({ patient: "", category: "", note: "", mood: "Good" as Note["mood"] });

  const patients = ["All", ...Array.from(new Set(NOTES.map((n) => n.patient)))];
  const filtered  = filter === "All" ? NOTES : NOTES.filter((n) => n.patient === filter);

  return (
    <div className="space-y-4">

      {/* Add Note button */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {patients.map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={[
                "rounded-2xl px-4 py-2 text-xs font-semibold transition",
                filter === p
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                  : "border border-slate-200 bg-white text-slate-700 hover:shadow-md",
              ].join(" ")}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          + Add Note
        </button>
      </div>

      {/* Inline add form */}
      {showForm && (
        <div className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
          <h3 className="mb-4 text-sm font-bold text-slate-900">New Care Note</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              placeholder="Patient name"
              value={newNote.patient}
              onChange={(e) => setNewNote((n) => ({ ...n, patient: e.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
            <input
              placeholder="Category (e.g. Medication)"
              value={newNote.category}
              onChange={(e) => setNewNote((n) => ({ ...n, category: e.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
            <select
              value={newNote.mood}
              onChange={(e) => setNewNote((n) => ({ ...n, mood: e.target.value as Note["mood"] }))}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            >
              <option>Good</option>
              <option>Neutral</option>
              <option>Low</option>
            </select>
            <textarea
              placeholder="Note details…"
              value={newNote.note}
              onChange={(e) => setNewNote((n) => ({ ...n, note: e.target.value }))}
              rows={3}
              className="md:col-span-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 resize-none"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700">
              Save Note
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:shadow-md">
              Cancel
            </button>
          </div>
        </div>
      )}

      <TableShell
        title="Care Notes"
        subtitle={`${filtered.length} care log entries logged by you.`}
      >
        <div className="space-y-3">
          {filtered.map((n) => (
            <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{n.patient}</p>
                    <span className={["rounded-full px-2.5 py-0.5 text-xs font-semibold", categoryColor[n.category] ?? "bg-slate-100 text-slate-600"].join(" ")}>
                      {n.category}
                    </span>
                    <Badge tone={moodTone(n.mood)}>Mood: {n.mood}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {n.date} at {n.time}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{n.note}</p>
                </div>
                <button className="self-start rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:shadow-md">
                  Edit
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
              No care notes found.
            </div>
          )}
        </div>
      </TableShell>
    </div>
  );
};

export default CareNotes;
