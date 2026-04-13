import React from "react";
import type { Admin } from "../../../../api/users/user.types";

import TableShell from "../../common/widgets/TableShell";
import Badge      from "../../common/widgets/Badge";
import { IconShield } from "../../common/icons";

interface Props {
  admins: Admin[];
  loading: boolean;
  onAddAdmin: () => void;
}

const AdminManagement: React.FC<Props> = ({ admins, loading, onAddAdmin }) => (

  <TableShell
    title="Admin Accounts"
    subtitle="Manage all system administrators and their permissions."
    right={
      <button onClick={onAddAdmin}
        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
        <IconShield className="h-4 w-4" /> + Add Admin
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
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admins.map((a) => {
              const fullName = (a as any).user?.fullName || a.fullName;
              const email = (a as any).user?.email || a.email;
              const isActive = (a as any).user?.isActive ?? a.isActive;
              const contactNumber = (a as any).user?.contactNumber || a.contactNumber;

              return (
                <tr key={a.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{email}</td>
                  <td className="px-4 py-3 text-slate-600">{contactNumber ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={isActive ? "emerald" : "red"}>{isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(a.createdAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
            {admins.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No admin accounts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </TableShell>
);

export default AdminManagement;