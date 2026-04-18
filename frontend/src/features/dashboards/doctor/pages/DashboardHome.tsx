import React, { useEffect, useState } from 'react';
import StatCard from '../../common/widgets/StatCard';
import Badge from '../../common/widgets/Badge';
import type { MenuLabel } from '../components/Sidebar';
import {
  getDoctorDashboardStats,
  type DoctorDashboardStats,
  type DashboardRecentPatient,
} from '../../../../api/users/doctor-dashboard.api';

// ── Icons ──────────────────────────────────────────────────────────────────

const HeartIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);


const CalendarIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PillIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
  </svg>
);

const BellIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const SparkleIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.2 4.2L17.4 8l-4.2 1.2L12 13.4l-1.2-4.2L6.6 8l4.2-1.8L12 2zm7 7l.8 2.8 2.8.8-2.8.8L19 16.6l-.8-2.8-2.8-.8 2.8-1.2L19 9z" />
  </svg>
);

const RefreshIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────

const statusTone = (s: DashboardRecentPatient['status']) =>
  s === 'Active'       ? 'emerald' as const :
  s === 'Completed'    ? 'slate'   as const :
  s === 'Discontinued' ? 'red'     as const : 'amber' as const;

// ── Skeleton loader ────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <tr>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 rounded-lg bg-slate-100 animate-pulse" style={{ width: `${55 + i * 7}%` }} />
      </td>
    ))}
  </tr>
);

const SkeletonCard = () => (
  <div className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl animate-pulse">
    <div className="h-3 w-24 rounded-full bg-slate-100 mb-3" />
    <div className="h-8 w-16 rounded-lg bg-slate-100 mb-2" />
    <div className="h-3 w-32 rounded-full bg-slate-100" />
  </div>
);

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  onNavigate: (label: MenuLabel) => void;
  onAddReport: () => void;
}

const DashboardHome: React.FC<Props> = ({ onNavigate, onAddReport }) => {
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getDoctorDashboardStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load dashboard data');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [refreshKey]);

  // Derived stat card array — built from live data (falls back to 0 while loading)
  const STATS = [
    {
      title: 'My Patients',
      value: stats?.myPatientsCount ?? 0,
      caption: 'Active + incoming',
      icon: HeartIcon,
    },
    {
      title: "Today's Appointments",
      value: stats?.todaysAppointmentsCount ?? 0,
      caption: 'Active slots today',
      icon: CalendarIcon,
    },
    {
      title: 'Active Prescriptions',
      value: stats?.activePrescriptionsCount ?? 0,
      caption: 'Currently prescribed',
      icon: PillIcon,
    },
    {
      title: 'Pending Slots',
      value: stats?.pendingAppointmentsCount ?? 0,
      caption: 'Awaiting your acceptance',
      icon: BellIcon,
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Hero strip ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
        <div className="absolute -right-24 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-lime-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <SparkleIcon /> Care Home — Doctor Dashboard
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">
              Welcome back, Doctor 👋
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Quick overview of your patients, appointments, and prescriptions.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={onAddReport}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              + Add New Report
            </button>
            <button
              onClick={() => onNavigate('Patient Management')}
              className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              View Patients
            </button>
          </div>
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
          <span>⚠️ {error}</span>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="ml-4 flex items-center gap-1 rounded-xl bg-red-100 px-3 py-1.5 text-xs font-semibold hover:bg-red-200"
          >
            <RefreshIcon className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
          : STATS.map((s) => (
              <StatCard
                key={s.title}
                title={s.title}
                value={s.value}
                caption={s.caption}
                icon={s.icon}
              />
            ))}
      </div>

      {/* ── Recent patients table ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Patients</h3>
                <p className="text-xs text-slate-500">Latest prescriptions issued by you.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  disabled={loading}
                  title="Refresh"
                  className="rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40"
                >
                  <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => onNavigate('Patient Management')}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:shadow-md"
                >
                  View all
                </button>
              </div>
            </div>

            <div className="overflow-x-auto p-4 md:p-6">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-600">
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3">Blood Group</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Slot Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)
                  ) : stats?.recentPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                        No recent patients found.
                      </td>
                    </tr>
                  ) : (
                    (stats?.recentPatients ?? []).map((p) => (
                      <tr key={p.id} className="transition hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <span className="font-semibold">{p.age}</span>
                          <span className="text-xs text-slate-400"> yrs</span>
                        </td>
                        <td className="px-4 py-3">
                          {p.bloodGroup
                            ? <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 ring-1 ring-red-100">{p.bloodGroup}</span>
                            : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{p.prescriptionDate}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onNavigate('Patient Management')}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Quick actions panel ───────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
            <h3 className="mb-4 text-base font-bold text-slate-900">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Channeling Slots',    nav: 'Channeling Slots' as MenuLabel },
                { label: 'Write Prescription',  nav: 'Prescription' as MenuLabel },
                { label: 'Patient Management', nav: 'Patient Management' as MenuLabel },
                { label: 'My Profile', nav: 'Doctor Profile' as MenuLabel },
              ].map(({ label, nav }) => (
                <button
                  key={label}
                  onClick={() => onNavigate(nav)}
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Today summary card */}
          {!loading && stats && (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-6 shadow-sm backdrop-blur-xl">
              <h3 className="mb-3 text-sm font-bold text-emerald-800">Today at a Glance</h3>
              <p className="text-xs text-emerald-700">
                You have{' '}
                <span className="font-bold">{stats.todaysAppointmentsCount}</span> active slot
                {stats.todaysAppointmentsCount !== 1 ? 's' : ''} today and{' '}
                <span className="font-bold">{stats.pendingAppointmentsCount}</span> pending slot
                {stats.pendingAppointmentsCount !== 1 ? 's' : ''} awaiting your acceptance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;