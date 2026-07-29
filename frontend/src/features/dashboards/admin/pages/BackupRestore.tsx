import React, { useState, useEffect, useCallback } from "react";

import {
  getBackupStats,
  listBackups,
  createBackup,
  downloadBackup,
  deleteBackup,
  verifyBackup,
  restoreBackup,
  getBackupSettings,
  updateBackupSettings,
  getActivityLogs,
} from "../../../../api/backup/backup.api";

import { fmtDate, fmtTime, fmtDateTime } from "../../../../utils/dateTime";

import type {
  BackupStats,
  BackupRecord,
  BackupSettings,
  BackupActivityLog,
  BackupFrequency,
} from "../../../../api/backup/backup.types";

import {
  IconSpinner, IconCheckCircle, IconAlertCircle, IconShield,
  IconRefresh, IconTrash, IconEye, IconSearch, IconSettings,
  IconCheck, IconAlert, IconClock, IconCalendar,
} from "../../common/icons";

// ──────────────────────────────────────────────────────────────────────────
// Local icon primitives (backup-specific)
// ──────────────────────────────────────────────────────────────────────────

const IconDatabase: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth={2} />
    <path strokeWidth={2} strokeLinecap="round" d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    <path strokeWidth={2} strokeLinecap="round" d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
  </svg>
);

const IconDownload: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);


const IconRestore: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconStorage: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth={2} />
    <path strokeWidth={2} strokeLinecap="round" d="M16 3H8" />
    <circle cx="12" cy="14" r="2" strokeWidth={2} />
  </svg>
);

const IconActivity: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};



type Toast = { id: number; kind: "success" | "error" | "info"; message: string };

