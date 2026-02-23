

import React from "react";
import type { Patient } from "../../../../api/admin.api";
import TableShell from "../../common/widgets/TableShell";
import Badge      from "../../common/widgets/Badge";

const TrashIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const statusTone = (s: string) =>
  s === "Confirmed" ? "emerald" as const :
  s === "Incoming"  ? "amber"   as const :
  s === "Cancelled" ? "red"     as const : "slate" as const;

interface Props {
  patients: Patient[];
  loading: boolean;
  onDelete: (id: string) => void;
}

const PatientManagement: React.FC<Props> = ({ patients, loading, onDelete }) => (
  <TableShell title="Patients" subtitle="View and manage all patient records.">
    {loading ? (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Family</th>
              <th className="px-4 py-3">Admitted</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((p) => (
              <tr key={p.id} className="transition hover:bg-slate-50/60">
                <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.familyName ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(p.admissionDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-600">{p.medicalCondition ?? "—"}</td>
                <td className="px-4 py-3"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDelete(p.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:shadow-md"
                  >
                    <TrashIcon /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No patients found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </TableShell>
);

export default PatientManagement;
