import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

type Vital = {
  id: string; patient: string; date: string; time: string;
  bp: string; heartRate: number; temp: number; oxygen: number; weight: number;
  status: "Normal" | "Warning" | "Critical";
};

const VITALS: Vital[] = [
  { id: "1", patient: "John Silva",     date: "2026-02-23", time: "08:00", bp: "118/76", heartRate: 72, temp: 36.6, oxygen: 98, weight: 68.5, status: "Normal"   },
  { id: "2", patient: "Anula Wickrama", date: "2026-02-23", time: "08:15", bp: "145/90", heartRate: 88, temp: 37.1, oxygen: 96, weight: 54.0, status: "Warning"  },
  { id: "3", patient: "Sunil Fernando", date: "2026-02-23", time: "08:30", bp: "130/82", heartRate: 78, temp: 36.8, oxygen: 94, weight: 72.0, status: "Warning"  },
  { id: "4", patient: "Kamala Mendis",  date: "2026-02-23", time: "09:00", bp: "160/95", heartRate: 95, temp: 37.5, oxygen: 92, weight: 60.5, status: "Critical" },
  { id: "5", patient: "John Silva",     date: "2026-02-22", time: "08:00", bp: "120/78", heartRate: 74, temp: 36.5, oxygen: 98, weight: 68.3, status: "Normal"   },
  { id: "6", patient: "Anula Wickrama", date: "2026-02-22", time: "08:15", bp: "138/88", heartRate: 82, temp: 37.0, oxygen: 97, weight: 54.1, status: "Warning"  },
];

const statusTone = (s: string) =>
  s === "Normal"   ? "emerald" as const :
  s === "Warning"  ? "amber"   as const : "red" as const;

const VitalRecords: React.FC = () => {
  const [patientFilter, setPatientFilter] = useState("All");
  const patients = ["All", ...Array.from(new Set(VITALS.map((v) => v.patient)))];
  const filtered = patientFilter === "All" ? VITALS : VITALS.filter((v) => v.patient === patientFilter);

  return (
    <div className="space-y-4">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Normal",   count: VITALS.filter((v) => v.status === "Normal").length,   color: "bg-emerald-50 border-emerald-200" },
          { label: "Warning",  count: VITALS.filter((v) => v.status === "Warning").length,  color: "bg-amber-50 border-amber-200"    },
          { label: "Critical", count: VITALS.filter((v) => v.status === "Critical").length, color: "bg-red-50 border-red-200"        },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-2xl border p-5 ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{count}</p>
          </div>
        ))}
      </div>

      {/* Patient filter */}
      <div className="flex flex-wrap gap-2">
        {patients.map((p) => (
          <button
            key={p}
            onClick={() => setPatientFilter(p)}
            className={[
              "rounded-2xl px-4 py-2 text-xs font-semibold transition",
              patientFilter === p
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                : "border border-slate-200 bg-white text-slate-700 hover:shadow-md",
            ].join(" ")}
          >
            {p}
          </button>
        ))}
      </div>

      <TableShell
        title="Vital Records"
        subtitle="Latest recorded patient vital signs."
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Date & Time</th>
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
              {filtered.map((v) => (
                <tr key={v.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{v.patient}</td>
                  <td className="px-4 py-3 text-slate-600">{v.date} {v.time}</td>
                  <td className="px-4 py-3 text-slate-600">{v.bp}</td>
                  <td className="px-4 py-3 text-slate-600">{v.heartRate} bpm</td>
                  <td className="px-4 py-3 text-slate-600">{v.temp}</td>
                  <td className="px-4 py-3 text-slate-600">{v.oxygen}</td>
                  <td className="px-4 py-3 text-slate-600">{v.weight}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(v.status)}>{v.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                      Record
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">No vital records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
};

export default VitalRecords;
