/**
 * src/features/dashboards/familymember/pages/CareUpdates.tsx
 * Family member views caregiver notes & daily care logs for their elderly patients.
 */

import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

type Update = {
  id: string; patient: string; caregiver: string;
  date: string; time: string; category: string;
  note: string; mood: "Good" | "Neutral" | "Low";
};

const UPDATES: Update[] = [
  { id: "1", patient: "John Silva",     caregiver: "Amali Silva",  date: "2026-02-23", time: "08:30", category: "Morning Routine",  note: "Patient had breakfast well. Completed morning physiotherapy exercises without assistance.",          mood: "Good"    },
  { id: "2", patient: "Anula Wickrama", caregiver: "Amali Silva",  date: "2026-02-23", time: "10:00", category: "Medication",       note: "Administered Donepezil 10mg with breakfast. Patient cooperative. No side effects observed.",           mood: "Good"    },
  { id: "3", patient: "John Silva",     caregiver: "Amali Silva",  date: "2026-02-22", time: "14:00", category: "Activity",         note: "Patient engaged in light walking in the garden for 20 minutes. Appeared tired afterward.",             mood: "Neutral" },
  { id: "4", patient: "Anula Wickrama", caregiver: "Niro Perera",  date: "2026-02-22", time: "19:30", category: "Evening Routine",  note: "Patient was restless in the evening. Required extra reassurance. Sleep medication administered.",       mood: "Low"     },
  { id: "5", patient: "Mary Perera",    caregiver: "Kasun Jay",    date: "2026-02-21", time: "09:00", category: "Vital Signs",      note: "Blood pressure 135/85 — slightly elevated. Doctor notified. Patient resting comfortably.",            mood: "Neutral" },
  { id: "6", patient: "John Silva",     caregiver: "Amali Silva",  date: "2026-02-21", time: "12:00", category: "Nutrition",        note: "Patient ate full lunch. Appetite improved compared to last week. Water intake adequate.",              mood: "Good"    },
];

const moodTone = (m: string) =>
  m === "Good" ? "emerald" as const : m === "Neutral" ? "amber" as const : "red" as const;

const categoryColor: Record<string, string> = {
  "Morning Routine": "bg-sky-50 text-sky-700",
  "Medication":      "bg-purple-50 text-purple-700",
  "Activity":        "bg-lime-50 text-lime-700",
  "Evening Routine": "bg-indigo-50 text-indigo-700",
  "Vital Signs":     "bg-orange-50 text-orange-700",
  "Nutrition":       "bg-emerald-50 text-emerald-700",
};

const CareUpdates: React.FC = () => {
  const [filter, setFilter] = useState<string>("All");
  const patients = ["All", ...Array.from(new Set(UPDATES.map((u) => u.patient)))];
  const filtered = filter === "All" ? UPDATES : UPDATES.filter((u) => u.patient === filter);

  return (
    <div className="space-y-4">
      {/* Patient filter tabs */}
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

      <TableShell
        title="Care Updates"
        subtitle={`${filtered.length} care log entries — from your assigned caregivers.`}
      >
        <div className="space-y-3">
          {filtered.map((u) => (
            <div key={u.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{u.patient}</p>
                    <span className={["rounded-full px-2.5 py-0.5 text-xs font-semibold", categoryColor[u.category] ?? "bg-slate-100 text-slate-600"].join(" ")}>
                      {u.category}
                    </span>
                    <Badge tone={moodTone(u.mood)}>Mood: {u.mood}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Caregiver: <span className="font-semibold text-slate-700">{u.caregiver}</span>
                    <span className="ml-3">{u.date} at {u.time}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{u.note}</p>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
              No care updates found.
            </div>
          )}
        </div>
      </TableShell>
    </div>
  );
};

export default CareUpdates;
