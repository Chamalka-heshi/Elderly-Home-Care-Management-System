import React from "react";
// ── NEW API IMPORT ──
import type { Patient } from "../../../../api/patients/patient.types";

import { IconTrash } from "../../common/icons";
import TableShell from "../../common/widgets/TableShell";
import Badge      from "../../common/widgets/Badge";

// Updated to use the boolean isActive field from the backend
// Choose the badge color based on if the patient is active
const statusTone = (isActive: boolean) =>
  isActive ? "emerald" as const : "slate" as const;

interface Props {
  patients: Patient[];
  loading: boolean;
  onDelete: (id: string) => void;
}

// PatientManagement
// Main list for admins to see and manage all patient records
const PatientManagement: React.FC<Props> = ({ patients, loading, onDelete }) => (
  <TableShell title="Patients" subtitle="View and manage all patient records.">
    {/* Show loading spinner or the patient list */}
    {loading ? (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3">Patient Name</th>
              <th className="px-4 py-3">NIC</th>
              <th className="px-4 py-3">Contact Number</th>
              <th className="px-4 py-3">Registered On</th>
              <th className="px-4 py-3">Family Member Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((p: any) => {
              // Map the patient data to simple variables
              const id = p.id;
              const fullName = p.fullName;
              const nic = p.nic;
              const rawDate = p.createdAt;
              const familyEmail = p.familyEmail;
              const contactNumber = p.contactNumber;
              const isActive = p.isActive ?? p.Patient_isActive ?? false;

              // Prevent "Invalid Date" errors
              const displayDate = rawDate ? new Date(rawDate).toLocaleDateString() : "—";

              return (
                <tr key={id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{nic}</td> 
                  <td className="px-4 py-3 text-slate-600">{contactNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{displayDate}</td>
                  <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]">
                    {familyEmail}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(isActive)}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:shadow-md"
                    >
                      <IconTrash className="h-4 w-4" /> Delete
                    </button>
                  </td>
                </tr>
              );
            })}
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