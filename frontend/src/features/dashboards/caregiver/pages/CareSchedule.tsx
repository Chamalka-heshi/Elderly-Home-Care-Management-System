import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

type Shift = {
  id: string; date: string; day: string; startTime: string; endTime: string;
  patients: string[]; tasks: string[];
  status: "Upcoming" | "In Progress" | "Completed";
  shiftType: "Morning" | "Afternoon" | "Evening" | "Night";
};

const SHIFTS: Shift[] = [
  {
    id: "1", date: "2026-02-24", day: "Monday", startTime: "06:00", endTime: "14:00",
    patients: ["John Silva", "Anula Wickrama"],
    tasks: ["Vitals", "Medications", "Morning hygiene", "Breakfast assist"],
    status: "In Progress", shiftType: "Morning",
  },
  {
    id: "2", date: "2026-02-24", day: "Monday", startTime: "14:00", endTime: "22:00",
    patients: ["Sunil Fernando", "Kamala Mendis"],
    tasks: ["Vitals", "Medications", "Physiotherapy assist", "Dinner assist"],
    status: "Upcoming", shiftType: "Afternoon",
  },
  {
    id: "3", date: "2026-02-25", day: "Tuesday", startTime: "06:00", endTime: "14:00",
    patients: ["John Silva", "Anula Wickrama", "Mary Perera"],
    tasks: ["Vitals", "Medications", "Morning hygiene", "Breakfast assist", "Doctor rounds"],
    status: "Upcoming", shiftType: "Morning",
  },
  {
    id: "4", date: "2026-02-23", day: "Sunday", startTime: "06:00", endTime: "14:00",
    patients: ["John Silva", "Anula Wickrama"],
    tasks: ["Vitals", "Medications", "Morning hygiene", "Breakfast assist"],
    status: "Completed", shiftType: "Morning",
  },
  {
    id: "5", date: "2026-02-26", day: "Wednesday", startTime: "22:00", endTime: "06:00",
    patients: ["Kamala Mendis", "Sunil Fernando"],
    tasks: ["Night checks", "Sleep medications", "Emergency monitoring"],
    status: "Upcoming", shiftType: "Night",
  },
];

const statusTone = (s: string) =>
  s === "Completed"   ? "emerald" as const :
  s === "In Progress" ? "blue"    as const : "amber" as const;

const shiftColor: Record<string, string> = {
  Morning:   "bg-sky-50 text-sky-700",
  Afternoon: "bg-orange-50 text-orange-700",
  Evening:   "bg-purple-50 text-purple-700",
  Night:     "bg-indigo-50 text-indigo-700",
};

const CareSchedule: React.FC = () => {
  const [filter, setFilter] = useState<string>("All");
  const filtered = filter === "All" ? SHIFTS : SHIFTS.filter((s) => s.status === filter);

  const totalHours = SHIFTS.filter((s) => s.status !== "Completed")
    .reduce((acc, s) => {
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      return acc + diff / 60;
    }, 0);

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Upcoming Shifts",    value: SHIFTS.filter((s) => s.status === "Upcoming").length,    color: "bg-amber-50 border-amber-200"    },
          { label: "Hours This Week",    value: `${totalHours}h`,                                        color: "bg-sky-50 border-sky-200"        },
          { label: "Completed Shifts",   value: SHIFTS.filter((s) => s.status === "Completed").length,   color: "bg-emerald-50 border-emerald-200"},
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl border p-5 ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(["All", "Upcoming", "In Progress", "Completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              "rounded-2xl px-4 py-2 text-xs font-semibold transition",
              filter === f
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                : "border border-slate-200 bg-white text-slate-700 hover:shadow-md",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      <TableShell
        title="Care Schedule"
        subtitle="Your upcoming and recent care shifts."
      >
        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{s.day}, {s.date}</p>
                    <span className={["rounded-full px-2.5 py-0.5 text-xs font-semibold", shiftColor[s.shiftType]].join(" ")}>
                      {s.shiftType} Shift
                    </span>
                    <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {s.startTime} – {s.endTime}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-600">Patients</p>
                      <p className="text-sm text-slate-700">{s.patients.join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600">Tasks</p>
                      <p className="text-sm text-slate-700">{s.tasks.join(" · ")}</p>
                    </div>
                  </div>
                </div>
                <button className="self-start rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:shadow-md">
                  View Details
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
              No shifts found.
            </div>
          )}
        </div>
      </TableShell>
    </div>
  );
};

export default CareSchedule;
