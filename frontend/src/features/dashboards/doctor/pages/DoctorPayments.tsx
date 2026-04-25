/**
 * src/features/dashboards/doctor/pages/DoctorPayments.tsx
 * ─────────────────────────────────────────────────────────
 * Displays all payments made by family members for this doctor's appointments.
 * Shows only the consultation fee (doctor's income) — NOT the care-home fee.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  getDoctorPayments,
  type DoctorPaymentRecord,
  type DoctorPaymentStatus,
} from "../../../../api/payments/doctor-payment.api";
import StatCard from "../../common/widgets/StatCard";
import Badge, { type BadgeTone } from "../../common/widgets/Badge";
import TableShell from "../../common/widgets/TableShell";
import {
  IconCurrency,
  IconActivity,
  IconCheckCircle,
  IconAlertCircle,
  IconClock,
  IconSearch,
  IconRefresh,
  IconCalendar,
  IconUser,
} from "../../common/icons";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12)}:${String(m).padStart(2, "0")} ${ampm}`;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtCurrency = (n: number) =>
  `LKR ${n.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Status helpers ───────────────────────────────────────────────────────────

type FilterTab = "all" | DoctorPaymentStatus;

const STATUS_CONFIG: Record<
  DoctorPaymentStatus,
  { label: string; tone: BadgeTone; dot: string }
> = {
  paid:             { label: "Paid",            tone: "emerald", dot: "bg-emerald-500" },
  pending_approval: { label: "Pending Approval",tone: "amber",   dot: "bg-amber-400"  },
  pending:          { label: "Pending",         tone: "slate",   dot: "bg-slate-400"  },
  rejected:         { label: "Rejected",        tone: "red",     dot: "bg-red-500"    },
};

const METHOD_CONFIG: Record<string, { label: string; tone: BadgeTone }> = {
  card:          { label: "💳 Card",          tone: "blue"   },
  bank_transfer: { label: "🏦 Bank Transfer", tone: "purple" },
};

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all",             label: "All"             },
  { key: "paid",            label: "Paid"            },
  { key: "pending_approval",label: "Pending Approval"},
  { key: "pending",         label: "Pending"         },
  { key: "rejected",        label: "Rejected"        },
];

// ─── Component ────────────────────────────────────────────────────────────────

const DoctorPayments: React.FC = () => {
  const [payments,    setPayments]    = useState<DoctorPaymentRecord[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<FilterTab>("all");
  const [search,      setSearch]      = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDoctorPayments();
      setPayments(res.payments);
      setTotalIncome(res.totalIncome);
    } catch {
      setError("Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const paid       = payments.filter((p) => p.status === "paid");
    const pending    = payments.filter((p) => p.status === "pending" || p.status === "pending_approval");
    const rejected   = payments.filter((p) => p.status === "rejected");
    return { paid: paid.length, pending: pending.length, rejected: rejected.length };
  }, [payments]);

  // ── Filtered + searched list ───────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = payments;
    if (activeTab !== "all") list = list.filter((p) => p.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.patient.fullName.toLowerCase().includes(q) ||
          p.familyMember.fullName.toLowerCase().includes(q) ||
          p.familyMember.email.toLowerCase().includes(q) ||
          (p.slot?.date ?? "").includes(q)
      );
    }
    return list;
  }, [payments, activeTab, search]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Payment Income
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Consultation fees received from family members · care-home charges excluded
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total income — highlighted green */}
        <div className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-teal-600 p-6 shadow-[0_20px_60px_rgba(5,150,105,0.25)] transition hover:-translate-y-0.5">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <p className="text-xs font-semibold text-emerald-100">Total Income</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            {loading ? "—" : fmtCurrency(totalIncome)}
          </p>
          <p className="mt-1 text-xs text-emerald-200">From paid consultations only</p>
          <div className="absolute bottom-4 right-5 grid h-11 w-11 place-items-center rounded-2xl bg-white/20">
            <IconCurrency className="h-6 w-6 text-white" />
          </div>
        </div>

        <StatCard
          title="Total Payments"
          value={loading ? "—" : payments.length}
          caption="Across all statuses"
          icon={IconActivity}
        />
        <StatCard
          title="Paid"
          value={loading ? "—" : stats.paid}
          caption="Completed transactions"
          icon={IconCheckCircle}
        />
        <StatCard
          title="Pending / Awaiting"
          value={loading ? "—" : stats.pending}
          caption="Awaiting approval or confirmation"
          icon={IconClock}
        />
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          <IconAlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Table card ── */}
      <TableShell
        title="Payment History"
        subtitle={`${visible.length} record${visible.length !== 1 ? "s" : ""} shown`}
        right={
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or family…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>
        }
      >
        {/* Filter tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition
                ${activeTab === tab.key
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
            >
              {tab.label}
              {tab.key !== "all" && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]
                  ${activeTab === tab.key ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {tab.key === "paid" && stats.paid}
                  {tab.key === "pending_approval" && payments.filter(p => p.status === "pending_approval").length}
                  {tab.key === "pending" && payments.filter(p => p.status === "pending").length}
                  {tab.key === "rejected" && stats.rejected}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-slate-100">
              <IconCurrency className="h-8 w-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">No payments found</p>
            <p className="mt-1 text-sm text-slate-400">
              {search ? "Try a different search term." : "Payments will appear here once family members complete booking."}
            </p>
          </div>
        )}

        {/* Payments table */}
        {!loading && visible.length > 0 && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Patient", "Family Member", "Appointment", "Consultation Fee", "Method", "Status", "Paid On"].map((h) => (
                  <th
                    key={h}
                    className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 first:pl-0 last:pr-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.map((p) => {
                const statusCfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
                const methodCfg = METHOD_CONFIG[p.paymentMethod] ?? { label: p.paymentMethod, tone: "slate" as BadgeTone };

                return (
                  <tr
                    key={p.id}
                    className="group transition hover:bg-slate-50/60"
                  >
                    {/* Patient */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                          <IconUser className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{p.patient.fullName}</p>
                          <p className="text-[11px] text-slate-400">Patient</p>
                        </div>
                      </div>
                    </td>

                    {/* Family member */}
                    <td className="py-4 pr-4">
                      <p className="font-medium text-slate-700">{p.familyMember.fullName}</p>
                      <p className="text-[11px] text-slate-400">{p.familyMember.email}</p>
                    </td>

                    {/* Appointment slot date */}
                    <td className="py-4 pr-4">
                      {p.slot?.date ? (
                        <div className="flex items-start gap-2">
                          <IconCalendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-700">{fmtDate(p.slot.date)}</p>
                            {p.slot.startTime && (
                              <p className="text-[11px] text-slate-400">
                                {fmt12(p.slot.startTime)} – {fmt12(p.slot.endTime)}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Consultation fee (doctor's income — care-home fee excluded) */}
                    <td className="py-4 pr-4">
                      <p className="font-bold text-emerald-700">
                        {fmtCurrency(p.consultationFee)}
                      </p>
                      {p.careHomeFee > 0 && (
                        <p className="text-[11px] text-slate-400">
                          + {fmtCurrency(p.careHomeFee)} care-home (not yours)
                        </p>
                      )}
                    </td>

                    {/* Payment method */}
                    <td className="py-4 pr-4">
                      <Badge tone={methodCfg.tone as BadgeTone}>{methodCfg.label}</Badge>
                    </td>

                    {/* Status */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${statusCfg.dot}`} />
                        <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
                      </div>
                    </td>

                    {/* Paid on (createdAt) */}
                    <td className="py-4 text-xs text-slate-500">
                      {fmtDateTime(p.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Income summary footer */}
        {!loading && visible.length > 0 && (
          <div className="mt-6 flex flex-col items-end gap-1 border-t border-slate-100 pt-5">
            {activeTab === "all" || activeTab === "paid" ? (
              <>
                <p className="text-xs text-slate-400">
                  Showing {visible.length} payment{visible.length !== 1 ? "s" : ""}
                  {activeTab !== "all" ? ` · filtered by "${TABS.find(t => t.key === activeTab)?.label}"` : ""}
                </p>
                <p className="text-xs text-slate-500">
                  Visible consultation fees:{" "}
                  <span className="font-semibold text-emerald-700">
                    {fmtCurrency(
                      visible
                        .filter((p) => p.status === "paid")
                        .reduce((s, p) => s + p.consultationFee, 0)
                    )}
                  </span>
                  {" "}(paid only)
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  Total Earned (all time):{" "}
                  <span className="text-emerald-600">{fmtCurrency(totalIncome)}</span>
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400">
                {visible.length} payment{visible.length !== 1 ? "s" : ""} in this view
              </p>
            )}
          </div>
        )}
      </TableShell>
    </div>
  );
};

export default DoctorPayments;