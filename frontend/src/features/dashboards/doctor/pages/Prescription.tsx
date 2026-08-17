import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Pagination from '../../common/Pagination';

import Badge from '../../common/widgets/Badge';

import {
  IconX,
  IconBan,
  IconRefresh,
  IconPrint,
  IconFileText,
  IconCheck,
} from '../../common/icons';

import {
  getAllPrescriptions,
  discontinuePrescription,
  type Prescription,
} from '../../../../api/prescriptions/doctor-prescription.api';

export type PrescriptionStatus = 'active' | 'completed' | 'discontinued';
type FilterTab = 'all' | 'active' | 'completed' | 'discontinued';

import { fmtDateShort } from '../../../../utils/dateTime';

const fmtDate = (d?: string | null): string => {
  if (!d) return '—';
  return fmtDateShort(d);
};

const statusConfig: Record<PrescriptionStatus, { tone: 'emerald' | 'blue' | 'red'; label: string }> = {
  active: { tone: 'emerald', label: 'Active' },
  completed: { tone: 'blue', label: 'Completed' },
  discontinued: { tone: 'red', label: 'Discontinued' },
};

// Types for showing popup messages and confirmation boxes

interface Toast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  label: string;
  danger: boolean;
  loading: boolean;
  action: () => Promise<void>;
}

const CONFIRM_CLOSED: ConfirmState = {
  open: false,
  title: '',
  message: '',
  label: '',
  danger: false,
  loading: false,
  action: async () => { },
};

// RxRow
// Displays a single row in the prescription history table
interface RxRowProps {
  rx: Prescription;
  onPrint: (rx: Prescription) => void;
  onDiscontinue: (rx: Prescription) => void;
}

