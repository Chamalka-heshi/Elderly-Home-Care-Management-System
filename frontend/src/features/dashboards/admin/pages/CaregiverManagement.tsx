import React from "react";
import type { Caregiver } from "../../../../api/users/user.types";
import { IconUserPlus } from "../../common/icons";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

// Maps availability status strings to visual badge tones
const availabilityTone = (s: string) =>
  s === "available" ? ("emerald" as const) :
  s === "busy"      ? ("amber"   as const) : ("slate" as const);

interface Props {
  caregivers: Caregiver[];
  loading: boolean;
  onAddCaregiver: () => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

// Interface for managing caregiver staff, their availability, and account status
const CaregiverManagement: React.FC<Props> = ({ caregivers, loading, onAddCaregiver, onToggleStatus }) => (
  <TableShell
    title="Caregivers"
    subtitle="Manage caregiver accounts and their availability status."
    right={
      <button 
        onClick={onAddCaregiver}
        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
      >
        <IconUserPlus className="h-4 w-4" /> + Add Caregiver
      </button>
    }
  >
    {loading ? (
      /* Loading Overlay: Animated spinner during data fetch */
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    ) : (
      /* Caregiver Grid: Tabular overview of staff details and availability */
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
            {caregivers.map((c) => {
              // Extract identity fields safely from nested or flattened structures
              const fullName = (c as any).user?.fullName || c.fullName;
              const email = (c as any).user?.email || c.email;
              const isActive = (c as any).user?.isActive ?? c.isActive;

              return (
                <tr key={c.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{email}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{c.shiftPreference}</td>
                  <td className="px-4 py-3 text-slate-600">{(c.certifications ?? []).join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.yearsOfExperience} yrs</td>
                  <td className="px-4 py-3">
                    <Badge tone={availabilityTone(c.availabilityStatus ?? "")}>{c.availabilityStatus ?? "unknown"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={isActive ? "emerald" : "red"}>{isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onToggleStatus(c.id, isActive)}
                      className={[
                        "rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition",
                        isActive
                          ? "border border-slate-200 bg-white text-slate-800 hover:shadow-md"
                          : "bg-emerald-600 text-white hover:bg-emerald-700",
                      ].join(" ")}
                    >
                      {isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
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