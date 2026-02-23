

import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

// ── Hardcoded data 
const PATIENTS = [
  { id: "1",  name: "John Silva",       family: "Poorna Danushka",   admitted: "2026-02-01", condition: "Post-surgery recovery",    status: "Active",     age: 68 },
  { id: "2",  name: "Mary Perera",      family: "Mary Perera",       admitted: "2026-02-05", condition: "Cardiac monitoring",       status: "Incoming",   age: 72 },
  { id: "3",  name: "Kasun Jay",        family: "Mary Perera",       admitted: "2026-01-25", condition: "Fully recovered",          status: "Discharged", age: 55 },
];

const statusTone = (s: string) =>
  s === "Active"    ? "emerald" as const :
  s === "Incoming"  ? "amber"   as const :
  s === "Cancelled" ? "red"     as const : "slate" as const;

const PatientManagement: React.FC = () => {
  const [search, setSearch] = useState("");

  const filtered = PATIENTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.condition.toLowerCase().includes(search.toLowerCase()) ||
    p.family.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl">
        <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2-4.35-4.35" />
        </svg>
        <input
          placeholder="Search patients by name, condition or family…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-xs font-semibold text-slate-400 hover:text-slate-700">
            Clear
          </button>
        )}
      </div>

      <TableShell
        title="Assigned Patients"
        subtitle={`${filtered.length} of ${PATIENTS.length} patients shown`}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Family</th>
                <th className="px-4 py-3">Admitted</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.age}</td>
                  <td className="px-4 py-3 text-slate-600">{p.family}</td>
                  <td className="px-4 py-3 text-slate-600">{p.admitted}</td>
                  <td className="px-4 py-3 text-slate-600">{p.condition}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No patients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
};

export default PatientManagement;
