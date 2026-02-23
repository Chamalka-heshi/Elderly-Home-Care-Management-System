

import React from "react";
import type { Doctor } from "../../../../api/admin.api";
import TableShell from "../../common/widgets/TableShell";
import Badge      from "../../common/widgets/Badge";

const StethoscopeIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M4 3v5a4 4 0 004 4h0a4 4 0 004-4V3M8 21v-3a4 4 0 018 0v3M20 14a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);

interface Props {
  doctors: Doctor[];
  loading: boolean;
  onAddDoctor: () => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

const DoctorManagement: React.FC<Props> = ({ doctors, loading, onAddDoctor, onToggleStatus }) => (
  <TableShell
    title="Doctors"
    subtitle="Manage registered doctors and their active status."
    right={
      <button onClick={onAddDoctor}
        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
        <StethoscopeIcon /> + Add Doctor
      </button>
    }
  >
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
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Specialization</th>
              <th className="px-4 py-3">License</th>
              <th className="px-4 py-3">Exp.</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.map((d) => (
              <tr key={d.id} className="transition hover:bg-slate-50/60">
                <td className="px-4 py-3 font-semibold text-slate-800">{d.fullName}</td>
                <td className="px-4 py-3 text-slate-600">{d.email}</td>
                <td className="px-4 py-3 text-slate-600">{d.specialization}</td>
                <td className="px-4 py-3 text-slate-600">{d.licenseNumber}</td>
                <td className="px-4 py-3 text-slate-600">{d.yearsOfExperience} yrs</td>
                <td className="px-4 py-3">
                  <Badge tone={d.isActive ? "emerald" : "red"}>{d.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onToggleStatus(d.id, d.isActive)}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition",
                      d.isActive
                        ? "border border-slate-200 bg-white text-slate-800 hover:shadow-md"
                        : "bg-emerald-600 text-white hover:bg-emerald-700",
                    ].join(" ")}
                  >
                    {d.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No doctors found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </TableShell>
);

export default DoctorManagement;
