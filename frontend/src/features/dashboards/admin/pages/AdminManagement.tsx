import React, { useState } from "react";
import { fmtDate } from '../../../../utils/dateTime';
import type { Admin } from "../../../../api/users/user.types";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";
import Pagination from "../../common/Pagination";
import { IconShield } from "../../common/icons";

const PAGE_SIZE = 10;

interface Props {
  admins: Admin[];
  loading: boolean;
  canAddAdmin?: boolean;
  onAddAdmin: () => void;
  onDeleteAdmin?: (id: string) => Promise<void>;
}

// AdminManagement
// Main list for managing other admin accounts
const AdminManagement: React.FC<Props> = ({
  admins,
  loading,
  canAddAdmin = false,
  onAddAdmin,
  onDeleteAdmin,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(admins.length / PAGE_SIZE);
  const paginated = admins.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Asks for confirmation before deleting an admin account
  const handleDelete = async (id: string, fullName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the account for "${fullName}"? This action cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await onDeleteAdmin?.(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <TableShell
      title="Admin Accounts"
      subtitle="Manage all system administrators and their permissions."
      right={
        canAddAdmin ? (
          <button
            onClick={onAddAdmin}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            <IconShield className="h-4 w-4" /> + Add Admin
          </button>
        ) : (
          <span className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed select-none">
            <IconShield className="h-4 w-4" /> Only Super Admin can add admins
          </span>
        )
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  {onDeleteAdmin && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((a) => (
                  <tr key={a.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{a.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{a.email}</td>
                    <td className="px-4 py-3 text-slate-600">{a.contactNumber ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={a.isActive ? "emerald" : "red"}>
                        {a.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(a.createdAt)}</td>
                    {onDeleteAdmin && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(a.id, a.fullName)}
                          disabled={deletingId === a.id}
                          className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === a.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td
                      colSpan={onDeleteAdmin ? 6 : 5}
                      className="px-4 py-10 text-center text-sm text-slate-400"
                    >
                      No admin accounts found.
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
                totalItems={admins.length}
                pageSize={PAGE_SIZE}
                itemLabel="admins"
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </TableShell>
  );
};

export default AdminManagement;
