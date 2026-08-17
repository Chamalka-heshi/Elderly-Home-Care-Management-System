import React, { useState } from "react";
import type { Caregiver } from "../../../../api/users/user.types";
import { IconUserPlus } from "../../common/icons";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";
import Pagination from "../../common/Pagination";

const PAGE_SIZE = 10;

interface Props {
  caregivers: Caregiver[];
  loading: boolean;
  onAddCaregiver: () => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

// CaregiverManagement
// List of all caregivers for admins to manage
const CaregiverManagement: React.FC<Props> = ({ caregivers, loading, onAddCaregiver, onToggleStatus }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(caregivers.length / PAGE_SIZE);
  const paginated = caregivers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
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
        /* Show loading spinner while fetching data */
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
        </div>
      ) : (
        /* Table showing all caregiver details */
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Certifications</th>
                  <th className="px-4 py-3">Exp.</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{c.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{c.email}</td>
                    <td className="px-4 py-3 text-slate-600">{(c.specializations ?? []).join(", ")}</td>
                    <td className="px-4 py-3 text-slate-600">{c.yearsOfExperience} yrs</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">
                      {(c.availableShifts ?? []).join(", ")}
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
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      No caregivers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={caregivers.length}
                pageSize={PAGE_SIZE}
                itemLabel="caregivers"
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </TableShell>
  );
};

export default CaregiverManagement;
