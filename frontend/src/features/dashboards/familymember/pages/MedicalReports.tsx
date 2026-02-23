/**
 * src/features/dashboards/familymember/pages/MedicalReports.tsx
 * Family member reads medical reports created by doctors — read-only view.
 */

import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

type Report = {
  id: string; patient: string; doctor: string; type: string;
  date: string; summary: string; status: "Final" | "Draft" | "Pending Review";
};

const REPORTS: Report[] = [
  { id: "1", patient: "John Silva",      doctor: "Dr. Perera",  type: "Post-Op Review",    date: "2026-02-01", summary: "Recovery progressing well, wound healing normally.",    status: "Final"          },
  { id: "2", patient: "Anula Wickrama",  doctor: "Dr. Perera",  type: "Dementia Check",     date: "2026-02-08", summary: "Cognitive assessment stable. Medication adjusted.",     status: "Final"          },
  { id: "3", patient: "Mary Perera",     doctor: "Dr. Nimal",   type: "Cardiac Assessment", date: "2026-01-30", summary: "ECG stable. Follow-up in 4 weeks.",                    status: "Pending Review" },
  { id: "4", patient: "Kasun Jay",       doctor: "Dr. Suresh",  type: "Discharge Summary",  date: "2026-01-25", summary: "Full recovery. No further care required.",              status: "Final"          },
];

const statusTone = (s: string) =>
  s === "Final" ? "emerald" as const : s === "Draft" ? "slate" as const : "amber" as const;

const MedicalReports: React.FC = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <TableShell
      title="Medical Reports"
      subtitle="View doctor-generated reports for your family members."
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Report Type</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {REPORTS.map((r) => (
              <React.Fragment key={r.id}>
                <tr className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.patient}</td>
                  <td className="px-4 py-3 text-slate-600">{r.doctor}</td>
                  <td className="px-4 py-3 text-slate-600">{r.type}</td>
                  <td className="px-4 py-3 text-slate-600">{r.date}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:shadow-md"
                    >
                      {expanded === r.id ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr>
                    <td colSpan={6} className="bg-emerald-50/40 px-6 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
                      <p className="mt-1 text-sm text-slate-700">{r.summary}</p>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </TableShell>
  );
};

export default MedicalReports;
