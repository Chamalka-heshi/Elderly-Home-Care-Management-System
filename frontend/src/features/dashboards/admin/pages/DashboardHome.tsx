

import React from "react";
import type { DashboardStats, Patient } from "../../../../api/admin.api";
import StatCard   from "../../common/widgets/StatCard";
import Badge      from "../../common/widgets/Badge";
import type { MenuLabel } from "../components/Sidebar";

// ── Icons 
const HeartIcon    = ({ className = "h-5 w-5" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const StethoscopeIcon = ({ className = "h-5 w-5" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 3v5a4 4 0 004 4h0a4 4 0 004-4V3M8 21v-3a4 4 0 018 0v3M20 14a2 2 0 100-4 2 2 0 000 4z" /></svg>;
const UsersIcon    = ({ className = "h-5 w-5" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M17 21v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1m14 0h4v-1a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M11 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const UserPlusIcon = ({ className = "h-5 w-5" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M10 7a4 4 0 11-8 0 4 4 0 018 0zm9 4v6m3-3h-6" /></svg>;
const ShieldIcon   = ({ className = "h-5 w-5" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" /></svg>;
const SettingsIcon = ({ className = "h-5 w-5" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="3" strokeWidth={2} /><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a7.97 7.97 0 00.1-1 7.97 7.97 0 00-.1-1l2.02-1.57-2-3.46-2.45 1a7.8 7.8 0 00-1.73-1L14.9 2h-4l-.32 2.97a7.8 7.8 0 00-1.73 1l-2.45-1-2 3.46L6.6 12a7.97 7.97 0 00-.1 1c0 .34.03.67.1 1L4.58 16.57l2 3.46 2.45-1c.53.42 1.11.77 1.73 1L10.9 22h4l.32-2.97c.62-.23 1.2-.58 1.73-1l2.45 1 2-3.46L19.4 15z" /></svg>;
const SparkleIcon  = ({ className = "h-4 w-4" }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.2 4.2L17.4 8l-4.2 1.2L12 13.4l-1.2-4.2L6.6 8l4.2-1.8L12 2zm7 7l.8 2.8 2.8.8-2.8.8L19 16.6l-.8-2.8-2.8-.8 2.8-1.2L19 9z" /></svg>;

const statusTone = (s: string) =>
  s === "Confirmed" || s === "Active" ? "emerald" as const :
  s === "Incoming"                    ? "amber"   as const :
  s === "Cancelled"                   ? "red"     as const : "slate" as const;

const ActionCard: React.FC<{
  title: string; subtitle: string;
  icon: React.FC<{ className?: string }>; onClick?: () => void;
}> = ({ title, subtitle, icon: Icon, onClick }) => (
  <button onClick={onClick}
    className="group w-full rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:bg-emerald-100">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="mt-1 text-slate-300 transition group-hover:text-emerald-400">→</div>
    </div>
  </button>
);

interface Props {
  stats: DashboardStats;
  patients: Patient[];
  onNavigate: (label: MenuLabel) => void;
  onAddAdmin: () => void;
  onAddDoctor: () => void;
}

const DashboardHome: React.FC<Props> = ({ stats, patients, onNavigate, onAddAdmin, onAddDoctor }) => (
  <div className="space-y-6">
    {/* Hero strip */}
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
      <div className="absolute -right-24 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-lime-400/20 blur-3xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <SparkleIcon /> Care Home — Admin Dashboard
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">Welcome back, Admin 👋</h2>
          <p className="mt-1 text-sm text-slate-600">Quick overview of patients, staff, and families.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={onAddAdmin} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
            + Add New Admin
          </button>
          <button onClick={() => onNavigate("Patient Management")} className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            View Patients
          </button>
        </div>
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Patients"   value={stats.totalPatients}   caption={`${stats.activePatients} active`} icon={HeartIcon} />
      <StatCard title="Total Doctors"    value={stats.totalDoctors}    caption="Registered & active"              icon={StethoscopeIcon} />
      <StatCard title="Total Caregivers" value={stats.totalCaregivers} caption="On roster this week"              icon={UserPlusIcon} />
      <StatCard title="Total Families"   value={stats.totalFamilies}   caption="Connected accounts"               icon={UsersIcon} />
    </div>

    {/* Recent patients + quick actions */}
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <div className="rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Patients</h3>
              <p className="text-xs text-slate-500">Latest admissions & incoming patients.</p>
            </div>
            <button onClick={() => onNavigate("Patient Management")} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:shadow-md">
              View all
            </button>
          </div>
          <div className="overflow-x-auto p-4 md:p-6">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold text-slate-600">
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Family</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Admitted</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.slice(0, 5).map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.familyName ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.medicalCondition ?? "—"}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{new Date(p.admissionDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => onNavigate("Patient Management")} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No patients found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
          <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
          <p className="mt-1 text-xs text-slate-500">Fast navigation for daily admin tasks.</p>
          <div className="mt-5 space-y-3">
            <ActionCard title="Add a new doctor"  subtitle="Register & verify doctor accounts." icon={StethoscopeIcon} onClick={onAddDoctor} />
            <ActionCard title="Manage families"   subtitle="Review linked family members."       icon={UsersIcon}       onClick={() => onNavigate("Family Management")} />
            <ActionCard title="Admin controls"    subtitle="Roles, permissions & audit."         icon={ShieldIcon}      onClick={() => onNavigate("Admin Management")} />
            <ActionCard title="System settings"  subtitle="Configure platform preferences."      icon={SettingsIcon}    onClick={() => onNavigate("Settings")} />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-emerald-600 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.10)]">
          <p className="text-xs font-semibold text-emerald-100">Monthly Snapshot</p>
          <p className="mt-2 text-3xl font-extrabold text-white">Rs.{stats.earnings.toLocaleString()}</p>
          <p className="text-xs text-emerald-200">Estimated monthly earnings</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/10 p-3 text-center">
              <p className="text-xl font-bold text-white">{stats.newPatientsThisMonth}</p>
              <p className="text-[10px] text-emerald-200">New patients</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-center">
              <p className="text-xl font-bold text-white">{stats.upcomingAppointments}</p>
              <p className="text-[10px] text-emerald-200">Upcoming appts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardHome;
