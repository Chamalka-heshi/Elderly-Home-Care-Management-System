import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

type MedUpdate = {
  id: string; patient: string; medication: string; dosage: string;
  frequency: string; scheduledTime: string; date: string;
  status: "Administered" | "Pending" | "Missed" | "Refused";
  notes?: string;
};

const MED_UPDATES: MedUpdate[] = [
  { id: "1", patient: "John Silva",      medication: "Amoxicillin 500mg",  dosage: "500mg", frequency: "3× daily", scheduledTime: "08:00", date: "2026-02-23", status: "Administered", notes: "Taken with breakfast."          },
  { id: "2", patient: "Anula Wickrama",  medication: "Donepezil 10mg",     dosage: "10mg",  frequency: "1× daily", scheduledTime: "08:00", date: "2026-02-23", status: "Administered", notes: "No side effects noted."         },
  { id: "3", patient: "Sunil Fernando",  medication: "Salbutamol Inhaler", dosage: "2 puffs",frequency: "PRN",     scheduledTime: "09:00", date: "2026-02-23", status: "Administered", notes: "Used after slight breathlessness."},
  { id: "4", patient: "Kamala Mendis",   medication: "Warfarin 5mg",       dosage: "5mg",   frequency: "1× daily", scheduledTime: "10:00", date: "2026-02-23", status: "Pending"                                                 },
  { id: "5", patient: "John Silva",      medication: "Amoxicillin 500mg",  dosage: "500mg", frequency: "3× daily", scheduledTime: "13:00", date: "2026-02-23", status: "Pending"                                                 },
  { id: "6", patient: "Anula Wickrama",  medication: "Haloperidol 0.5mg",  dosage: "0.5mg", frequency: "1× nightly",scheduledTime: "20:00",date: "2026-02-22", status: "Refused",    notes: "Patient refused. Doctor notified." },
  { id: "7", patient: "Sunil Fernando",  medication: "Prednisolone 10mg",  dosage: "10mg",  frequency: "1× daily", scheduledTime: "08:00", date: "2026-02-22", status: "Missed",     notes: "Patient was sleeping, not woken." },
];

const statusTone = (s: string) =>
  s === "Administered" ? "emerald" as const :
  s === "Pending"      ? "amber"   as const :
  s === "Missed"       ? "red"     as const : "slate" as const;

const counts = {
  Administered: MED_UPDATES.filter((m) => m.status === "Administered").length,
  Pending:      MED_UPDATES.filter((m) => m.status === "Pending").length,
  Missed:       MED_UPDATES.filter((m) => m.status === "Missed").length,
  Refused:      MED_UPDATES.filter((m) => m.status === "Refused").length,
};

const MedicationUpdates: React.FC = () => {
  const [filter, setFilter] = useState<string>("All");
  const filtered = filter === "All" ? MED_UPDATES : MED_UPDATES.filter((m) => m.status === filter);

  return (
    <div className="space-y-6">

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(Object.entries(counts) as [string, number][]).map(([label, count]) => (
          <div key={label} className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 text-center backdrop-blur-xl">
            <p className="text-2xl font-extrabold text-slate-900">{count}</p>
            <div className="mt-1"><Badge tone={statusTone(label)}>{label}</Badge></div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["All", "Administered", "Pending", "Missed", "Refused"] as const).map((f) => (
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
        title="Medication Updates"
        subtitle="Track and update patient medication administration."
      >
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
              {filtered.map((m) => (
                <tr key={m.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{m.patient}</td>
                  <td className="px-4 py-3 text-slate-700">{m.medication}</td>
                  <td className="px-4 py-3 text-slate-600">{m.dosage}</td>
                  <td className="px-4 py-3 text-slate-600">{m.frequency}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{m.scheduledTime}</td>
                  <td className="px-4 py-3 text-slate-600">{m.date}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(m.status)}>{m.status}</Badge></td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-xs text-slate-500">{m.notes ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {m.status === "Pending" ? (
                      <button className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                        Mark Done
                      </button>
                    ) : (
                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:shadow-md">
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">No medication updates found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
};

export default MedicationUpdates;
