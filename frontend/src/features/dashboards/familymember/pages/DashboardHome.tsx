/**
 * src/features/dashboards/familymember/pages/DashboardHome.tsx
 * Family-member dashboard home — fetches real data from GET /family/dashboard.
 * Shows stat cards, linked patient table, and quick navigation actions.
 */

import React, { useEffect, useState } from "react";
import StatCard from "../../common/widgets/StatCard";
import Badge from "../../common/widgets/Badge";
import type { MenuLabel } from "../components/Sidebar";
import {
  getFamilyDashboard,
  type FamilyDashboardSummary,
} from "../../../../api/family/family-dashboard.api";
import { fmtDate } from '../../../../utils/dateTime';

import iconImg from "../../../../assets/landing/icon.png";
import {
  IconHeart,
  IconClipboard,
  IconCurrency,
  IconCalendar,
  IconArrowRight,
} from "../../common/icons";

// ── Skeleton helpers ──────────────────────────────────────────────────────────

const SkeletonBox: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />
);

const StatCardSkeleton: React.FC = () => (
  <div className="rounded-3xl border border-white/10 bg-white/70 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.08)] backdrop-blur-xl">
    <SkeletonBox className="h-9 w-9 rounded-2xl" />
    <SkeletonBox className="mt-4 h-7 w-16" />
    <SkeletonBox className="mt-2 h-4 w-28" />
    <SkeletonBox className="mt-1 h-3 w-20" />
  </div>
);

// ── Quick actions config ──────────────────────────────────────────────────────

const QUICK_ACTIONS: {
  icon: React.FC<{ className?: string }>;
  title: string;
  desc: string;
  page: MenuLabel;
}[] = [
  {
    icon: IconHeart,
    title: "Care Plans",
    desc: "Browse available care packages.",
    page: "Care Plans",
  },
  {
    icon: IconHeart,
    title: "View Elderly Profiles",
    desc: "See details of your linked patients.",
    page: "Elderly Profile",
  },
  {
    icon: IconClipboard,
    title: "View Prescriptions",
    desc: "See current medications for your patients.",
    page: "Prescription",
  },
  {
    icon: IconCurrency,
    title: "Manage Payments",
    desc: "View invoices and pending payments.",
    page: "Payments",
  },
  {
    icon: IconCalendar,
    title: "Appointments",
    desc: "Book and manage doctor appointments.",
    page: "Appointments",
  },
];

// ── Status helpers ────────────────────────────────────────────────────────────

const statusTone = (active: boolean) => (active ? ("emerald" as const) : ("slate" as const));



// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onNavigate: (label: MenuLabel) => void;
}

const DashboardHome: React.FC<Props> = ({ onNavigate }) => {
  const [data, setData] = useState<FamilyDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getFamilyDashboard()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Failed to load dashboard data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const stats = data
    ? [
        {
          title: "My Patients",
          value: data.patientsCount,
          caption: "Linked elderly members",
          icon: IconHeart,
        },
        {
          title: "Active Prescriptions",
          value: data.activePrescriptionsCount,
          caption: "Currently active",
          icon: IconClipboard,
        },
        {
          title: "Pending Payments",
          value: data.pendingPaymentsCount,
          caption: "Awaiting payment",
          icon: IconCurrency,
        },
        {
          title: "Upcoming Appointments",
          value: data.upcomingAppointmentsCount,
          caption: "Scheduled visits",
          icon: IconCalendar,
        },
      ]
    : null;

  return (
    <div className="space-y-6">

      {/* Hero strip */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
        <div className="absolute -right-24 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-lime-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <img src={iconImg} alt="Care Home Logo" className="h-4 w-4 object-contain" />
              Family Member Portal
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">Welcome back 👋</h2>
            <p className="mt-1 text-sm text-slate-600">
              Stay updated on your family member's care, prescriptions, and payments.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => onNavigate("Elderly Profile")}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              View Patients
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !stats
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((s) => (
              <StatCard key={s.title} title={s.title} value={s.value} caption={s.caption} icon={s.icon} />
            ))}
      </div>

      {/* Patient table + Quick actions */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Table — takes 2 cols */}
        <div className="xl:col-span-2">
          <div className="rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">My Linked Patients</h3>
                <p className="text-xs text-slate-500">Elderly family members currently in care.</p>
              </div>
              <button
                onClick={() => onNavigate("Elderly Profile")}
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:shadow-md"
              >
                View all
              </button>
            </div>

            <div className="overflow-x-auto p-4 md:p-6">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonBox key={i} className="h-12 w-full rounded-2xl" />
                  ))}
                </div>
              ) : !data || data.patients.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-slate-500">No patients registered yet.</p>
                  <p className="mt-1 text-xs text-slate-400">Add a patient from the Elderly Profile section.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-600">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Registered</th>
                      <th className="px-4 py-3">Payment Plan</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.patients.map((p) => (
                      <tr key={p.id} className="transition hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-slate-800">{p.fullName}</td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(p.isActive)}>
                            {p.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{fmtDate(p.createdAt)}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {p.paymentPlan ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                              {p.paymentPlan}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onNavigate("Elderly Profile")}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
            <p className="text-xs text-slate-500">Fast access to key features.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {QUICK_ACTIONS.map(({ icon: Icon, title, desc, page }) => (
              <button
                key={title}
                onClick={() => onNavigate(page)}
                className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-slate-50/60"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <Icon className="h-5 w-5 text-emerald-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <IconArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
