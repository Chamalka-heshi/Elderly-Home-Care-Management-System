import React from "react";
import type { Doctor } from "../../../../api/users/user.types";
import { IconStethoscope } from "../../common/icons";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

interface Props {
  doctors: Doctor[];
  loading: boolean;
  onAddDoctor: () => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

// Administrative console for managing the hospital's medical practitioner database
const DoctorManagement: React.FC<Props> = ({ doctors, loading, onAddDoctor, onToggleStatus }) => (
  <TableShell
    title="Doctors"
    subtitle="Manage registered doctors and their active status."
    right={
      <button onClick={onAddDoctor}
        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
        <IconStethoscope className="h-4 w-4" /> + Add Doctor
      </button>
    }
  >
    {/* Content State: Handles loading, empty, and data population results */}
    {loading ? (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    ) : (
      /* Medical Staff Database: High-density data grid for practitioner oversight */
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
            {doctors.map((d) => {
              // Safely extract identity fields across potential flat or nested API structures
              const fullName = (d as any).user?.fullName || d.fullName;
              const email = (d as any).user?.email || d.email;
              const isActive = (d as any).user?.isActive ?? d.isActive;

              return (
                <tr key={d.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{email}</td>
                  <td className="px-4 py-3 text-slate-600">{d.specialization}</td>
                  <td className="px-4 py-3 text-slate-600">{d.licenseNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{d.yearsOfExperience} yrs</td>
                  <td className="px-4 py-3">
                    <Badge tone={isActive ? "emerald" : "red"}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onToggleStatus(d.id, isActive)}
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
            {doctors.length === 0 && (
              /* No Results Backdrop */
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                  No doctors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </TableShell>
);

export default DoctorManagement;