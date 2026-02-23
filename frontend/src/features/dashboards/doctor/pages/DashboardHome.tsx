

import React from "react";
import StatCard from "../../common/widgets/StatCard";
import Badge from "../../common/widgets/Badge";
import type { MenuLabel } from "../components/Sidebar";

// ── Icons 
const HeartIcon       = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ClipboardIcon   = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const CalendarIcon    = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const PillIcon        = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>;
const SparkleIcon     = ({ className = "h-4 w-4" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.2 4.2L17.4 8l-4.2 1.2L12 13.4l-1.2-4.2L6.6 8l4.2-1.8L12 2zm7 7l.8 2.8 2.8.8-2.8.8L19 16.6l-.8-2.8-2.8-.8 2.8-1.2L19 9z" /></svg>;

// ── Hardcoded data 
const STATS = [
  { title: "My Patients",          value: 24,  caption: "Active + incoming",       icon: HeartIcon    },
  { title: "Pending Reports",      value: 3,   caption: "Awaiting completion",     icon: ClipboardIcon},
  { title: "Today's Appointments", value: 6,   caption: "Scheduled for today",     icon: CalendarIcon },
  { title: "Active Prescriptions", value: 18,  caption: "Currently prescribed",    icon: PillIcon     },
];

const RECENT_PATIENTS = [
  { id: "1", name: "John Silva",      status: "Active",     admissionDate: "2026-02-01" },
  { id: "2", name: "Mary Perera",     status: "Incoming",   admissionDate: "2026-02-05" },
  { id: "3", name: "Nimal Gunaratne", status: "Active",     admissionDate: "2026-01-30" },
  { id: "4", name: "Anula Wickrama",  status: "Incoming",   admissionDate: "2026-02-10" },
  { id: "5", name: "Kasun Jay",       status: "Discharged", admissionDate: "2026-01-25" },
];

const statusTone = (s: string) =>
  s === "Active"    ? "emerald" as const :
  s === "Incoming"  ? "amber"   as const :
  s === "Cancelled" ? "red"     as const : "slate" as const;


// ── Component 
interface Props {
  onNavigate: (label: MenuLabel) => void;
  onAddReport: () => void;
}

const DashboardHome: React.FC<Props> = ({ onNavigate, onAddReport }) => (
  <div className="space-y-6">

    {/* Hero strip */}
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
      <div className="absolute -right-24 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-lime-400/20 blur-3xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <SparkleIcon /> Care Home — Doctor Dashboard
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">Welcome back, Doctor 👋</h2>
          <p className="mt-1 text-sm text-slate-600">Quick overview of patients, staff, and families — with a clean modern UI.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={onAddReport}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
            + Add New Report
          </button>
          <button onClick={() => onNavigate("Patient Management")}
            className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            View Reports
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

    
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

      
      <div className="xl:col-span-2">
        <div className="rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Patients</h3>
              <p className="text-xs text-slate-500">Latest admissions &amp; incoming patients.</p>
            </div>
            <button onClick={() => onNavigate("Patient Management")}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:shadow-md">
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
                      <button onClick={() => onNavigate("Patient Management")}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                        {p.status === "Active" ? "View" : "Details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-400">Tip: Replace table data with API results when backend is ready.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardHome;
