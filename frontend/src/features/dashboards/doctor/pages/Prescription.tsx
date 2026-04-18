/**
 * Prescription.tsx — display-only view
 * Create prescriptions from Patient Management → Confirmed appointments.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Badge from '../../common/widgets/Badge';

import {
  getAllPrescriptions,
  discontinuePrescription,
  completePrescription,
  deletePrescription,
  type Prescription,
} from '../../../../api/prescriptions/doctor-prescription.api';

export type PrescriptionStatus = 'active' | 'completed' | 'discontinued';
// Only 3 filter tabs are shown in the UI: all, active, completed
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
  eye:     'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  ban:     'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  check:   'M5 13l4 4L19 7',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  print:   'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-10 0h8v4H6v-4z',
  pill:    'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  doc:     'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  info:    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Toast { id: number; kind: 'success' | 'error'; message: string }
interface ConfirmState {
  open: boolean; title: string; message: string;
  label: string; danger: boolean; loading: boolean;
  action: () => Promise<void>;
}
const CONFIRM_CLOSED: ConfirmState = { open:false, title:'', message:'', label:'', danger:false, loading:false, action: async()=>{} };

// ── Prescription Card ─────────────────────────────────────────────────────────
interface RxCardProps { rx: Prescription; onView:(rx:Prescription)=>void; onComplete:(rx:Prescription)=>void; onDiscontinue:(rx:Prescription)=>void; onDelete:(rx:Prescription)=>void; onPrint:(rx:Prescription)=>void }
const RxCard: React.FC<RxCardProps> = ({ rx, onView, onComplete, onDiscontinue, onDelete, onPrint }) => {
  const cfg = statusConfig[(rx.status as PrescriptionStatus) ?? 'active'];
  const isActive = rx.status === 'active';
  return (
    <div className="group flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
      <div className={`h-1 rounded-t-2xl ${rx.status==='active'?'bg-gradient-to-r from-emerald-400 to-emerald-500':rx.status==='completed'?'bg-gradient-to-r from-blue-400 to-blue-500':'bg-gradient-to-r from-red-300 to-red-400'}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{rx.patientName}</p>
            <p className="mt-0.5 text-xs text-slate-400">Age {rx.patientAge}</p>
          </div>
          <Badge tone={cfg.tone}>{cfg.label}</Badge>
        </div>
        {rx.diagnosis && <p className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 line-clamp-2">{rx.diagnosis}</p>}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {rx.medicines.slice(0,3).map((m:any,i:number)=>(
            <span key={i} className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{m.medicineName}</span>
          ))}
          {rx.medicines.length > 3 && <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">+{rx.medicines.length-3} more</span>}
        </div>
        <div className="mt-auto flex items-center gap-3 border-t border-slate-50 pt-3 text-xs text-slate-400">
          <span>Issued {fmtDate(rx.issuedDate)}</span>
          {rx.validUntil && <span>· Valid to {fmtDate(rx.validUntil)}</span>}
        </div>
        <div className="mt-3 flex items-center gap-1">
          <button type="button" onClick={()=>onView(rx)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
            <Ico d={icons.eye} cls="h-3.5 w-3.5" /> View
          </button>
          <button type="button" onClick={()=>onPrint(rx)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition">
            <Ico d={icons.print} />
          </button>
          {isActive && <>
            <button type="button" onClick={()=>onComplete(rx)} title="Mark completed" className="rounded-xl p-2 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition"><Ico d={icons.check} /></button>
            <button type="button" onClick={()=>onDiscontinue(rx)} title="Discontinue" className="rounded-xl p-2 text-amber-500 hover:bg-amber-50 hover:text-amber-700 transition"><Ico d={icons.ban} /></button>
          </>}
          <button type="button" onClick={()=>onDelete(rx)} title="Delete" className="rounded-xl p-2 text-red-400 hover:bg-red-50 hover:text-red-600 transition"><Ico d={icons.trash} /></button>
        </div>
      </div>
    </div>
  );
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
const DetailModal: React.FC<{ rx:Prescription|null; onClose:()=>void; onPrint:(rx:Prescription)=>void }> = ({ rx, onClose, onPrint }) => {
  if (!rx) return null;
  const cfg = statusConfig[(rx.status as PrescriptionStatus) ?? 'active'];
  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto p-4 pt-10">
      <button className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} type="button" />
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className={`h-1.5 rounded-t-3xl ${rx.status==='active'?'bg-gradient-to-r from-emerald-400 to-emerald-500':rx.status==='completed'?'bg-gradient-to-r from-blue-400 to-blue-500':'bg-gradient-to-r from-red-300 to-red-400'}`} />
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{rx.patientName}</h2>
              <Badge tone={cfg.tone}>{cfg.label}</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">Age {rx.patientAge} · Issued {fmtDate(rx.issuedDate)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={()=>{onClose();onPrint(rx);}} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition" title="Print"><Ico d={icons.print} cls="h-5 w-5" /></button>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"><Ico d={icons.close} cls="h-5 w-5" /></button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {rx.diagnosis && <div className="rounded-2xl bg-blue-50 px-4 py-3"><p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-blue-400">Diagnosis</p><p className="text-sm font-medium text-blue-900">{rx.diagnosis}</p></div>}
          {rx.validUntil && <div><p className="mb-0.5 text-xs font-semibold text-slate-400">Valid Until</p><p className="text-sm text-slate-700">{fmtDate(rx.validUntil)}</p></div>}
          {rx.notes && <div className="rounded-2xl bg-amber-50 px-4 py-3"><p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-amber-400">Notes</p><p className="text-sm text-amber-900">{rx.notes}</p></div>}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Medicines ({rx.medicines.length})</p>
            <div className="space-y-2">
              {rx.medicines.map((m:any,i:number)=>(
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{i+1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{m.medicineName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{m.dosage} · {m.frequency} · {m.durationDays} day{m.durationDays!==1?'s':''}</p>
                    {m.instructions && <p className="mt-1.5 inline-flex rounded-lg bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{m.instructions}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Print View ────────────────────────────────────────────────────────────────
const PrintView: React.FC<{ rx:Prescription; onClose:()=>void }> = ({ rx, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    if (!ref.current) return;
    const w = window.open('','_blank');
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
            <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition">
              <Ico d={icons.print} cls="h-3.5 w-3.5" /> Print / Save PDF
            </button>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"><Ico d={icons.close} cls="h-5 w-5" /></button>
          </div>
        </div>
        <div ref={ref} className="p-8">
          <h1>Medical Prescription</h1>
          <p className="sub">Issued: {fmtDate(rx.issuedDate)}{rx.validUntil?` · Valid Until: ${fmtDate(rx.validUntil)}`:''} · <span className="badge">{rx.status}</span></p>
          <div className="section">
            <div className="label">Patient Details</div>
            <p style={{fontWeight:700}}>{rx.patientName}</p>
            <p>Age {rx.patientAge} years</p>
            {rx.diagnosis && <p style={{marginTop:8}}><span className="label" style={{display:'block'}}>Diagnosis</span>{rx.diagnosis}</p>}
          </div>
          <div className="section">
            <div className="label">Prescribed Medicines</div>
            {rx.medicines.map((m:any,i:number)=>(
              <div key={i} className="med">
                <p className="med-name">{i+1}. {m.medicineName}</p>
                <p className="med-sub">Dosage: {m.dosage} · Frequency: {m.frequency} · Duration: {m.durationDays} day{m.durationDays!==1?'s':''}</p>
                {m.instructions && <span style={{fontSize:'.78rem',color:'#047857',background:'#d1fae5',borderRadius:6,padding:'2px 8px',display:'inline-block',marginTop:5}}>{m.instructions}</span>}
              </div>
            ))}
          </div>
          {rx.notes && <div className="section"><div className="label">Notes</div><p style={{fontSize:'.9rem'}}>{rx.notes}</p></div>}
          <div className="footer"><p>Generated electronically · Prescription ID: {rx.id}</p></div>
        </div>
      </div>
    </div>
  );
};

// ── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{ state:ConfirmState; onConfirm:()=>void; onCancel:()=>void }> = ({ state, onConfirm, onCancel }) => {
  if (!state.open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} type="button" />
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900">{state.title}</h3>
        <p className="mt-2 text-sm text-slate-500">{state.message}</p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel} disabled={state.loading} className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={state.loading} className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition ${state.danger?'bg-red-500 hover:bg-red-600':'bg-emerald-600 hover:bg-emerald-700'}`}>
            {state.loading ? 'Processing…' : state.label}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
const ToastList: React.FC<{ toasts:Toast[]; onDismiss:(id:number)=>void }> = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t=>(
      <div key={t.id} onClick={()=>onDismiss(t.id)}
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg cursor-pointer transition ${t.kind==='success'?'bg-emerald-600':'bg-red-500'}`}>
        <span>{t.kind==='success'?'✓':'✕'}</span>{t.message}
      </div>
    ))}
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ label:string; value:number; color:string; bg:string; icon:string; loading?:boolean }> = ({ label, value, color, bg, icon, loading }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${bg}`}><Ico d={icon} cls={`h-5 w-5 ${color}`} /></div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      {loading ? <div className="mt-1 h-7 w-10 animate-pulse rounded-lg bg-slate-100" /> : <p className={`text-2xl font-bold ${color}`}>{value}</p>}
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const PrescriptionPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string|null>(null);
  const [filter,  setFilter]  = useState<FilterTab>('all');
  const [search,  setSearch]  = useState('');
  const [detail,  setDetail]  = useState<Prescription|null>(null);
  const [printRx, setPrintRx] = useState<Prescription|null>(null);
  const [toasts,  setToasts]  = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState>(CONFIRM_CLOSED);

  const toast = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now();
    setToasts(t=>[...t,{id,kind,message}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4500);
  },[]);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true); setFetchError(null);
    try {
      const res = await getAllPrescriptions({ status: filter==='all'?undefined:filter, limit:100 });
      setPrescriptions((res as any).data ?? []);
      setTotal((res as any).total ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load prescriptions.';
      setFetchError(msg); toast('error', msg);
    } finally { setLoading(false); }
  },[filter,toast]);

  useEffect(()=>{ fetchPrescriptions(); },[fetchPrescriptions]);

  const filtered = search.trim()
    ? prescriptions.filter(rx=>{
        const q = search.toLowerCase();
        return rx.patientName.toLowerCase().includes(q)||(rx.diagnosis??'').toLowerCase().includes(q)||rx.medicines.some((m:any)=>m.medicineName.toLowerCase().includes(q));
      })
    : prescriptions;

  const counts = {
    all: total,
    active: prescriptions.filter(r=>r.status==='active').length,
    completed: prescriptions.filter(r=>r.status==='completed').length,
  };

  const openDiscontinue = useCallback((rx:Prescription) => {
    const action = async () => {
      setConfirm(c=>({...c,loading:true}));
      try { const u=await discontinuePrescription(rx.id); setPrescriptions(p=>p.map(r=>r.id===u.id?u:r)); setConfirm(CONFIRM_CLOSED); toast('success','Prescription discontinued.'); }
      catch(err){ setConfirm(c=>({...c,loading:false})); toast('error',err instanceof Error?err.message:'Failed.'); }
    };
    setConfirm({ open:true, danger:false, loading:false, label:'Discontinue', title:'Discontinue Prescription', message:`Stop ${rx.patientName}'s prescription?`, action });
  },[toast]);

  const openComplete = useCallback((rx:Prescription) => {
    const action = async () => {
      setConfirm(c=>({...c,loading:true}));
      try { const u=await completePrescription(rx.id); setPrescriptions(p=>p.map(r=>r.id===u.id?u:r)); setConfirm(CONFIRM_CLOSED); toast('success','Marked as completed.'); }
      catch(err){ setConfirm(c=>({...c,loading:false})); toast('error',err instanceof Error?err.message:'Failed.'); }
    };
    setConfirm({ open:true, danger:false, loading:false, label:'Mark Complete', title:'Mark as Completed', message:`Mark ${rx.patientName}'s prescription as completed?`, action });
  },[toast]);

  const openDelete = useCallback((rx:Prescription) => {
    const action = async () => {
      setConfirm(c=>({...c,loading:true}));
      try { await deletePrescription(rx.id); setPrescriptions(p=>p.filter(r=>r.id!==rx.id)); setTotal(t=>Math.max(0,t-1)); setConfirm(CONFIRM_CLOSED); toast('success','Prescription deleted.'); }
      catch(err){ setConfirm(c=>({...c,loading:false})); toast('error',err instanceof Error?err.message:'Failed.'); }
    };
    setConfirm({ open:true, danger:true, loading:false, label:'Delete', title:'Delete Prescription', message:`Permanently delete ${rx.patientName}'s prescription?`, action });
  },[toast]);

  const TABS: {key:FilterTab;label:string}[] = [
    {key:'all',       label:`All (${counts.all})`},
    {key:'active',    label:`Active (${counts.active})`},
    {key:'completed', label:`Completed (${counts.completed})`},
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
            <p className="mt-0.5 text-sm text-slate-400">{loading?'Loading…':`${total} prescription${total!==1?'s':''} on record`}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={fetchPrescriptions} disabled={loading}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:shadow-md disabled:opacity-50 transition">
              <Ico d={icons.refresh} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Total"     value={counts.all}      color="text-slate-700"   bg="bg-slate-100"   icon={icons.doc}   loading={loading} />
          <StatCard label="Active"    value={counts.active}   color="text-emerald-600" bg="bg-emerald-100" icon={icons.check}  loading={loading} />
          <StatCard label="Completed" value={counts.completed} color="text-blue-600"   bg="bg-blue-100"    icon={icons.pill}   loading={loading} />
        </div>

        {/* Filter tabs + search */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
            {TABS.map(({key,label})=>(
              <button key={key} type="button" onClick={()=>setFilter(key)}
                className={`whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-semibold transition ${filter===key?'bg-emerald-600 text-white shadow-sm':'text-slate-500 hover:text-slate-800'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-64">
            <Ico d={icons.search} cls="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input type="search" className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition"
              placeholder="Search name, diagnosis, medicine…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>

        {fetchError && !loading && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-bold">Error:</span> {fetchError}
            <button type="button" onClick={fetchPrescriptions} className="ml-auto rounded-xl bg-red-100 px-3 py-1 text-xs font-semibold hover:bg-red-200 transition">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_,i)=>(
              <div key={i} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-3 h-4 w-2/3 rounded-lg bg-slate-100" />
                <div className="mb-2 h-3 w-1/3 rounded-lg bg-slate-100" />
                <div className="h-10 w-full rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-24 text-slate-400">
            <Ico d={icons.doc} cls="mb-3 h-12 w-12 opacity-30" />
            <p className="text-base font-semibold">No prescriptions found</p>
            <p className="mt-1 text-sm">{search?'Try a different search term.':filter!=='all'?`No ${filter} prescriptions yet.`:'Prescriptions you create will appear here.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(rx=>(
              <RxCard key={rx.id} rx={rx} onView={setDetail} onComplete={openComplete} onDiscontinue={openDiscontinue} onDelete={openDelete} onPrint={setPrintRx} />
            ))}
          </div>
        )}
      </div>

      <DetailModal rx={detail} onClose={()=>setDetail(null)} onPrint={rx=>{setDetail(null);setPrintRx(rx);}} />
      {printRx && <PrintView rx={printRx} onClose={()=>setPrintRx(null)} />}
      <ConfirmModal state={confirm} onConfirm={confirm.action} onCancel={()=>setConfirm(CONFIRM_CLOSED)} />
      <ToastList toasts={toasts} onDismiss={id=>setToasts(t=>t.filter(x=>x.id!==id))} />
    </div>
  );
};

export default PrescriptionPage;
