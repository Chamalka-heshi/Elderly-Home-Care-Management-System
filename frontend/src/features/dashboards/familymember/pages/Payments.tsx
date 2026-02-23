/**
 * src/features/dashboards/familymember/pages/Payments.tsx
 * Family member views and manages billing & payment history.
 */

import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

type Payment = {
  id: string; invoice: string; patient: string; description: string;
  amount: number; dueDate: string; paidDate?: string;
  status: "Paid" | "Pending" | "Overdue";
};

const PAYMENTS: Payment[] = [
  { id: "1", invoice: "INV-2026-001", patient: "John Silva",     description: "Monthly Care Package — February",    amount: 45000, dueDate: "2026-02-28", paidDate: "2026-02-15", status: "Paid"    },
  { id: "2", invoice: "INV-2026-002", patient: "Anula Wickrama", description: "Monthly Care Package — February",    amount: 45000, dueDate: "2026-02-28", paidDate: "2026-02-18", status: "Paid"    },
  { id: "3", invoice: "INV-2026-003", patient: "John Silva",     description: "Physiotherapy Sessions (8 sessions)", amount: 12000, dueDate: "2026-03-05", paidDate: undefined,   status: "Pending" },
  { id: "4", invoice: "INV-2026-004", patient: "Anula Wickrama", description: "Specialist Consultation — Dr. Perera",amount: 5000,  dueDate: "2026-02-20", paidDate: undefined,   status: "Overdue" },
  { id: "5", invoice: "INV-2026-005", patient: "Mary Perera",    description: "Monthly Care Package — February",    amount: 45000, dueDate: "2026-03-10", paidDate: undefined,   status: "Pending" },
];

const statusTone = (s: string) =>
  s === "Paid" ? "emerald" as const : s === "Pending" ? "amber" as const : "red" as const;

const total  = PAYMENTS.reduce((s, p) => s + p.amount, 0);
const paid   = PAYMENTS.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
const pending = PAYMENTS.filter((p) => p.status !== "Paid").reduce((s, p) => s + p.amount, 0);

const fmt = (n: number) => `LKR ${n.toLocaleString()}`;

const Payments: React.FC = () => {
  const [filter, setFilter] = useState<"All" | "Paid" | "Pending" | "Overdue">("All");

  const filtered = filter === "All" ? PAYMENTS : PAYMENTS.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Billed",   value: fmt(total),   tone: "bg-slate-50 border-slate-200"   },
          { label: "Amount Paid",    value: fmt(paid),    tone: "bg-emerald-50 border-emerald-200"},
          { label: "Amount Pending", value: fmt(pending), tone: "bg-amber-50 border-amber-200"   },
        ].map(({ label, value, tone }) => (
          <div key={label} className={`rounded-2xl border p-5 ${tone}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["All", "Paid", "Pending", "Overdue"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              "rounded-2xl px-4 py-2 text-xs font-semibold transition",
              filter === f
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                : "border border-slate-200 bg-white text-slate-700 hover:shadow-md",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      <TableShell
        title="Payment History"
        subtitle="View and manage billing invoices for your family members."
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Paid Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{p.invoice}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.patient}</td>
                  <td className="px-4 py-3 text-slate-600">{p.description}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{fmt(p.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.dueDate}</td>
                  <td className="px-4 py-3 text-slate-600">{p.paidDate ?? "—"}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {p.status !== "Paid" ? (
                      <button className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                        Pay Now
                      </button>
                    ) : (
                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:shadow-md">
                        Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">No payments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
};

export default Payments;
