
import React from "react";
import type { Family } from "../../../../api/admin.api";
import TableShell from "../../common/widgets/TableShell";
import Badge      from "../../common/widgets/Badge";

interface Props {
  families: Family[];
  loading: boolean;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

const FamilyManagement: React.FC<Props> = ({ families, loading, onToggleStatus }) => (
  <TableShell title="Families" subtitle="View and manage registered family accounts.">
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
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Patients</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {families.map((f) => (
              <tr key={f.id} className="transition hover:bg-slate-50/60">
                <td className="px-4 py-3 font-semibold text-slate-800">{f.fullName}</td>
                <td className="px-4 py-3 text-slate-600">{f.email}</td>
                <td className="px-4 py-3 text-slate-600">{f.contactNumber ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{f.patientsCount}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(f.joinedDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Badge tone={f.isActive ? "emerald" : "red"}>{f.isActive ? "Active" : "Blocked"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onToggleStatus(f.id, f.isActive)}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition",
                      f.isActive
                        ? "border border-slate-200 bg-white text-slate-800 hover:shadow-md"
                        : "bg-emerald-600 text-white hover:bg-emerald-700",
                    ].join(" ")}
                  >
                    {f.isActive ? "Block" : "Unblock"}
                  </button>
                </td>
              </tr>
            ))}
            {families.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No families found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </TableShell>
);

export default FamilyManagement;
