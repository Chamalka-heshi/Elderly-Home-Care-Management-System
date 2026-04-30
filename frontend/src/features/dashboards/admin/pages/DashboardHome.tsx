import React from "react";
import type { Patient } from "../../../../api/patients/patient.types";
import type { DashboardStats } from "../AdminDashboard"; 
import StatCard from "../../common/widgets/StatCard";
import Badge from "../../common/widgets/Badge";
import type { MenuLabel } from "../components/Sidebar";
import {
  IconHeart, IconStethoscope, IconUsers, IconUserPlus,
  IconShield, IconSettings, IconSparkles,
} from "../../common/icons";

// Determines the visual tone for patient status badges
const statusTone = (isActive: boolean) =>
  isActive ? ("emerald" as const) : ("slate" as const);

// Clickable action card for primary administrative tasks
const ActionCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  onClick?: () => void;
}> = ({ title, subtitle, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
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
  onAddAdmin?: () => void; 
  onAddDoctor: () => void;
}

// Main dashboard view providing a high-level operational overview
const DashboardHome: React.FC<Props> = ({ stats, patients, onNavigate, onAddAdmin, onAddDoctor }) => (
  <div className="space-y-6">
    
    {/* Hero Banner: Greeting and Global Actions */}
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
      <div className="absolute -right-24 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-lime-400/20 blur-3xl" />
      
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <IconSparkles className="h-4 w-4" /> Care Home — Admin Dashboard
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">Welcome back, Admin 👋</h2>
          <p className="mt-1 text-sm text-slate-600">Quick overview of patients, staff, and families.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {onAddAdmin && (
            <button 
              onClick={onAddAdmin} 
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              + Add New Admin
            </button>
          )}
          <button 
            onClick={() => onNavigate("Patient Management")} 
            className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            View Patients
          </button>
        </div>
      </div>
    </div>

    {/* Key Performance Indicators: Statistical Highlights */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Patients" value={stats.totalPatients} caption={`${stats.activePatients} active`} icon={IconHeart} />
      <StatCard title="Total Doctors" value={stats.totalDoctors} caption="Registered & active" icon={IconStethoscope} />
      <StatCard title="Total Caregivers" value={stats.totalCaregivers} caption="On roster this week" icon={IconUserPlus} />
      <StatCard title="Total Families" value={stats.totalFamilies} caption="Connected accounts" icon={IconUsers} />
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {/* Recent Activity: Patient Management Table */}
      <div className="xl:col-span-2">
        <div className="rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Patients</h3>
              <p className="text-xs text-slate-500">Latest admissions & incoming patients.</p>
            </div>
            <button 
              onClick={() => onNavigate("Patient Management")} 
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:shadow-md"
            >
              View all
            </button>
          </div>

          <div className="overflow-x-auto p-4 md:p-6">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold text-slate-600">
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">NIC</th>
                  <th className="px-4 py-3">Condition / History</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Admitted</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.slice(0, 5).map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{p.nic ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[150px]">{p.medicalHistory || p.chronicConditions || "—"}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(p.isActive)}>{p.isActive ? "Active" : "Inactive"}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => onNavigate("Patient Management")} 
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
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
        {/* Navigation Sidebar: Shortcuts and Financial Summary */}
        <div className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
          <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
          <p className="mt-1 text-xs text-slate-500">Fast navigation for daily admin tasks.</p>
          <div className="mt-5 space-y-3">
            <ActionCard title="Add a new doctor" subtitle="Register & verify doctor accounts." icon={IconStethoscope} onClick={onAddDoctor} />
            <ActionCard title="Manage families" subtitle="Review linked family members." icon={IconUsers} onClick={() => onNavigate("Family Management")} />
            <ActionCard title="Admin controls" subtitle="Roles, permissions & audit." icon={IconShield} onClick={() => onNavigate("Admin Management")} />
            <ActionCard title="System settings" subtitle="Configure platform preferences." icon={IconSettings} onClick={() => onNavigate("Settings")} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardHome;
