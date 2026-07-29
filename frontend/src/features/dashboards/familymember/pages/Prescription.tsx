/**
 * src/features/dashboards/familymember/pages/Prescription.tsx
 *
 * Family member view — read-only list of prescriptions.
 * Clicking "View" opens a print-style prescription modal directly.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Badge from '../../common/widgets/Badge';
import {
  getFamilyPrescriptions,
  type FamilyPrescription,
} from '../../../../api/prescriptions/family-prescription.api';

// ── Helpers ───────────────────────────────────────────────────────────────────

import { fmtDateShort } from '../../../../utils/dateTime';

const fmtDate = (d?: string | null): string => {
  if (!d) return '—';
  return fmtDateShort(d);
};

type StatusTone = 'emerald' | 'blue' | 'red';

const statusTone = (s: string): StatusTone =>
  s === 'active' ? 'emerald' : s === 'completed' ? 'blue' : 'red';

const statusLabel = (s: string): string =>
  s === 'active' ? 'Active' : s === 'completed' ? 'Completed' : 'Discontinued';

import {
  IconPrint,
  IconX,
  IconEye,
  IconPill,
  IconFileText,
  IconRefresh,
  IconSearch
} from "../../common/icons";

// ── Print-style View Modal ────────────────────────────────────────────────────
// Opens when the user clicks "View" — rendered like a prescription document.
// No separate print button; the whole modal IS the print-formatted view.

const ViewModal: React.FC<{ rx: FamilyPrescription; onClose: () => void }> = ({ rx, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!ref.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Rx – ${rx.patientName}</title>
          <style>
            *{box-sizing:border-box}
            body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1e293b;max-width:680px;margin:auto}
            h1{font-size:1.5rem;font-weight:700;margin:0 0 4px}
            .sub{color:#64748b;font-size:.85rem;margin:6px 0 28px}
            .label{font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;display:block}
            .section{margin:24px 0}
            .badge{display:inline-block;padding:3px 12px;border-radius:999px;font-size:.75rem;font-weight:700}
            .med{border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:10px}
            .med-name{font-weight:700;font-size:.95rem;margin:0 0 4px}
            .med-sub{font-size:.8rem;color:#64748b;margin:0}
            .instruction{font-size:.78rem;color:#047857;background:#d1fae5;border-radius:6px;padding:2px 8px;display:inline-block;margin-top:5px}
            .footer{margin-top:48px;border-top:1px solid #e2e8f0;padding-top:16px;font-size:.72rem;color:#94a3b8}
            hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}
            @media print{body{padding:16px}}
          </style>
        </head>
        <body>${ref.current.innerHTML}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const doctorDisplay = rx.doctor?.user?.fullName
    ? `Dr. ${rx.doctor.user.fullName}${rx.doctor.specialization ? ` — ${rx.doctor.specialization}` : ''}`
    : null;

  const statusBg = rx.status === 'active' ? '#d1fae5' : rx.status === 'completed' ? '#dbeafe' : '#fee2e2';
  const statusColor = rx.status === 'active' ? '#065f46' : rx.status === 'completed' ? '#1e40af' : '#991b1b';

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-10">
      {/* backdrop */}
      <button className="fixed inset-0" onClick={onClose} type="button" aria-label="Close" />

      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        {/* status bar */}
        <div className={`h-1.5 rounded-t-3xl ${
          rx.status === 'active'
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            : rx.status === 'completed'
              ? 'bg-gradient-to-r from-blue-400 to-blue-500'
              : 'bg-gradient-to-r from-red-300 to-red-400'
        }`} />

        {/* toolbar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50">
              <IconFileText className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Medical Prescription</p>
              <p className="text-xs text-slate-400">Prescription ID: {rx.id.slice(0, 8)}…</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button" onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
            >
              <IconPrint className="h-3.5 w-3.5" /> Print / Save PDF
            </button>
            <button type="button" onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition">
              <IconX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Prescription document body ── */}
        <div ref={ref} className="p-8 space-y-6">

          {/* Title + status */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[1.4rem] font-bold text-slate-900 m-0">Medical Prescription</h1>
              <p className="text-[#64748b] text-[.82rem] mt-1">
                Issued: {fmtDate(rx.issuedDate)}
                {rx.validUntil ? ` · Valid Until: ${fmtDate(rx.validUntil)}` : ''}
              </p>
            </div>
            <span className="inline-block px-3.5 py-1 rounded-full text-[.75rem] font-bold" style={{
              background: statusBg, color: statusColor,
            }}>
              {statusLabel(rx.status)}
            </span>
          </div>

          <hr className="border-slate-100" />

          {/* Patient + Doctor side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Patient */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-[.65rem] font-bold tracking-[.08em] uppercase text-[#94a3b8] block">
                Patient
              </span>
              <p className="mt-1 text-base font-bold text-slate-900">{rx.patientName}</p>
              <p className="text-sm text-slate-500">Age {rx.patientAge} years</p>
            </div>

            {/* Doctor */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-[.65rem] font-bold tracking-[.08em] uppercase text-[#94a3b8] block">
                Prescribing Doctor
              </span>
              {doctorDisplay
                ? <>
                    <p className="mt-1 text-base font-bold text-slate-900">{doctorDisplay.split(' — ')[0]}</p>
                    {rx.doctor?.specialization && (
                      <p className="text-sm text-slate-500">{rx.doctor.specialization}</p>
                    )}
                  </>
                : <p className="mt-1 text-sm text-slate-400 italic">Not recorded</p>
              }
            </div>
          </div>

          {/* Diagnosis */}
          {rx.diagnosis && (
            <div className="rounded-2xl bg-blue-50 px-5 py-4">
              <span className="text-[.65rem] font-bold tracking-[.08em] uppercase text-[#60a5fa] block">
                Diagnosis
              </span>
              <p className="mt-1 text-sm font-medium text-blue-900">{rx.diagnosis}</p>
            </div>
          )}

          {/* Medicines */}
          <div>
            <span className="text-[.65rem] font-bold tracking-[.08em] uppercase text-[#94a3b8] block">
              Prescribed Medicines ({rx.medicines.length})
            </span>
            <div className="mt-3 space-y-2">
              {rx.medicines.map((m, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-[14px_16px]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{m.medicineName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Dosage: {m.dosage} · Frequency: {m.frequency} · Duration: {m.durationDays} day{m.durationDays !== 1 ? 's' : ''}
                      </p>
                      {m.instructions && (
                        <span className="mt-1.5 inline-flex rounded-lg bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          {m.instructions}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {rx.notes && (
            <div className="rounded-2xl bg-amber-50 px-5 py-4">
              <span className="text-[.65rem] font-bold tracking-[.08em] uppercase text-[#f59e0b] block">
                Notes
              </span>
              <p className="mt-1 text-sm text-amber-900">{rx.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-100 pt-3.5 text-[.72rem] text-[#94a3b8]">
            Generated electronically · Prescription ID: {rx.id}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const Prescription: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<FamilyPrescription[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [viewRx,        setViewRx]        = useState<FamilyPrescription | null>(null);
  const [filter,        setFilter]        = useState<'all' | 'active' | 'completed' | 'discontinued'>('all');
  const [search,        setSearch]        = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFamilyPrescriptions();
      setPrescriptions(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = prescriptions
    .filter(rx => filter === 'all' || rx.status === filter)
    .filter(rx => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        rx.patientName.toLowerCase().includes(q) ||
        (rx.diagnosis ?? '').toLowerCase().includes(q) ||
        rx.medicines.some(m => m.medicineName.toLowerCase().includes(q)) ||
        (rx.doctor?.user?.fullName ?? '').toLowerCase().includes(q)
      );
    });

  const counts = {
    all:          prescriptions.length,
    active:       prescriptions.filter(r => r.status === 'active').length,
    completed:    prescriptions.filter(r => r.status === 'completed').length,
    discontinued: prescriptions.filter(r => r.status === 'discontinued').length,
  };

  const TABS = [
    { key: 'all'          as const, label: `All (${counts.all})` },
    { key: 'active'       as const, label: `Active (${counts.active})` },
    { key: 'completed'    as const, label: `Completed (${counts.completed})` },
    { key: 'discontinued' as const, label: `Discontinued (${counts.discontinued})` },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {loading ? 'Loading…' : `${counts.all} prescription${counts.all !== 1 ? 's' : ''} for your family members`}
            </p>
          </div>
          <button
            type="button" onClick={load} disabled={loading}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:shadow-md disabled:opacity-50 transition"
          >
            <IconRefresh className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Summary strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total',        val: counts.all,          bg: 'bg-slate-100',   Icon: IconFileText,  color: 'text-slate-700'   },
            { label: 'Active',       val: counts.active,       bg: 'bg-emerald-100', Icon: IconPill, color: 'text-emerald-600' },
            { label: 'Completed',    val: counts.completed,    bg: 'bg-blue-100',    Icon: IconFileText,  color: 'text-blue-600'    },
            { label: 'Discontinued', val: counts.discontinued, bg: 'bg-red-100',     Icon: IconPill, color: 'text-red-500'     },
          ].map(({ label, val, bg, Icon, color }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
                {loading
                  ? <div className="mt-1 h-7 w-10 animate-pulse rounded-lg bg-slate-100" />
                  : <p className={`text-2xl font-bold ${color}`}>{val}</p>
                }
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs + search */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
            {TABS.map(({ key, label }) => (
              <button
                key={key} type="button" onClick={() => setFilter(key)}
                className={`whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-semibold transition ${
                  filter === key ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-72">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              type="search"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition"
              placeholder="Search patient, diagnosis, medicine…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-bold">Error:</span> {error}
            <button type="button" onClick={load} className="ml-auto rounded-xl bg-red-100 px-3 py-1 text-xs font-semibold hover:bg-red-200 transition">
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  {['Patient', 'Doctor', 'Diagnosis', 'Medicines', 'Issued', 'Valid Until', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-24 text-slate-400">
            <IconFileText className="mb-3 h-12 w-12 opacity-30 text-slate-400" />
            <p className="text-base font-semibold">No prescriptions found</p>
            <p className="mt-1 text-sm">
              {search
                ? 'Try a different search term.'
                : filter !== 'all'
                  ? `No ${filter} prescriptions.`
                  : 'Prescriptions issued for your family members will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Diagnosis</th>
                  <th className="px-4 py-3">Medicines</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Valid Until</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(rx => {
                  const doctorName = rx.doctor?.user?.fullName
                    ? `Dr. ${rx.doctor.user.fullName}`
                    : '—';
                  return (
                    <tr key={rx.id} className="transition hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {rx.patientName}
                        <span className="ml-1.5 text-xs font-normal text-slate-400">Age {rx.patientAge}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{doctorName}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{rx.diagnosis ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {rx.medicines.slice(0, 2).map((m, i) => (
                            <span key={i} className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              {m.medicineName}
                            </span>
                          ))}
                          {rx.medicines.length > 2 && (
                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                              +{rx.medicines.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(rx.issuedDate)}</td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(rx.validUntil)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(rx.status)}>{statusLabel(rx.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {/* Single "View" button — opens the print-style modal directly */}
                        <button
                          type="button"
                          onClick={() => setViewRx(rx)}
                          className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                          <IconEye className="h-3.5 w-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View modal — print-formatted prescription */}
      {viewRx && <ViewModal rx={viewRx} onClose={() => setViewRx(null)} />}
    </div>
  );
};

export default Prescription;