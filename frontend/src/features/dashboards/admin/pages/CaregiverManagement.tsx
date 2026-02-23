
import React from "react";
import type { Caregiver } from "../../../../api/admin.api";
import TableShell from "../../common/widgets/TableShell";
import Badge      from "../../common/widgets/Badge";

const UserPlusIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M10 7a4 4 0 11-8 0 4 4 0 018 0zm9 4v6m3-3h-6" />
  </svg>
);

const availabilityTone = (s: string) =>
  s === "available" ? "emerald" as const :
  s === "busy"      ? "amber"   as const : "slate" as const;

interface Props {
  caregivers: Caregiver[];
  loading: boolean;
  onAddCaregiver: () => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

const CaregiverManagement: React.FC<Props> = ({ caregivers, loading, onAddCaregiver, onToggleStatus }) => (
  <TableShell
    title="Caregivers"
    subtitle="Manage caregiver accounts and their availability status."
    right={
      <button onClick={onAddCaregiver}
        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
        <UserPlusIcon /> + Add Caregiver
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
              <th className="px-4 py-3">Shift</th>
              <th className="px-4 py-3">Certifications</th>
              <th className="px-4 py-3">Exp.</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {caregivers.map((c) => (
              <tr key={c.id} className="transition hover:bg-slate-50/60">
                <td className="px-4 py-3 font-semibold text-slate-800">{c.fullName}</td>
                <td className="px-4 py-3 text-slate-600">{c.email}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{c.shiftPreference}</td>
                <td className="px-4 py-3 text-slate-600">{(c.certifications ?? []).join(", ") || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{c.yearsOfExperience} yrs</td>
                <td className="px-4 py-3">
                  <Badge tone={availabilityTone(c.availabilityStatus ?? "")}>{c.availabilityStatus ?? "unknown"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={c.isActive ? "emerald" : "red"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onToggleStatus(c.id, c.isActive)}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition",
                      c.isActive
                        ? "border border-slate-200 bg-white text-slate-800 hover:shadow-md"
                        : "bg-emerald-600 text-white hover:bg-emerald-700",
                    ].join(" ")}
                  >
                    {c.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {caregivers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                  No caregivers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </TableShell>
);

export default CaregiverManagement;