import React, { useEffect, useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";
import { getAssignedPatients } from "../../../../api/caregivers/caregiver.api";
import type { Patient } from "../../../../api/patients/patient.types";

const statusTone = (s: string) =>
  s === "Completed" ? ("emerald" as const) : s === "In Progress" ? ("blue" as const) : ("amber" as const);

const shiftColor: Record<string, string> = {
  Morning: "bg-sky-50 text-sky-700",
  Afternoon: "bg-orange-50 text-orange-700",
  Evening: "bg-purple-50 text-purple-700",
  Night: "bg-indigo-50 text-indigo-700",
};

// Static care schedule tasks per shift type
const SHIFT_TASKS: Record<string, string[]> = {
  Morning: ["Vitals check", "Morning medications", "Hygiene assistance", "Breakfast support", "Doctor rounds"],
  Afternoon: ["Vitals check", "Afternoon medications", "Physiotherapy assist", "Lunch support", "Care notes"],
  Evening: ["Vitals check", "Evening medications", "Dinner support", "Evening hygiene"],
  Night: ["Night checks", "Sleep medications", "Emergency monitoring"],
};

interface Shift {
  id: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  shiftType: "Morning" | "Afternoon" | "Evening" | "Night";
  patients: Patient[];
  status: "Upcoming" | "In Progress" | "Completed";
}

function buildSchedule(patients: Patient[]): Shift[] {
  const today = new Date();
  const shifts: Shift[] = [];
  const shiftDefs: { type: "Morning" | "Afternoon" | "Evening" | "Night"; start: string; end: string }[] = [
    { type: "Morning", start: "06:00", end: "14:00" },
    { type: "Afternoon", start: "14:00", end: "22:00" },
    { type: "Night", start: "22:00", end: "06:00" },
  ];
  for (let d = -1; d <= 5; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];
    const dayStr = date.toLocaleDateString("en-US", { weekday: "long" });
    const hours = today.getHours();
    shiftDefs.forEach((s, i) => {
      const id = `${dateStr}-${s.type}`;
      let status: "Upcoming" | "In Progress" | "Completed" = "Upcoming";
      if (d < 0) status = "Completed";
      else if (d === 0) {
        if (s.type === "Morning" && hours >= 6 && hours < 14) status = "In Progress";
        else if (s.type === "Afternoon" && hours >= 14 && hours < 22) status = "In Progress";
        else if (s.type === "Night" && (hours >= 22 || hours < 6)) status = "In Progress";
        else if (s.type === "Morning" && hours >= 14) status = "Completed";
        else if (s.type === "Afternoon" && hours >= 22) status = "Completed";
      }
      // Assign patients round-robin across shifts
      const assignedPts = patients.filter((_, idx) => idx % shiftDefs.length === i % shiftDefs.length);
      shifts.push({ id, date: dateStr, day: dayStr, startTime: s.start, endTime: s.end, shiftType: s.type, patients: assignedPts, status });
    });
  }
  return shifts;
}

const CareSchedule: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    getAssignedPatients()
      .then((res) => setPatients(res.patients as Patient[]))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const shifts = buildSchedule(patients);
  const filtered = filter === "All" ? shifts : shifts.filter((s) => s.status === filter);

  const upcoming = shifts.filter((s) => s.status === "Upcoming").length;
  const completed = shifts.filter((s) => s.status === "Completed").length;
  const totalHours = shifts
    .filter((s) => s.status !== "Completed")
    .reduce((acc, s) => {
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      return acc + diff / 60;
    }, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Upcoming Shifts", value: upcoming, color: "bg-amber-50 border-amber-200" },
          { label: "Hours Remaining", value: `${totalHours}h`, color: "bg-sky-50 border-sky-200" },
          { label: "Completed Shifts", value: completed, color: "bg-emerald-50 border-emerald-200" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl border p-5 ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", "Upcoming", "In Progress", "Completed"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={["rounded-2xl px-4 py-2 text-xs font-semibold transition", filter === f ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "border border-slate-200 bg-white text-slate-700 hover:shadow-md"].join(" ")}>
            {f}
          </button>
        ))}
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">⚠ {error}</div>}

      <TableShell title="Care Schedule" subtitle="Your upcoming and recent care shifts based on assigned patients.">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Building schedule…</div>
        ) : (
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
                    <p className="mt-1 text-xs text-slate-500">{s.startTime} – {s.endTime}</p>
                    <div className="mt-2 flex flex-wrap gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-600">Patients</p>
                        <p className="text-sm text-slate-700">
                          {s.patients.length > 0 ? s.patients.map((p) => p.fullName).join(", ") : "No patients assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600">Tasks</p>
                        <p className="text-sm text-slate-700">{SHIFT_TASKS[s.shiftType].join(" · ")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
                No shifts found for this filter.
              </div>
            )}
          </div>
        )}
      </TableShell>
    </div>
  );
};

export default CareSchedule;
