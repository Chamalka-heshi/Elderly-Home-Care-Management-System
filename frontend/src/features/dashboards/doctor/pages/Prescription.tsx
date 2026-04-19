import React, { useState, useEffect, useCallback, useRef } from 'react';
import Badge from '../../common/widgets/Badge';

import {
  getAllPrescriptions,
  discontinuePrescription,
  deletePrescription,
  type Prescription,
} from '../../../../api/prescriptions/doctor-prescription.api';

export type PrescriptionStatus = 'active' | 'completed' | 'discontinued';
type FilterTab = 'all' | 'active' | 'completed';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d?: string | null): string => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const statusConfig: Record<PrescriptionStatus, { tone: 'emerald' | 'blue' | 'red'; label: string }> = {
  active:       { tone: 'emerald', label: 'Active' },
  completed:    { tone: 'blue',    label: 'Completed' },
  discontinued: { tone: 'red',     label: 'Discontinued' },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, cls = 'h-4 w-4' }: { d: string; cls?: string }) => (
  <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const icons = {
  close:   'M6 18L18 6M6 6l12 12',
  trash:   'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  ban:     'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  print:   'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-10 0h8v4H6v-4z',
  pill:    'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  doc:     'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Toast { id: number; kind: 'success' | 'error'; message: string }
interface ConfirmState {
  open: boolean; title: string; message: string;
  label: string; danger: boolean; loading: boolean;
  action: () => Promise<void>;
}
const CONFIRM_CLOSED: ConfirmState = {
  open: false, title: '', message: '', label: '', danger: false, loading: false, action: async () => {},
};

// ── Table Row ─────────────────────────────────────────────────────────────────
interface RxRowProps {
  rx: Prescription;
  onPrint: (rx: Prescription) => void;
  onDiscontinue: (rx: Prescription) => void;
  onDelete: (rx: Prescription) => void;
}

const RxRow: React.FC<RxRowProps> = ({ rx, onPrint, onDiscontinue, onDelete }) => {
  const cfg = statusConfig[(rx.status as PrescriptionStatus) ?? 'active'];
  const isActive = rx.status === 'active';

  return (
    <tr className="group border-b border-slate-100 hover:bg-slate-50/60 transition">
      {/* Patient */}
      <td className="px-4 py-3.5">
        <p className="font-semibold text-slate-800 text-sm">{rx.patientName}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {rx.patientAge} yrs
          {rx.diagnosis && (
            <span className="ml-2 text-slate-500 truncate max-w-[140px] inline-block align-bottom">
              {rx.diagnosis}
            </span>
          )}
        </p>
      </td>

      {/* Medicines */}
      <td className="px-4 py-3.5">
        <div className="flex flex-wrap gap-1">
          {rx.medicines.slice(0, 2).map((m: any, i: number) => (
            <span key={i} className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              {m.medicineName}
            </span>
          ))}
          {rx.medicines.length > 2 && (
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              +{rx.medicines.length - 2} more
            </span>
          )}
        </div>
      </td>

      {/* Issued */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <p className="text-sm text-slate-700">{fmtDate(rx.issuedDate)}</p>
      </td>

      {/* End Date */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <p className="text-sm text-slate-700">{fmtDate(rx.validUntil)}</p>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <Badge tone={cfg.tone}>{cfg.label}</Badge>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPrint(rx)}
            className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            <Ico d={icons.print} cls="h-3.5 w-3.5" /> Print
          </button>

          {isActive && (
            <button
              type="button"
              onClick={() => onDiscontinue(rx)}
              title="Discontinue"
              className="rounded-xl p-1.5 text-amber-500 hover:bg-amber-50 hover:text-amber-700 transition"
            >
              <Ico d={icons.ban} cls="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(rx)}
            title="Delete"
            className="rounded-xl p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
          >
            <Ico d={icons.trash} cls="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ── Print View ────────────────────────────────────────────────────────────────
const PrintView: React.FC<{ rx: Prescription; onClose: () => void }> = ({ rx, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    if (!ref.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Rx – ${rx.patientName}</title><style>*{box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1e293b;max-width:680px;margin:auto}h1{font-size:1.5rem;font-weight:700}.sub{color:#64748b;font-size:.85rem;margin:6px 0 28px}.label{font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px}.section{margin:24px 0}.badge{display:inline-block;padding:3px 12px;border-radius:999px;font-size:.75rem;font-weight:700;background:#d1fae5;color:#065f46}.med{border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:10px}.med-name{font-weight:700;font-size:.95rem}.med-sub{font-size:.8rem;color:#64748b;margin-top:3px}.footer{margin-top:48px;border-top:1px solid #e2e8f0;padding-top:16px;font-size:.72rem;color:#94a3b8}@media print{body{padding:16px}}</style></head><body>${ref.current.innerHTML}</body></html>`);
    w.document.close(); w.focus(); w.print();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-10">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <p className="text-sm font-semibold text-slate-700">Prescription Preview</p>
          <div className="flex gap-2">
            <button type="button" onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition">
              <Ico d={icons.print} cls="h-3.5 w-3.5" /> Print / Save PDF
            </button>
            <button type="button" onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition">
              <Ico d={icons.close} cls="h-5 w-5" />
            </button>
          </div>
        </div>
        <div ref={ref} className="p-8">
          <h1>Medical Prescription</h1>
          <p className="sub">
            Issued: {fmtDate(rx.issuedDate)}
            {rx.validUntil ? ` · Valid Until: ${fmtDate(rx.validUntil)}` : ''}
            {' · '}<span className="badge">{rx.status}</span>
          </p>
          <div className="section">
            <div className="label">Patient Details</div>
            <p style={{ fontWeight: 700 }}>{rx.patientName}</p>
            <p>Age {rx.patientAge} years</p>
            {rx.diagnosis && (
              <p style={{ marginTop: 8 }}>
                <span className="label" style={{ display: 'block' }}>Diagnosis</span>
                {rx.diagnosis}
              </p>
            )}
          </div>
          <div className="section">
            <div className="label">Prescribed Medicines</div>
            {rx.medicines.map((m: any, i: number) => (
              <div key={i} className="med">
                <p className="med-name">{i + 1}. {m.medicineName}</p>
                <p className="med-sub">
                  Dosage: {m.dosage} · Frequency: {m.frequency} · Duration: {m.durationDays} day{m.durationDays !== 1 ? 's' : ''}
                </p>
                {m.instructions && (
                  <span style={{ fontSize: '.78rem', color: '#047857', background: '#d1fae5', borderRadius: 6, padding: '2px 8px', display: 'inline-block', marginTop: 5 }}>
                    {m.instructions}
                  </span>
                )}
              </div>
            ))}
          </div>
          {rx.notes && (
            <div className="section">
              <div className="label">Notes</div>
              <p style={{ fontSize: '.9rem' }}>{rx.notes}</p>
            </div>
          )}
          <div className="footer">
            <p>Generated electronically · Prescription ID: {rx.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{ state: ConfirmState; onConfirm: () => void; onCancel: () => void }> = ({ state, onConfirm, onCancel }) => {
  if (!state.open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} type="button" />
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900">{state.title}</h3>
        <p className="mt-2 text-sm text-slate-500">{state.message}</p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel} disabled={state.loading}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={state.loading}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition ${state.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
            {state.loading ? 'Processing…' : state.label}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
const ToastList: React.FC<{ toasts: Toast[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} onClick={() => onDismiss(t.id)}
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg cursor-pointer transition ${t.kind === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
        <span>{t.kind === 'success' ? '✓' : '✕'}</span>{t.message}
      </div>
    ))}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const PrescriptionPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState<string | null>(null);
  const [filter,        setFilter]        = useState<FilterTab>('all');
  const [search,        setSearch]        = useState('');
  const [printRx,       setPrintRx]       = useState<Prescription | null>(null);
  const [toasts,        setToasts]        = useState<Toast[]>([]);
  const [confirm,       setConfirm]       = useState<ConfirmState>(CONFIRM_CLOSED);

  const toast = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, kind, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true); setFetchError(null);
    try {
      const res = await getAllPrescriptions({ status: filter === 'all' ? undefined : filter, limit: 100 });
      setPrescriptions((res as any).data ?? []);
      setTotal((res as any).total ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load prescriptions.';
      setFetchError(msg); toast('error', msg);
    } finally { setLoading(false); }
  }, [filter, toast]);

  useEffect(() => { fetchPrescriptions(); }, [fetchPrescriptions]);

  const filtered = search.trim()
    ? prescriptions.filter(rx => {
        const q = search.toLowerCase();
        return rx.patientName.toLowerCase().includes(q)
          || (rx.diagnosis ?? '').toLowerCase().includes(q)
          || rx.medicines.some((m: any) => m.medicineName.toLowerCase().includes(q));
      })
    : prescriptions;

  const counts = {
    all:       total,
    active:    prescriptions.filter(r => r.status === 'active').length,
    completed: prescriptions.filter(r => r.status === 'completed').length,
  };

  const openDiscontinue = useCallback((rx: Prescription) => {
    const action = async () => {
      setConfirm(c => ({ ...c, loading: true }));
      try {
        const u = await discontinuePrescription(rx.id);
        setPrescriptions(p => p.map(r => r.id === u.id ? u : r));
        setConfirm(CONFIRM_CLOSED);
        toast('success', 'Prescription discontinued.');
      } catch (err) {
        setConfirm(c => ({ ...c, loading: false }));
        toast('error', err instanceof Error ? err.message : 'Failed.');
      }
    };
    setConfirm({ open: true, danger: false, loading: false, label: 'Discontinue', title: 'Discontinue Prescription', message: `Stop ${rx.patientName}'s prescription?`, action });
  }, [toast]);

  const openDelete = useCallback((rx: Prescription) => {
    const action = async () => {
      setConfirm(c => ({ ...c, loading: true }));
      try {
        await deletePrescription(rx.id);
        setPrescriptions(p => p.filter(r => r.id !== rx.id));
        setTotal(t => Math.max(0, t - 1));
        setConfirm(CONFIRM_CLOSED);
        toast('success', 'Prescription deleted.');
      } catch (err) {
        setConfirm(c => ({ ...c, loading: false }));
        toast('error', err instanceof Error ? err.message : 'Failed.');
      }
    };
    setConfirm({ open: true, danger: true, loading: false, label: 'Delete', title: 'Delete Prescription', message: `Permanently delete ${rx.patientName}'s prescription?`, action });
  }, [toast]);

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',       label: `All (${counts.all})` },
    { key: 'active',    label: `Active (${counts.active})` },
    { key: 'completed', label: `Completed (${counts.completed})` },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {loading ? 'Loading…' : `${total} prescription${total !== 1 ? 's' : ''} on record`}
            </p>
          </div>
          <button type="button" onClick={fetchPrescriptions} disabled={loading}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:shadow-md disabled:opacity-50 transition">
            <Ico d={icons.refresh} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-5">

        {/* Filter tabs + search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
            {TABS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setFilter(key)}
                className={`whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-semibold transition ${filter === key ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-64">
            <Ico d={icons.search} cls="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input type="search"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition"
              placeholder="Search name, diagnosis, medicine…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {fetchError && !loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-bold">Error:</span> {fetchError}
            <button type="button" onClick={fetchPrescriptions}
              className="ml-auto rounded-xl bg-red-100 px-3 py-1 text-xs font-semibold hover:bg-red-200 transition">
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Medicines</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Issued</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">End Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-3.5 animate-pulse rounded-lg bg-slate-100" style={{ width: `${55 + (j * 10) % 35}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Ico d={icons.doc} cls="h-10 w-10 opacity-30" />
                        <p className="text-sm font-semibold">No prescriptions found</p>
                        <p className="text-xs">
                          {search
                            ? 'Try a different search term.'
                            : filter !== 'all'
                            ? `No ${filter} prescriptions yet.`
                            : 'Prescriptions you create will appear here.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(rx => (
                    <RxRow
                      key={rx.id}
                      rx={rx}
                      onPrint={setPrintRx}
                      onDiscontinue={openDiscontinue}
                      onDelete={openDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
              Showing {filtered.length} of {total} prescription{total !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {printRx && <PrintView rx={printRx} onClose={() => setPrintRx(null)} />}
      <ConfirmModal state={confirm} onConfirm={confirm.action} onCancel={() => setConfirm(CONFIRM_CLOSED)} />
      <ToastList toasts={toasts} onDismiss={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
};

export default PrescriptionPage;