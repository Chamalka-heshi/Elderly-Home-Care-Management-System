/**
 * src/features/dashboards/familymember/pages/Prescription.tsx
 * Family member views prescriptions issued for their elderly patients — read-only.
 */

import React from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

type Rx = {
  id: string; patient: string; doctor: string; medication: string;
  dosage: string; frequency: string; startDate: string; endDate: string;
  status: "Active" | "Completed" | "Discontinued";
};

const PRESCRIPTIONS: Rx[] = [
  { id: "1", patient: "John Silva",     doctor: "Dr. Perera", medication: "Amoxicillin 500mg", dosage: "500mg", frequency: "3× daily", startDate: "2026-02-01", endDate: "2026-02-10", status: "Completed"    },
  { id: "2", patient: "Anula Wickrama", doctor: "Dr. Perera", medication: "Donepezil 10mg",    dosage: "10mg",  frequency: "1× daily", startDate: "2026-01-20", endDate: "2026-07-20", status: "Active"       },
  { id: "3", patient: "Mary Perera",    doctor: "Dr. Nimal",  medication: "Metoprolol 25mg",   dosage: "25mg",  frequency: "2× daily", startDate: "2026-01-30", endDate: "2026-03-30", status: "Active"       },
  { id: "4", patient: "John Silva",     doctor: "Dr. Perera", medication: "Ibuprofen 200mg",   dosage: "200mg", frequency: "PRN",      startDate: "2026-02-01", endDate: "2026-02-14", status: "Discontinued" },
];

const statusTone = (s: string) =>
  s === "Active" ? "emerald" as const : s === "Completed" ? "blue" as const : "red" as const;

const counts = {
  Active:       PRESCRIPTIONS.filter((r) => r.status === "Active").length,
  Completed:    PRESCRIPTIONS.filter((r) => r.status === "Completed").length,
  Discontinued: PRESCRIPTIONS.filter((r) => r.status === "Discontinued").length,
};

const Prescription: React.FC = () => (
  <>
    {/* Summary strip */}
    <div className="mb-6 grid grid-cols-3 gap-4">
      {(Object.entries(counts) as [string, number][]).map(([label, count]) => (
        <div key={label} className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 text-center backdrop-blur-xl">
          <p className="text-2xl font-extrabold text-slate-900">{count}</p>
          <div className="mt-1"><Badge tone={statusTone(label)}>{label}</Badge></div>
        </div>
      ))}
    </div>

    <TableShell
      title="Prescriptions"
      subtitle="View prescribed medications for your family members."
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Medication</th>
              <th className="px-4 py-3">Dosage</th>
              <th className="px-4 py-3">Frequency</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PRESCRIPTIONS.map((r) => (
              <tr key={r.id} className="transition hover:bg-slate-50/60">
                <td className="px-4 py-3 font-semibold text-slate-800">{r.patient}</td>
                <td className="px-4 py-3 text-slate-600">{r.doctor}</td>
                <td className="px-4 py-3 text-slate-600">{r.medication}</td>
                <td className="px-4 py-3 text-slate-600">{r.dosage}</td>
                <td className="px-4 py-3 text-slate-600">{r.frequency}</td>
                <td className="px-4 py-3 text-slate-600">{r.startDate}</td>
                <td className="px-4 py-3 text-slate-600">{r.endDate}</td>
                <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableShell>
  </>
);

export default Prescription;