const RxRow: React.FC<RxRowProps> = ({ rx, onPrint, onDiscontinue }) => {
  const cfg = statusConfig[(rx.status as PrescriptionStatus) ?? 'active'];
  const isActive = rx.status === 'active';

  return (
    <tr className="group border-b border-slate-100 hover:bg-slate-50/60 transition">
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

      <td className="px-4 py-3.5 whitespace-nowrap">
        <p className="text-sm text-slate-700">{fmtDate(rx.issuedDate)}</p>
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        <p className="text-sm text-slate-700">{fmtDate(rx.validUntil)}</p>
      </td>

      <td className="px-4 py-3.5">
        <Badge tone={cfg.tone}>{cfg.label}</Badge>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPrint(rx)}
            className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            <IconPrint className="h-3.5 w-3.5" /> Print
          </button>

          {isActive && (
            <button
              type="button"
              onClick={() => onDiscontinue(rx)}
              title="Discontinue"
              className="rounded-xl p-1.5 text-amber-500 hover:bg-amber-50 hover:text-amber-700 transition"
            >
              <IconBan className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// PrintView
// Shows a printable view of the prescription
const PrintView: React.FC<{ rx: Prescription; onClose: () => void }> = ({ rx, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  // Opens a new window with a printable version of the prescription data
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
              <IconPrint className="h-3.5 w-3.5" /> Print / Save PDF
            </button>
            <button type="button" onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition">
              <IconX className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div ref={ref} className="p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Medical Prescription</h1>
          <p className="sub text-sm text-slate-500 mb-6">
            Issued: {fmtDate(rx.issuedDate)}
            {rx.validUntil ? ` · Valid Until: ${fmtDate(rx.validUntil)}` : ''}
            {' · '}<span className={`badge inline-block px-3 py-1 rounded-full text-xs font-bold ${rx.status === 'active' ? 'bg-emerald-100 text-emerald-700' : rx.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{rx.status}</span>
          </p>
          <div className="section mb-8">
            <div className="label text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Patient Details</div>
            <p className="font-bold text-slate-800 text-base">{rx.patientName}</p>
            <p className="text-slate-600">Age {rx.patientAge} years</p>
            {rx.diagnosis && (
              <div className="mt-4">
                <span className="label text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Diagnosis</span>
                <p className="text-slate-700">{rx.diagnosis}</p>
              </div>
            )}
          </div>
          <div className="section mb-8">
            <div className="label text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Prescribed Medicines</div>
            <div className="space-y-3">
              {rx.medicines.map((m: any, i: number) => (
                <div key={i} className="med border border-slate-200 rounded-xl p-4 bg-slate-50/30">
                  <p className="med-name font-bold text-slate-800">{i + 1}. {m.medicineName}</p>
                  <p className="med-sub text-xs text-slate-500 mt-1">
                    Dosage: {m.dosage} · Frequency: {m.frequency} · Duration: {m.durationDays} day{m.durationDays !== 1 ? 's' : ''}
                  </p>
                  {m.instructions && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md">
                      {m.instructions}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {rx.notes && (
            <div className="section mb-8">
              <div className="label text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</div>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{rx.notes}</p>
            </div>
          )}
          <div className="footer mt-12 pt-6 border-t border-slate-100 text-[10px] text-slate-400">
            <p>Generated electronically · Prescription ID: {rx.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper components for confirmation modals and toast notifications

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

const ToastList: React.FC<{ toasts: Toast[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} onClick={() => onDismiss(t.id)}
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg cursor-pointer transition ${t.kind === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
        {t.kind === 'success' ? <IconCheck className="h-4 w-4" /> : <IconX className="h-4 w-4" />}
        {t.message}
      </div>
    ))}
  </div>
);

// PrescriptionPage
// Main page for doctors to see all past prescriptions they have written
const PrescriptionPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [printRx, setPrintRx] = useState<Prescription | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState>(CONFIRM_CLOSED);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const toast = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, kind, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  // Fetches the full list of prescriptions from the server
  const fetchPrescriptions = useCallback(async () => {
    setLoading(true); setFetchError(null);
    try {
      const res = await getAllPrescriptions({ limit: 100 });
      setPrescriptions((res as any).data ?? []);
      setTotal((res as any).total ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load prescriptions.';
      setFetchError(msg); toast('error', msg);
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchPrescriptions(); }, [fetchPrescriptions]);

  // Filters prescriptions based on the selected tab status

  const filtered = useMemo(() => prescriptions.filter(rx => {
    if (filter !== 'all' && rx.status !== filter) return false;
    return true;
  }), [prescriptions, filter]);

  // Reset to first page whenever the status tab changes
  useEffect(() => { setCurrentPage(1); }, [filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // All four tab counts derive from the same local array so they stay consistent.
  // `total` (from the server) is kept only for the page-header "X on record" text.
  const counts = {
    all: prescriptions.length,
    active: prescriptions.filter(r => r.status === 'active').length,
    completed: prescriptions.filter(r => r.status === 'completed').length,
    discontinued: prescriptions.filter(r => r.status === 'discontinued').length,
  };

  // Functions for stopping prescriptions with a confirmation popup

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


  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'active', label: `Active (${counts.active})` },
    { key: 'completed', label: `Completed (${counts.completed})` },
    { key: 'discontinued', label: `Discontinued (${counts.discontinued})` },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
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
            <IconRefresh />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-5">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm w-fit">
          {TABS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setFilter(key)}
              className={`whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-semibold transition ${filter === key ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {label}
            </button>
          ))}
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
                        <IconFileText className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-semibold">No prescriptions found</p>
                        <p className="text-xs">
                          {filter !== 'all'
                            ? `No ${filter} prescriptions yet.`
                            : 'Prescriptions you create will appear here.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((rx: Prescription) => (
                    <RxRow
                      key={rx.id}
                      rx={rx}
                      onPrint={setPrintRx}
                      onDiscontinue={openDiscontinue}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
                itemLabel="prescriptions"
                onPageChange={setCurrentPage}
              />
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