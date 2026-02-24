import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

type Patient = {
  id: string; name: string; age: number; room: string;
  condition: string; admissionDate: string;
  status: "Active" | "Incoming" | "Discharged";
  careLevel: "Low" | "Medium" | "High";
};

const PATIENTS: Patient[] = [
  { id: "1", name: "John Silva",      age: 78, room: "A-101", condition: "Post-Hip Replacement",    admissionDate: "2026-02-01", status: "Active",    careLevel: "Medium" },
  { id: "2", name: "Mary Perera",     age: 82, room: "A-104", condition: "Hypertension & Diabetes", admissionDate: "2026-02-05", status: "Incoming",  careLevel: "High"   },
  { id: "3", name: "Anula Wickrama",  age: 74, room: "B-202", condition: "Dementia (Stage 2)",       admissionDate: "2026-01-20", status: "Active",    careLevel: "High"   },
  { id: "4", name: "Sunil Fernando",  age: 69, room: "B-205", condition: "COPD Management",         admissionDate: "2026-01-28", status: "Active",    careLevel: "Medium" },
  { id: "5", name: "Kamala Mendis",   age: 85, room: "C-301", condition: "Stroke Recovery",         admissionDate: "2026-02-10", status: "Active",    careLevel: "High"   },
  { id: "6", name: "Ranjith Jayasinghe", age: 71, room: "C-305", condition: "Cardiac Care",         admissionDate: "2025-12-15", status: "Discharged",careLevel: "Low"    },
];

const statusTone = (s: string) =>
  s === "Active"    ? "emerald" as const :
  s === "Incoming"  ? "amber"   as const : "slate" as const;

const careLevelTone = (l: string) =>
  l === "High"   ? "red"     as const :
  l === "Medium" ? "amber"   as const : "emerald" as const;

const AssignedPatients: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filtered = PATIENTS.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.condition.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active",     count: PATIENTS.filter((p) => p.status === "Active").length,    color: "bg-emerald-50 border-emerald-200" },
          { label: "Incoming",   count: PATIENTS.filter((p) => p.status === "Incoming").length,  color: "bg-amber-50 border-amber-200"    },
          { label: "Discharged", count: PATIENTS.filter((p) => p.status === "Discharged").length,color: "bg-slate-50 border-slate-200"    },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-2xl border p-5 ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{count}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="Search patients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
        />
        <div className="flex gap-2">
          {(["All", "Active", "Incoming", "Discharged"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={[
                "rounded-2xl px-4 py-2 text-xs font-semibold transition",
                statusFilter === f
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                  : "border border-slate-200 bg-white text-slate-700 hover:shadow-md",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <TableShell
        title="Assigned Patients"
        subtitle={`${filtered.length} patient${filtered.length !== 1 ? "s" : ""} assigned to you.`}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Admission</th>
                <th className="px-4 py-3">Care Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.age}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{p.room}</td>
                  <td className="px-4 py-3 text-slate-600">{p.condition}</td>
                  <td className="px-4 py-3 text-slate-600">{p.admissionDate}</td>
                  <td className="px-4 py-3"><Badge tone={careLevelTone(p.careLevel)}>{p.careLevel}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:shadow-md">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">No patients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
};

export default AssignedPatients;
