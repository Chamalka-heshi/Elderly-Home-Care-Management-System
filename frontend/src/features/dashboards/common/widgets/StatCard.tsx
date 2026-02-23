/**
 * src/features/dashboards/common/widgets/StatCard.tsx
 * ─────────────────────────────────────────────────────
 * KPI summary card shared across admin and doctor dashboard home pages.
 */

import React from "react";

interface Props {
  title:   string;
  value:   string | number;
  caption: string;
  icon:    React.FC<{ className?: string }>;
}

const StatCard: React.FC<Props> = ({ title, value, caption, icon: Icon }) => (
  <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_30px_80px_rgba(2,6,23,0.12)]">
    <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl transition group-hover:bg-emerald-500/20" />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{caption}</p>
      </div>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 transition group-hover:scale-105">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

export default StatCard;