// ──────────────────────────────────────────────────────────────────────────
// Status badge
// ──────────────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    success:  "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    failed:   "bg-red-100 text-red-700 ring-1 ring-red-200",
    running:  "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    pending:  "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    info:     "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? map.pending}`}>
      {status === "success" && <IconCheck className="h-3 w-3" />}
      {status === "failed"  && <span>✕</span>}
      {status === "running" && <IconSpinner className="h-3 w-3 animate-spin" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Progress bar
// ──────────────────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ label: string }> = ({ label }) => {
  const [pct, setPct] = useState(5);
  useEffect(() => {
    const id = setInterval(() => setPct((p) => (p >= 90 ? 90 : p + Math.random() * 8)), 300);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Confirmation Modal
// ──────────────────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  title: string;
  message: string;
  danger?: boolean;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  extra?: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title, message, danger = false, confirmLabel = "Confirm",
  onConfirm, onCancel, extra,
}) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white shadow-2xl p-6">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${danger ? "bg-red-50" : "bg-amber-50"}`}>
        <IconAlert className={`h-6 w-6 ${danger ? "text-red-600" : "text-amber-600"}`} />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      {extra && <div className="mt-3">{extra}</div>}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
            danger
              ? "bg-red-600 shadow-lg shadow-red-600/25 hover:bg-red-700"
              : "bg-emerald-600 shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// SVG Bar Chart
// ──────────────────────────────────────────────────────────────────────────

const BarChart: React.FC<{ data: { label: string; success: number; failed: number }[] }> = ({ data }) => {
  const maxVal = Math.max(...data.map((d) => d.success + d.failed), 1);
  const H = 120, BAR_W = 28, GAP = 16;
  const totalW = data.length * (BAR_W + GAP) - GAP + 40;
  return (
    <svg viewBox={`0 0 ${totalW} ${H + 40}`} className="w-full" style={{ maxHeight: 160 }}>
      {data.map((d, i) => {
        const x = 20 + i * (BAR_W + GAP);
        const total = d.success + d.failed;
        const successH = Math.round((d.success / maxVal) * H);
        const failedH  = Math.round((d.failed  / maxVal) * H);
        return (
          <g key={d.label}>
            {/* Failed portion (bottom) */}
            {failedH > 0 && (
              <rect
                x={x} y={H - successH - failedH}
                width={BAR_W} height={failedH}
                rx={4} fill="#fca5a5"
              />
            )}
            {/* Success portion (top) */}
            {successH > 0 && (
              <rect
                x={x} y={H - successH}
                width={BAR_W} height={successH}
                rx={successH === H ? 4 : 0}
                style={{ borderRadius: "4px 4px 0 0" }}
                fill="#10b981"
              />
            )}
            {/* Zero state */}
            {total === 0 && (
              <rect x={x} y={H - 2} width={BAR_W} height={2} rx={1} fill="#e2e8f0" />
            )}
            {/* Count label */}
            {total > 0 && (
              <text x={x + BAR_W / 2} y={H - successH - failedH - 4} textAnchor="middle" fontSize={9} fill="#64748b">
                {total}
              </text>
            )}
            {/* Month label */}
            <text x={x + BAR_W / 2} y={H + 16} textAnchor="middle" fontSize={9} fill="#94a3b8">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Donut Chart
// ──────────────────────────────────────────────────────────────────────────

const DonutChart: React.FC<{ success: number; failed: number }> = ({ success, failed }) => {
  const total = success + failed || 1;
  const r = 40, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  const successPct = success / total;
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32">
      {/* bg ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={16} />
      {/* failed arc */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#fca5a5" strokeWidth={16}
        strokeDasharray={circ}
        strokeDashoffset={circ * successPct}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* success arc */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#10b981" strokeWidth={16}
        strokeDasharray={`${circ * successPct} ${circ * (1 - successPct)}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#1e293b">
        {Math.round(successPct * 100)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="#64748b">success</text>
    </svg>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Stat Card (local compact version)
// ──────────────────────────────────────────────────────────────────────────

const BStatCard: React.FC<{
  title: string; value: string; sub?: string;
  icon: React.FC<{ className?: string }>; color: string;
}> = ({ title, value, sub, icon: Icon, color }) => (
  <div className="rounded-2xl border border-white/10 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
        {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
      </div>
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// Backup Details Modal
// ──────────────────────────────────────────────────────────────────────────

const DetailsModal: React.FC<{ record: BackupRecord; onClose: () => void }> = ({ record, onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h3 className="text-base font-bold text-slate-900">Backup Details</h3>
        <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">✕</button>
      </div>
      <div className="p-6 space-y-3">
        {[
          ["Backup Name",     record.backupName],
          ["Backup ID",       record.id],
          ["Type",            record.backupType],
          ["Status",          record.status],
          ["File Size",       formatBytes(Number(record.fileSizeBytes))],
          ["Backup Version",  record.backupVersion ?? "1.0.0"],
          ["DB Version",      record.databaseVersion ?? "—"],
          ["Created By",      record.createdByName ?? "—"],
          ["Created At",      fmtDateTime(record.completedAt || record.createdAt)],
          ["Completed At",    fmtDateTime(record.completedAt || record.createdAt)],
          ["Checksum (SHA256)", record.checksum ? record.checksum.slice(0, 32) + "…" : "—"],
          ["Notes",           record.notes ?? "—"],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-3">
            <span className="w-36 shrink-0 text-xs font-semibold text-slate-500">{k}</span>
            <span className="flex-1 truncate text-xs text-slate-800">{v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// TAB 1 — Overview
// ──────────────────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{
  stats: BackupStats;
  isCreating: boolean;
  onCreateNow: () => void;
  onRefresh: () => void;
}> = ({ stats, isCreating, onCreateNow, onRefresh }) => (
  <div className="space-y-6">
    {/* Stat cards */}
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <BStatCard
        title="Total Backups"
        value={String(stats.total)}
        sub="all time"
        icon={IconDatabase}
        color="bg-emerald-50 text-emerald-700"
      />
      <BStatCard
        title="Latest Backup"
        value={stats.latest ? fmtDate(stats.latest.createdAt) : "Never"}
        sub={stats.latest ? fmtTime(stats.latest.createdAt) : "No backups yet"}
        icon={IconClock}
        color="bg-blue-50 text-blue-700"
      />
      <BStatCard
        title="Next Scheduled"
        value={stats.nextScheduled ? fmtDate(stats.nextScheduled) : "Off"}
        sub={stats.nextScheduled ? fmtTime(stats.nextScheduled) : "Enable auto-backup"}
        icon={IconCalendar}
        color="bg-violet-50 text-violet-700"
      />
      <BStatCard
        title="Storage Used"
        value={stats.totalStorageFormatted}
        sub={`${stats.success} file${stats.success !== 1 ? "s" : ""}`}
        icon={IconStorage}
        color="bg-amber-50 text-amber-700"
      />
      <BStatCard
        title="Backup Status"
        value={stats.latest?.status ? stats.latest.status.charAt(0).toUpperCase() + stats.latest.status.slice(1) : "—"}
        sub={`${stats.success} success / ${stats.failed} failed`}
        icon={stats.latest?.status === "success" ? IconCheckCircle : IconAlertCircle}
        color={stats.latest?.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}
      />
    </div>

    {/* Quick actions */}
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onCreateNow}
        disabled={isCreating}
        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
      >
        {isCreating ? <IconSpinner className="h-4 w-4 animate-spin" /> : <IconDatabase className="h-4 w-4" />}
        {isCreating ? "Creating…" : "Create Backup Now"}
      </button>
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <IconRefresh className="h-4 w-4" /> Refresh
      </button>
    </div>

    {/* Charts */}
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Bar chart */}
      <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800">Backups Created (Last 6 Months)</h3>
          <div className="mt-1 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />Success</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-300" />Failed</span>
          </div>
        </div>
        <BarChart data={stats.monthly} />
      </div>

      {/* Donut */}
      <div className="rounded-3xl border border-white/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
        <h3 className="text-sm font-bold text-slate-800">Success vs Failed</h3>
        <div className="mt-4 flex flex-col items-center gap-3">
          <DonutChart success={stats.success} failed={stats.failed} />
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Successful: <strong>{stats.success}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="text-slate-600">Failed: <strong>{stats.failed}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// TAB 2 — Backup History
// ──────────────────────────────────────────────────────────────────────────

const HistoryTab: React.FC<{
  records: BackupRecord[];
  total: number;
  page: number;
  pages: number;
  search: string;
  loading: boolean;
  onSearch: (s: string) => void;
  onPage: (p: number) => void;
  onRefresh: () => void;
  onDownload: (r: BackupRecord) => void;
  onRestore: (r: BackupRecord) => void;
  onDelete: (r: BackupRecord) => void;
  onVerify: (r: BackupRecord) => void;
  onView: (r: BackupRecord) => void;
}> = ({ records, total, page, pages, search, loading, onSearch, onPage, onRefresh, onDownload, onRestore, onDelete, onVerify, onView }) => (
  <div className="space-y-4">
    {/* Toolbar */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-xs">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search backups…"
          className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
        />
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <IconRefresh className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
    </div>

    <p className="text-xs text-slate-500">{total} backup{total !== 1 ? "s" : ""} found</p>

    {/* Table */}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created By</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <IconSpinner className="mx-auto h-8 w-8 text-emerald-500 animate-spin" />
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                  No backups found.{" "}
                  <span className="text-emerald-600 cursor-pointer" onClick={onRefresh}>Refresh?</span>
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px]">
                    <p className="truncate text-xs font-mono">{r.backupName}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(r.completedAt || r.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{fmtTime(r.completedAt || r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.backupType === "pre-restore" ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                      : r.backupType === "manual" ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                      : "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
                    }`}>
                      {r.backupType === "pre-restore" ? "Safety Backup" : r.backupType.charAt(0).toUpperCase() + r.backupType.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{formatBytes(Number(r.fileSizeBytes))}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{r.createdByName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(r)}
                        title="View Details"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <IconEye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDownload(r)}
                        title="Download"
                        disabled={r.status !== "success"}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30"
                      >
                        <IconDownload className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onVerify(r)}
                        title="Verify Integrity"
                        disabled={r.status !== "success"}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30"
                      >
                        <IconShield className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onRestore(r)}
                        title="Restore"
                        disabled={r.status !== "success"}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600 disabled:opacity-30"
                      >
                        <IconRestore className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(r)}
                        title="Delete"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Pagination */}
    {pages > 1 && (
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={[
              "h-9 w-9 rounded-xl text-sm font-semibold transition",
              p === page
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            {p}
          </button>
        ))}
      </div>
    )}
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// TAB 3 — Settings
// ──────────────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50";

const SettingsTab: React.FC<{
  settings: BackupSettings;
  saving: boolean;
  onSave: (s: BackupSettings) => void;
}> = ({ settings, saving, onSave }) => {
  const [form, setForm] = useState<BackupSettings>(settings);
  useEffect(() => setForm(settings), [settings]);

  const setF = (k: keyof BackupSettings, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="max-w-2xl space-y-6">
      {/* Auto backup toggle */}
      <div className="rounded-3xl border border-white/10 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Automatic Backup</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Enable Automatic Backups</p>
            <p className="text-xs text-slate-500 mt-0.5">Automatically create backups on the configured schedule</p>
          </div>
          <button
            onClick={() => setF("autoBackupEnabled", !form.autoBackupEnabled)}
            className={[
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
              form.autoBackupEnabled ? "bg-emerald-600" : "bg-slate-200",
            ].join(" ")}
          >
            <span
              className={[
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                form.autoBackupEnabled ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>

        {form.autoBackupEnabled && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Backup Frequency</span>
              <select
                value={form.frequency}
                onChange={(e) => setF("frequency", e.target.value as BackupFrequency)}
                className={inputCls}
              >
                <option value="hourly">Every Hour</option>
                <option value="6hours">Every 6 Hours</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Backup Time</span>
              <input
                type="time"
                value={form.backupTime}
                onChange={(e) => setF("backupTime", e.target.value)}
                className={inputCls}
              />
            </label>
          </div>
        )}
      </div>

      {/* Retention & Options */}
      <div className="rounded-3xl border border-white/10 bg-white/80 p-6 shadow-sm backdrop-blur-xl space-y-5">
        <h3 className="text-sm font-bold text-slate-800">Backup Options</h3>

        {/* Toggle rows */}
        {([
          ["compressionEnabled", "Enable Compression", "Compress backup files using gzip to save storage space"],
          ["includeDatabase",    "Include Database",    "Include all database tables in the backup snapshot"],
          ["includeFiles",       "Include Uploaded Files", "Include files uploaded to the system (if stored locally)"],
        ] as [keyof BackupSettings, string, string][]).map(([key, label, hint]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{hint}</p>
            </div>
            <button
              onClick={() => setF(key, !form[key])}
              className={[
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                form[key] ? "bg-emerald-600" : "bg-slate-200",
              ].join(" ")}
            >
              <span
                className={[
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200",
                  form[key] ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </div>
        ))}

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Backup Storage Location</span>
          <input
            value={form.backupLocation}
            onChange={(e) => setF("backupLocation", e.target.value)}
            placeholder="./backups"
            className={inputCls}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Email Notification <span className="font-normal text-slate-400">(optional)</span></span>
          <input
            type="email"
            value={form.emailNotification ?? ""}
            onChange={(e) => setF("emailNotification", e.target.value)}
            placeholder="admin@carehome.lk"
            className={inputCls}
          />
          <span className="text-[11px] text-slate-400">Receive an email notification after each backup completes</span>
        </label>
      </div>

      <button
        onClick={() => onSave(form)}
        disabled={saving}
        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? <IconSpinner className="h-4 w-4 animate-spin" /> : <IconCheck className="h-4 w-4" />}
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// TAB 4 — Restore
// ──────────────────────────────────────────────────────────────────────────

const RestoreTab: React.FC<{
  records: BackupRecord[];
  onRestore: (r: BackupRecord) => void;
}> = ({ records, onRestore }) => {
  // Only show manual and scheduled backups — exclude auto-safety (pre-restore) backups
  // to prevent confusion and circular restore chains
  const restorableRecords = records.filter(
    (r) => r.status === "success" && r.backupType !== "pre-restore"
  );

  return (
    <div className="max-w-2xl space-y-6">
      {/* Warning banner */}
      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <IconAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">⚠ Warning — Destructive Operation</p>
          <p className="mt-1 text-xs text-amber-700">
            Restoring from a backup will <strong>overwrite the current database</strong>.
            A safety backup of the current system will be created automatically before the restore begins.
            This action cannot be undone.
          </p>
        </div>
      </div>

      {/* Select existing backup */}
      <div className="rounded-3xl border border-white/10 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Select a Backup to Restore</h3>
        <p className="text-xs text-slate-500 mb-4">Choose from your existing successful backups below</p>

        {restorableRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
            No manual or scheduled backups available to restore.
            <p className="mt-1 text-xs text-slate-400">Auto safety backups are excluded. Create a manual backup first.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {restorableRecords.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-mono font-semibold text-slate-800">{r.backupName}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.backupType === "manual" ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                      : "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
                    }`}>
                      {r.backupType.charAt(0).toUpperCase() + r.backupType.slice(1)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {fmtDateTime(r.completedAt || r.createdAt)} · {formatBytes(Number(r.fileSizeBytes))} · by {r.createdByName ?? "—"}
                  </p>
                </div>
                <button
                  onClick={() => onRestore(r)}
                  className="ml-4 flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-violet-600/25 transition hover:bg-violet-700"
                >
                  <IconRestore className="h-3.5 w-3.5" /> Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// TAB 5 — Activity Log
// ──────────────────────────────────────────────────────────────────────────

const LogTab: React.FC<{
  logs: BackupActivityLog[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  onPage: (p: number) => void;
}> = ({ logs, total, page, pages, loading, onPage }) => {
  const actionLabel: Record<string, string> = {
    BACKUP_CREATED:     "Backup Created",
    BACKUP_DOWNLOADED:  "Backup Downloaded",
    BACKUP_DELETED:     "Backup Deleted",
    BACKUP_VERIFIED:    "Integrity Verified",
    RESTORE_STARTED:    "Restore Started",
    RESTORE_COMPLETED:  "Restore Completed",
    RESTORE_FAILED:     "Restore Failed",
    SETTINGS_UPDATED:   "Settings Updated",
    SCHEDULER_TRIGGERED:"Scheduler Triggered",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{total} log entr{total !== 1 ? "ies" : "y"}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Backup</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <IconSpinner className="mx-auto h-7 w-7 text-emerald-500 animate-spin" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">No activity yet.</td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {actionLabel[l.action] ?? l.action}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{l.userName ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDateTime(l.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{l.ipAddress ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[140px]">
                      <span className="truncate block">{l.backupName ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px]">
                      <span className="truncate block">{l.details ?? "—"}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(pages, 8) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={[
                "h-8 w-8 rounded-xl text-xs font-semibold transition",
                p === page ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Root BackupRestore page component
// ──────────────────────────────────────────────────────────────────────────

type Tab = "overview" | "history" | "settings" | "restore" | "logs";

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "overview",  label: "Overview",       icon: IconDatabase  },
  { id: "history",   label: "Backup History", icon: IconClock     },
  { id: "settings",  label: "Settings",       icon: IconSettings  },
  { id: "restore",   label: "Restore System", icon: IconRestore   },
  { id: "logs",      label: "Activity Log",   icon: IconActivity  },
];

const BackupRestore: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Data state
  const [stats,        setStats]        = useState<BackupStats | null>(null);
  const [settings,     setSettings]     = useState<BackupSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [records, setRecords] = useState<BackupRecord[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [search,  setSearch]  = useState("");
  const [logs,    setLogs]    = useState<BackupActivityLog[]>([]);
  const [logTotal,  setLogTotal]  = useState(0);
  const [logPage,   setLogPage]   = useState(1);
  const [logPages,  setLogPages]  = useState(1);

  // Loading state
  const [loadingStats,   setLoadingStats]   = useState(false);
  const [statsError,     setStatsError]     = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingLogs,    setLoadingLogs]    = useState(false);
  const [isCreating,     setIsCreating]     = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((kind: Toast["kind"], message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  // Modals
  const [confirmModal, setConfirmModal] = useState<{
    title: string; message: string; danger?: boolean; confirmLabel?: string;
    extra?: React.ReactNode; onConfirm: () => void;
  } | null>(null);
  const [detailsRecord, setDetailsRecord] = useState<BackupRecord | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      setStatsError(false);
      const s = await getBackupStats();
      setStats(s);
      // Sync settings from stats response
      setSettings(s.settings);
    } catch (err) {
      setStatsError(true);
      addToast("error", err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoadingStats(false);
    }
  }, [addToast]);

  const loadSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const s = await getBackupSettings();
      setSettings(s);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoadingSettings(false);
    }
  }, [addToast]);

  const loadHistory = useCallback(async (p = 1, q = "") => {
    try {
      setLoadingHistory(true);
      const res = await listBackups(p, 20, q);
      setRecords(res.records);
      setTotal(res.total);
      setPage(res.page);
      setPages(res.pages);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  }, [addToast]);

  const loadLogs = useCallback(async (p = 1) => {
    try {
      setLoadingLogs(true);
      const res = await getActivityLogs(p, 50);
      setLogs(res.logs);
      setLogTotal(res.total);
      setLogPage(res.page);
      setLogPages(res.pages);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoadingLogs(false);
    }
  }, [addToast]);

  // Initial load
  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    if (activeTab === "history" || activeTab === "restore") loadHistory(1, "");
  }, [activeTab, loadHistory]);
  useEffect(() => {
    if (activeTab === "logs") loadLogs(1);
  }, [activeTab, loadLogs]);
  // Load settings independently when the Settings tab is opened
  useEffect(() => {
    if (activeTab === "settings" && !settings) loadSettings();
  }, [activeTab, settings, loadSettings]);

  // Search debounce — skip on initial mount (history is already loaded by tab effect)
  const isFirstSearchRender = React.useRef(true);
  useEffect(() => {
    if (isFirstSearchRender.current) { isFirstSearchRender.current = false; return; }
    const t = setTimeout(() => loadHistory(1, search), 350);
    return () => clearTimeout(t);
  }, [search, loadHistory]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleCreateNow = () => {
    setConfirmModal({
      title: "Create Backup Now",
      message: "This will create a full database snapshot. The process may take a few seconds.",
      confirmLabel: "Create Backup",
      onConfirm: async () => {
        setConfirmModal(null);
        setProgressLabel("Creating backup…");
        setIsCreating(true);
        try {
          await createBackup("Manual backup");
          addToast("success", "Backup created successfully!");
          await loadStats();
          await loadHistory(1, "");
        } catch (err) {
          addToast("error", err instanceof Error ? err.message : "Backup failed");
        } finally {
          setIsCreating(false);
          setProgressLabel(null);
        }
      },
    });
  };

  const handleDownload = (r: BackupRecord) => {
    downloadBackup(r.id, r.backupName)
      .then(() => addToast("success", `Download started: ${r.backupName}`))
      .catch((err) => addToast("error", err instanceof Error ? err.message : "Download failed"));
  };

  const handleVerify = (r: BackupRecord) => {
    setProgressLabel("Verifying integrity…");
    verifyBackup(r.id)
      .then((res) => {
        setProgressLabel(null);
        if (res.valid) {
          addToast("success", "✓ Integrity check passed — checksum verified");
        } else {
          addToast("error", `✕ Integrity check failed: ${res.reason}`);
        }
        loadLogs();
      })
      .catch((err) => {
        setProgressLabel(null);
        addToast("error", err instanceof Error ? err.message : "Verification failed");
      });
  };

  const handleDelete = (r: BackupRecord) => {
    setConfirmModal({
      title: "Delete Backup",
      message: `This will permanently delete "${r.backupName}" (${formatBytes(Number(r.fileSizeBytes))}). This action cannot be undone.`,
      danger: true,
      confirmLabel: "Delete Backup",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await deleteBackup(r.id);
          addToast("success", res.message);
          await loadStats();
          await loadHistory(page, search);
        } catch (err) {
          addToast("error", err instanceof Error ? err.message : "Delete failed");
        }
      },
    });
  };

  const handleRestore = (r: BackupRecord) => {
    setConfirmModal({
      title: "Restore System",
      danger: true,
      confirmLabel: "Yes, Restore System",
      message: `You are about to restore the system from backup: "${r.backupName}" (${fmtDateTime(r.createdAt)}).`,
      extra: (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <strong>⚠ A safety backup of the current system will be automatically created before proceeding.</strong>{" "}
          All current data will be overwritten. This cannot be undone.
        </div>
      ),
      onConfirm: async () => {
        setConfirmModal(null);
        setProgressLabel("Restoring system… (creating safety backup first)");
        try {
          const res = await restoreBackup(r.id);
          addToast("success", res.message);
          await loadStats();
          await loadHistory(1, "");
          await loadLogs(1);
        } catch (err) {
          addToast("error", err instanceof Error ? err.message : "Restore failed");
        } finally {
          setProgressLabel(null);
        }
      },
    });
  };

  const handleSaveSettings = async (s: BackupSettings) => {
    setSavingSettings(true);
    try {
      const updated = await updateBackupSettings(s);
      setSettings(updated);
      addToast("success", "Backup settings saved");
      await loadStats();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Toast stack */}
      <div className="fixed right-4 top-20 z-[300] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-xl animate-in slide-in-from-right",
              t.kind === "success" ? "bg-emerald-600"
              : t.kind === "error"   ? "bg-red-600"
              : "bg-blue-600",
            ].join(" ")}
          >
            {t.kind === "success" ? <IconCheckCircle className="h-4 w-4" /> : <IconAlertCircle className="h-4 w-4" />}
            <span className="max-w-sm">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          danger={confirmModal.danger}
          confirmLabel={confirmModal.confirmLabel}
          extra={confirmModal.extra}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Details modal */}
      {detailsRecord && (
        <DetailsModal record={detailsRecord} onClose={() => setDetailsRecord(null)} />
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
        <div className="absolute -right-24 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <IconDatabase className="h-3.5 w-3.5" /> System Management
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">Backup &amp; Restore</h2>
            <p className="mt-1 text-sm text-slate-600">Protect, manage, and recover your ECMS database with confidence.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCreateNow}
              disabled={isCreating}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
            >
              {isCreating ? <IconSpinner className="h-4 w-4 animate-spin" /> : <IconDatabase className="h-4 w-4" />}
              Create Backup Now
            </button>
          </div>
        </div>
      </div>

      {/* Progress overlay */}
      {progressLabel && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <ProgressBar label={progressLabel} />
        </div>
      )}

      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 rounded-2xl border border-slate-200 bg-white/80 p-1.5 shadow-sm backdrop-blur-xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={[
              "flex flex-1 min-w-fit items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all",
              activeTab === id
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                : "text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "overview" && (
          loadingStats ? (
            <div className="flex items-center justify-center py-24">
              <IconSpinner className="h-12 w-12 text-emerald-500 animate-spin" />
            </div>
          ) : statsError || !stats ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-slate-500">
              <IconAlertCircle className="h-12 w-12 text-red-400" />
              <p className="text-sm font-semibold">Failed to load backup statistics.</p>
              <button
                onClick={loadStats}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <IconRefresh className="h-4 w-4" /> Retry
              </button>
            </div>
          ) : (
            <OverviewTab
              stats={stats}
              isCreating={isCreating}
              onCreateNow={handleCreateNow}
              onRefresh={() => { loadStats(); loadHistory(1, ""); }}
            />
          )
        )}

        {activeTab === "history" && (
          <HistoryTab
            records={records}
            total={total}
            page={page}
            pages={pages}
            search={search}
            loading={loadingHistory}
            onSearch={(s) => setSearch(s)}
            onPage={(p) => { setPage(p); loadHistory(p, search); }}
            onRefresh={() => { loadHistory(page, search); loadStats(); }}
            onDownload={handleDownload}
            onRestore={handleRestore}
            onDelete={handleDelete}
            onVerify={handleVerify}
            onView={(r) => setDetailsRecord(r)}
          />
        )}

        {activeTab === "settings" && (
          loadingSettings || !settings ? (
            <div className="flex items-center justify-center py-24">
              <IconSpinner className="h-12 w-12 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <SettingsTab
              settings={settings}
              saving={savingSettings}
              onSave={handleSaveSettings}
            />
          )
        )}

        {activeTab === "restore" && (
          <RestoreTab records={records} onRestore={handleRestore} />
        )}

        {activeTab === "logs" && (
          <LogTab
            logs={logs}
            total={logTotal}
            page={logPage}
            pages={logPages}
            loading={loadingLogs}
            onPage={(p) => { setLogPage(p); loadLogs(p); }}
          />
        )}
      </div>
    </div>
  );
};

export default BackupRestore;
