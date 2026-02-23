/**
 * src/features/dashboards/familymember/pages/DashboardHome.tsx
 * Family-member dashboard home — shows their linked patients, upcoming care
 * updates, payments, and quick navigation. Family-member–appropriate content only.
 */

import React from "react";
import StatCard from "../../common/widgets/StatCard";
import Badge from "../../common/widgets/Badge";
import type { MenuLabel } from "../components/Sidebar";

// ── Icons ─────────────────────────────────────────────────────────────────────
const HeartIcon       = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ClipboardIcon   = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const CurrencyIcon    = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BellIcon        = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const SparkleIcon     = ({ className = "h-4 w-4" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.2 4.2L17.4 8l-4.2 1.2L12 13.4l-1.2-4.2L6.6 8l4.2-1.8L12 2zm7 7l.8 2.8 2.8.8-2.8.8L19 16.6l-.8-2.8-2.8-.8 2.8-1.2L19 9z" /></svg>;
const ArrowRightIcon  = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;

// ── Hardcoded data — family-member relevant ───────────────────────────────────
const STATS = [
  { title: "My Patients",       value: 2,  caption: "Linked elderly members",     icon: HeartIcon     },
  { title: "Active Prescriptions", value: 2, caption: "Currently active",         icon: ClipboardIcon },
  { title: "Pending Payments",  value: 2,  caption: "Invoices awaiting payment",  icon: CurrencyIcon  },
  { title: "New Care Updates",  value: 3,  caption: "Unread caregiver notes",     icon: BellIcon      },
];

const RECENT_PATIENTS = [
  { id: "1", name: "John Silva",     status: "Active",   admissionDate: "2026-02-01" },
  { id: "2", name: "Anula Wickrama", status: "Active",   admissionDate: "2026-02-10" },
];

const statusTone = (s: string) =>
  s === "Active"    ? "emerald" as const :
  s === "Incoming"  ? "amber"   as const :
  s === "Discharged"? "slate"   as const : "slate" as const;

const QUICK_ACTIONS: { icon: React.FC<{ className?: string }>; title: string; desc: string; page: MenuLabel }[] = [
  { icon: HeartIcon,     title: "View Elderly Profiles",    desc: "See details of your linked patients.",        page: "Elderly Profile" },
  { icon: ClipboardIcon, title: "Check Medical Reports",    desc: "Read latest doctor-generated reports.",       page: "Medical Reports" },
  { icon: ClipboardIcon, title: "View Prescriptions",       desc: "See current medications for your patients.",  page: "Prescription"    },
  { icon: CurrencyIcon,  title: "Manage Payments",          desc: "View invoices and pending payments.",         page: "Payments"        },
];

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (label: MenuLabel) => void;
  onContact: () => void;
}

const DashboardHome: React.FC<Props> = ({ onNavigate, onContact }) => (
  <div className="space-y-6">

    {/* Hero strip */}
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
      <div className="absolute -right-24 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-lime-400/20 blur-3xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <SparkleIcon /> Family Member Portal
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">Welcome back 👋</h2>
          <p className="mt-1 text-sm text-slate-600">Stay updated on your family member's care, reports, and payments.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => onNavigate("Care Updates")}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            View Care Updates
          </button>
          <button
            onClick={onContact}
            className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>

    {/* Stat cards */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STATS.map((s) => (
        <StatCard key={s.title} title={s.title} value={s.value} caption={s.caption} icon={s.icon} />
      ))}
    </div>

    {/* Recent patients + Quick actions */}
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
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Admission Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RECENT_PATIENTS.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{p.admissionDate}</td>
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
              <ArrowRightIcon />
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default DashboardHome;
