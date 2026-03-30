/**
 * src/features/dashboards/doctor/pages/Prescription.tsx
 * ──────────────────────────────────────────────────────
 * Doctor prescription management — create, view, change status, delete.
 * No update/edit — prescriptions are immutable once created.
 *
 * Layout:
 *  • Stat cards (Total / Active / Completed / Discontinued)
 *  • Status tab filter + search bar
 *  • Responsive card grid (2 cols on md, 3 on xl)
 *  • Create modal — full prescription form
 *  • Detail modal — medicines + print button
 *  • Confirm modal — for status change and delete
 *  • Toast notifications
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Badge from '../../common/widgets/Badge';
import {
  prescriptionApi,
  type Prescription,
  type MedicineItem,
  type PrescriptionStatus,
  type CreatePrescriptionPayload,
} from '../../../../api/prescription.api';

// ── Constants ────────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'PRN (as needed)',
  'Before meals',
  'After meals',
  'With food',
  'At bedtime',
];

const EMPTY_MED: MedicineItem = {
  medicineName: '',
  dosage: '',
  frequency: FREQUENCY_OPTIONS[0],
  durationDays: 7,
  instructions: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayStr = (): string => new Date().toISOString().slice(0, 10);

const fmtDate = (d?: string | null): string => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
};

const statusConfig: Record<
  PrescriptionStatus,
  { tone: 'emerald' | 'blue' | 'red'; label: string; dot: string }
> = {
  active:       { tone: 'emerald', label: 'Active',       dot: 'bg-emerald-500' },
  completed:    { tone: 'blue',    label: 'Completed',    dot: 'bg-blue-500' },
  discontinued: { tone: 'red',     label: 'Discontinued', dot: 'bg-red-400' },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Toast { id: number; kind: 'success' | 'error'; message: string }
type FilterTab = 'all' | PrescriptionStatus;

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
  open: false, title: '', message: '',
  label: '', danger: false, loading: false,
  action: async () => {},
};

// ── Shared input class ────────────────────────────────────────────────────────

const inp =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 ' +
  'outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 ' +
  'placeholder:text-slate-300';

// ── Icons ─────────────────────────────────────────────────────────────────────

const Ico = ({ d, cls = 'h-4 w-4' }: { d: string; cls?: string }) => (
  <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  close:   'M6 18L18 6M6 6l12 12',
  trash:   'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  plus:    'M12 4v16m8-8H4',
  eye:     'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  ban:     'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  check:   'M5 13l4 4L19 7',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  print:   'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-10 0h8v4H6v-4z',
  pill:    'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  doc:     'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
};

// ── Medicine Row ──────────────────────────────────────────────────────────────

interface MedRowProps {
  index: number;
  med: MedicineItem;
  onChange: (i: number, field: keyof MedicineItem, val: string | number) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}

const MedicineRow: React.FC<MedRowProps> = ({ index, med, onChange, onRemove, canRemove }) => (
  <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
    {/* Medicine number badge */}
    <div className="mb-3 flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
        <Ico d={icons.pill} cls="h-3.5 w-3.5" />
        Medicine {index + 1}
      </span>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
        >
          <Ico d={icons.trash} cls="h-3.5 w-3.5" />
        </button>
      )}
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Medicine Name <span className="text-red-400">*</span>
        </label>
        <input
          className={inp}
          value={med.medicineName}
          onChange={(e) => onChange(index, 'medicineName', e.target.value)}
          placeholder="e.g. Amoxicillin 500mg"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Dosage <span className="text-red-400">*</span>
        </label>
        <input
          className={inp}
          value={med.dosage}
          onChange={(e) => onChange(index, 'dosage', e.target.value)}
          placeholder="500 mg"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Duration (days) <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          min={1}
          max={365}
          className={inp}
          value={med.durationDays}
          onChange={(e) => onChange(index, 'durationDays', Number(e.target.value))}
          required
        />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-semibold text-slate-500">Frequency <span className="text-red-400">*</span></label>
        <select
          className={inp}
          value={med.frequency}
          onChange={(e) => onChange(index, 'frequency', e.target.value)}
        >
          {FREQUENCY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-semibold text-slate-500">Special Instructions</label>
        <input
          className={inp}
          value={med.instructions ?? ''}
          onChange={(e) => onChange(index, 'instructions', e.target.value)}
          placeholder="e.g. Take after food with water"
        />
      </div>
    </div>
  </div>
);

// ── Create Prescription Modal ─────────────────────────────────────────────────

interface RxFormValues {
  patientName: string;
  patientAge:  string;
  diagnosis:   string;
  notes:       string;
  issuedDate:  string;
  validUntil:  string;
}

const EMPTY_FORM: RxFormValues = {
  patientName: '',
  patientAge:  '',
  diagnosis:   '',
  notes:       '',
  issuedDate:  todayStr(),
  validUntil:  '',
};

interface CreateModalProps {
  open:    boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePrescriptionPayload) => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ open, loading, onClose, onSubmit }) => {
  const [form, setForm]           = useState<RxFormValues>(EMPTY_FORM);
  const [medicines, setMedicines] = useState<MedicineItem[]>([{ ...EMPTY_MED }]);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, issuedDate: todayStr() });
      setMedicines([{ ...EMPTY_MED }]);
      setError(null);
    }
  }, [open]);

  const addMed    = () => setMedicines((m) => [...m, { ...EMPTY_MED }]);
  const removeMed = (i: number) => setMedicines((m) => m.filter((_, idx) => idx !== i));
  const changeMed = (i: number, field: keyof MedicineItem, val: string | number) =>
    setMedicines((m) => m.map((med, idx) => (idx === i ? { ...med, [field]: val } : med)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const age = parseInt(form.patientAge, 10);
    if (isNaN(age) || age < 0 || age > 130) {
      setError('Patient age must be between 0 and 130.');
      return;
    }
    const invalid = medicines.some(
      (m) => !m.medicineName.trim() || !m.dosage.trim() || m.durationDays < 1,
    );
    if (invalid) {
      setError('Fill in Name, Dosage and Duration for every medicine.');
      return;
    }
    setError(null);
    onSubmit({
      patientName: form.patientName.trim(),
      patientAge:  age,
      diagnosis:   form.diagnosis.trim() || undefined,
      notes:       form.notes.trim() || undefined,
      issuedDate:  form.issuedDate,
      validUntil:  form.validUntil || undefined,
      medicines:   medicines.map((m) => ({
        ...m,
        medicineName: m.medicineName.trim(),
        dosage:       m.dosage.trim(),
        durationDays: Number(m.durationDays),
        instructions: m.instructions?.trim() || undefined,
      })),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8">
      {/* Backdrop */}
      <button
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        type="button"
        aria-label="Close"
      />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
              <Ico d={icons.doc} cls="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">New Prescription</h2>
              <p className="text-xs text-slate-400">Fill in patient info and add medicines</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <Ico d={icons.close} cls="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
          {/* Patient info */}
          <div className="p-6 space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Ico d={icons.user} cls="h-3.5 w-3.5" />
              Patient Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  className={inp}
                  value={form.patientName}
                  onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                  placeholder="Patient's full name"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Age <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={130}
                  className={inp}
                  value={form.patientAge}
                  onChange={(e) => setForm((f) => ({ ...f, patientAge: e.target.value }))}
                  placeholder="e.g. 45"
                  required
                />
              </div>
            </div>
          </div>

          {/* Clinical details */}
          <div className="p-6 space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Ico d={icons.doc} cls="h-3.5 w-3.5" />
              Clinical Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Issued Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  className={inp}
                  value={form.issuedDate}
                  onChange={(e) => setForm((f) => ({ ...f, issuedDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Valid Until</label>
                <input
                  type="date"
                  className={inp}
                  value={form.validUntil}
                  min={form.issuedDate}
                  onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Diagnosis</label>
                <input
                  className={inp}
                  value={form.diagnosis}
                  onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
                  placeholder="e.g. Acute pharyngitis (J02.9)"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Clinical Notes</label>
                <textarea
                  rows={2}
                  className={`${inp} resize-none`}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes for pharmacist or patient…"
                />
              </div>
            </div>
          </div>

          {/* Medicines */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Ico d={icons.pill} cls="h-3.5 w-3.5" />
                Medicines ({medicines.length})
              </h3>
              <button
                type="button"
                onClick={addMed}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
              >
                <Ico d={icons.plus} cls="h-3.5 w-3.5" /> Add Medicine
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {medicines.map((med, i) => (
                <MedicineRow
                  key={i}
                  index={i}
                  med={med}
                  onChange={changeMed}
                  onRemove={removeMed}
                  canRemove={medicines.length > 1}
                />
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 px-6 py-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 transition"
            >
              {loading ? 'Saving prescription…' : 'Save Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Prescription Card ─────────────────────────────────────────────────────────

interface RxCardProps {
  rx:           Prescription;
  onView:       (rx: Prescription) => void;
  onComplete:   (rx: Prescription) => void;
  onDiscontinue:(rx: Prescription) => void;
  onDelete:     (rx: Prescription) => void;
  onPrint:      (rx: Prescription) => void;
}

const RxCard: React.FC<RxCardProps> = ({
  rx, onView, onComplete, onDiscontinue, onDelete, onPrint,
}) => {
  const cfg = statusConfig[rx.status ?? 'active'];
  const isActive = rx.status === 'active';

  return (
    <div className="group flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
      {/* Card top strip — status colour */}
      <div
        className={`h-1 rounded-t-2xl ${
          rx.status === 'active'
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            : rx.status === 'completed'
            ? 'bg-gradient-to-r from-blue-400 to-blue-500'
            : 'bg-gradient-to-r from-red-300 to-red-400'
        }`}
      />

      <div className="flex flex-1 flex-col p-5">
        {/* Patient + status row */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{rx.patientName}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Age {rx.patientAge}
              {rx.patientId ? ` · ${rx.patientId}` : ''}
            </p>
          </div>
          <Badge tone={cfg.tone}>{cfg.label}</Badge>
        </div>

        {/* Diagnosis */}
        {rx.diagnosis && (
          <p className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 line-clamp-2">
            {rx.diagnosis}
          </p>
        )}

        {/* Medicine pills */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {rx.medicines.slice(0, 3).map((m, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
            >
              {m.medicineName}
            </span>
          ))}
          {rx.medicines.length > 3 && (
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
              +{rx.medicines.length - 3} more
            </span>
          )}
        </div>

        {/* Dates */}
        <div className="mt-auto flex items-center gap-3 border-t border-slate-50 pt-3 text-xs text-slate-400">
          <span>Issued {fmtDate(rx.issuedDate)}</span>
          {rx.validUntil && <span>· Valid to {fmtDate(rx.validUntil)}</span>}
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex items-center gap-1">
          {/* View */}
          <button
            type="button"
            onClick={() => onView(rx)}
            title="View details"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            <Ico d={icons.eye} cls="h-3.5 w-3.5" />
            View
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={() => onPrint(rx)}
            title="Print prescription"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
          >
            <Ico d={icons.print} />
          </button>

          {/* Status actions — only active */}
          {isActive && (
            <>
              <button
                type="button"
                onClick={() => onComplete(rx)}
                title="Mark completed"
                className="rounded-xl p-2 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition"
              >
                <Ico d={icons.check} />
              </button>
              <button
                type="button"
                onClick={() => onDiscontinue(rx)}
                title="Discontinue"
                className="rounded-xl p-2 text-amber-500 hover:bg-amber-50 hover:text-amber-700 transition"
              >
                <Ico d={icons.ban} />
              </button>
            </>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(rx)}
            title="Delete prescription"
            className="rounded-xl p-2 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
          >
            <Ico d={icons.trash} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Detail Modal ──────────────────────────────────────────────────────────────

const DetailModal: React.FC<{
  rx:       Prescription | null;
  onClose:  () => void;
  onPrint:  (rx: Prescription) => void;
}> = ({ rx, onClose, onPrint }) => {
  if (!rx) return null;
  const cfg = statusConfig[rx.status ?? 'active'];

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto p-4 pt-10">
      <button className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} type="button" />
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">

        {/* Status strip */}
        <div className={`h-1.5 rounded-t-3xl ${
          rx.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
          rx.status === 'completed' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
          'bg-gradient-to-r from-red-300 to-red-400'
        }`} />

        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{rx.patientName}</h2>
              <Badge tone={cfg.tone}>{cfg.label}</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Age {rx.patientAge}
              {rx.patientId ? ` · ID: ${rx.patientId}` : ''}
              {' · '}Issued {fmtDate(rx.issuedDate)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { onClose(); onPrint(rx); }}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Print"
            >
              <Ico d={icons.print} cls="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"
            >
              <Ico d={icons.close} cls="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Diagnosis & notes */}
          {rx.diagnosis && (
            <div className="rounded-2xl bg-blue-50 px-4 py-3">
              <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-blue-400">Diagnosis</p>
              <p className="text-sm font-medium text-blue-900">{rx.diagnosis}</p>
            </div>
          )}

          {rx.validUntil && (
            <div>
              <p className="mb-0.5 text-xs font-semibold text-slate-400">Valid Until</p>
              <p className="text-sm text-slate-700">{fmtDate(rx.validUntil)}</p>
            </div>
          )}

          {rx.notes && (
            <div className="rounded-2xl bg-amber-50 px-4 py-3">
              <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-amber-400">Notes</p>
              <p className="text-sm text-amber-900">{rx.notes}</p>
            </div>
          )}

          {/* Medicines */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Medicines ({rx.medicines.length})
            </p>
            <div className="space-y-2">
              {rx.medicines.map((m, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{m.medicineName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {m.dosage} · {m.frequency} · {m.durationDays} day{m.durationDays !== 1 ? 's' : ''}
                    </p>
                    {m.instructions && (
                      <p className="mt-1.5 inline-flex rounded-lg bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                        {m.instructions}
                      </p>
                    )}
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

const PrintView: React.FC<{ rx: Prescription; onClose: () => void }> = ({ rx, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!ref.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Rx – ${rx.patientName}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; max-width: 680px; margin: auto; }
        h1 { font-size: 1.5rem; font-weight: 700; }
        .sub { color: #64748b; font-size: 0.85rem; margin: 6px 0 28px; }
        .label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
        .section { margin: 24px 0; }
        .info-row { display: flex; gap: 24px; flex-wrap: wrap; }
        .info-item { flex: 1; min-width: 120px; }
        .info-item p { font-size: 0.9rem; margin: 0; }
        .badge { display:inline-block; padding: 3px 12px; border-radius: 999px; font-size: 0.75rem;
          font-weight: 700; background: #d1fae5; color: #065f46; }
        .med { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }
        .med-name { font-weight: 700; font-size: 0.95rem; }
        .med-sub { font-size: 0.8rem; color: #64748b; margin-top: 3px; }
        .med-note { font-size: 0.78rem; color: #047857; background: #d1fae5; border-radius: 6px;
          padding: 2px 8px; display: inline-block; margin-top: 5px; }
        .footer { margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 16px;
          font-size: 0.72rem; color: #94a3b8; }
        @media print { body { padding: 16px; } }
      </style></head><body>${ref.current.innerHTML}
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-10">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <p className="text-sm font-semibold text-slate-700">Prescription Preview</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
            >
              <Ico d={icons.print} cls="h-3.5 w-3.5" /> Print / Save PDF
            </button>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition">
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
            <div className="info-row">
              <div className="info-item">
                <span className="label" style={{ display: 'block' }}>Full Name</span>
                <p style={{ fontWeight: 700 }}>{rx.patientName}</p>
              </div>
              <div className="info-item">
                <span className="label" style={{ display: 'block' }}>Age</span>
                <p>{rx.patientAge} years</p>
              </div>
              {rx.patientId && (
                <div className="info-item">
                  <span className="label" style={{ display: 'block' }}>Patient ID</span>
                  <p>{rx.patientId}</p>
                </div>
              )}
            </div>
            {rx.diagnosis && (
              <div style={{ marginTop: 12 }}>
                <span className="label" style={{ display: 'block' }}>Diagnosis</span>
                <p>{rx.diagnosis}</p>
              </div>
            )}
          </div>

          <div className="section">
            <div className="label">Prescribed Medicines</div>
            {rx.medicines.map((m, i) => (
              <div key={i} className="med">
                <p className="med-name">{i + 1}. {m.medicineName}</p>
                <p className="med-sub">
                  Dosage: {m.dosage} · Frequency: {m.frequency} · Duration: {m.durationDays} day{m.durationDays !== 1 ? 's' : ''}
                </p>
                {m.instructions && <span className="med-note">{m.instructions}</span>}
              </div>
            ))}
          </div>

          {rx.notes && (
            <div className="section">
              <div className="label">Notes</div>
              <p style={{ fontSize: '0.9rem' }}>{rx.notes}</p>
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

const ConfirmModal: React.FC<{
  state:     ConfirmState;
  onConfirm: () => void;
  onCancel:  () => void;
}> = ({ state, onConfirm, onCancel }) => {
  if (!state.open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} type="button" />
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900">{state.title}</h3>
        <p className="mt-2 text-sm text-slate-500">{state.message}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={state.loading}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={state.loading}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition ${
              state.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {state.loading ? 'Processing…' : state.label}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────

const ToastList: React.FC<{ toasts: Toast[]; onDismiss: (id: number) => void }> = ({
  toasts, onDismiss,
}) => (
  <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        onClick={() => onDismiss(t.id)}
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg cursor-pointer transition ${
          t.kind === 'success' ? 'bg-emerald-600' : 'bg-red-500'
        }`}
      >
        <span className="text-base">{t.kind === 'success' ? '✓' : '✕'}</span>
        {t.message}
      </div>
    ))}
  </div>
);

// ── Skeleton Card ─────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="mb-3 h-4 w-2/3 rounded-lg bg-slate-100" />
    <div className="mb-2 h-3 w-1/3 rounded-lg bg-slate-100" />
    <div className="mb-4 h-10 w-full rounded-xl bg-slate-100" />
    <div className="flex gap-2">
      {[...Array(3)].map((_, i) => <div key={i} className="h-6 w-16 rounded-lg bg-slate-100" />)}
    </div>
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string; value: number; color: string; bg: string; icon: string; loading?: boolean;
}> = ({ label, value, color, bg, icon, loading }) => (
  <div className={`flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm`}>
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${bg}`}>
      <Ico d={icon} cls={`h-5 w-5 ${color}`} />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      {loading
        ? <div className="mt-1 h-7 w-10 animate-pulse rounded-lg bg-slate-100" />
        : <p className={`text-2xl font-bold ${color}`}>{value}</p>}
    </div>
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
  const [createOpen,    setCreateOpen]    = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [detail,        setDetail]        = useState<Prescription | null>(null);
  const [printRx,       setPrintRx]       = useState<Prescription | null>(null);
  const [toasts,        setToasts]        = useState<Toast[]>([]);
  const [confirm,       setConfirm]       = useState<ConfirmState>(CONFIRM_CLOSED);

  // ── Toasts ──
  const toast = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  // ── Fetch ──
  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await prescriptionApi.getAll({
        status: filter === 'all' ? undefined : filter,
        limit: 100,
      });
      setPrescriptions(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load prescriptions.';
      setFetchError(msg);
      toast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => { fetchPrescriptions(); }, [fetchPrescriptions]);

  // ── Client-side search ──
  const filtered = search.trim()
    ? prescriptions.filter((rx) => {
        const q = search.toLowerCase();
        return (
          rx.patientName.toLowerCase().includes(q) ||
          (rx.diagnosis ?? '').toLowerCase().includes(q) ||
          rx.medicines.some((m) => m.medicineName.toLowerCase().includes(q))
        );
      })
    : prescriptions;

  // ── Counts ──
  const counts = {
    all:          total,
    active:       prescriptions.filter((r) => r.status === 'active').length,
    completed:    prescriptions.filter((r) => r.status === 'completed').length,
    discontinued: prescriptions.filter((r) => r.status === 'discontinued').length,
  };

  // ── Create ──
  const handleCreate = useCallback(async (payload: CreatePrescriptionPayload) => {
    setSaving(true);
    try {
      const created = await prescriptionApi.create(payload);
      setPrescriptions((p) => [created, ...p]);
      setTotal((t) => t + 1);
      setCreateOpen(false);
      toast('success', `Prescription for ${created.patientName} saved.`);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to save prescription.');
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // ── Discontinue ──
  const openDiscontinue = useCallback((rx: Prescription) => {
    const action = async () => {
      setConfirm((c) => ({ ...c, loading: true }));
      try {
        const updated = await prescriptionApi.discontinue(rx.id);
        setPrescriptions((p) => p.map((r) => r.id === updated.id ? updated : r));
        setConfirm(CONFIRM_CLOSED);
        toast('success', 'Prescription discontinued.');
      } catch (err) {
        setConfirm((c) => ({ ...c, loading: false }));
        toast('error', err instanceof Error ? err.message : 'Failed to discontinue.');
      }
    };
    setConfirm({
      open: true, danger: false, loading: false, label: 'Discontinue',
      title: 'Discontinue Prescription',
      message: `Stop ${rx.patientName}'s prescription? The record will be kept.`,
      action,
    });
  }, [toast]);

  // ── Complete ──
  const openComplete = useCallback((rx: Prescription) => {
    const action = async () => {
      setConfirm((c) => ({ ...c, loading: true }));
      try {
        const updated = await prescriptionApi.complete(rx.id);
        setPrescriptions((p) => p.map((r) => r.id === updated.id ? updated : r));
        setConfirm(CONFIRM_CLOSED);
        toast('success', 'Prescription marked as completed.');
      } catch (err) {
        setConfirm((c) => ({ ...c, loading: false }));
        toast('error', err instanceof Error ? err.message : 'Failed to mark as complete.');
      }
    };
    setConfirm({
      open: true, danger: false, loading: false, label: 'Mark Complete',
      title: 'Mark as Completed',
      message: `Mark ${rx.patientName}'s prescription as completed?`,
      action,
    });
  }, [toast]);

  // ── Delete ──
  const openDelete = useCallback((rx: Prescription) => {
    const action = async () => {
      setConfirm((c) => ({ ...c, loading: true }));
      try {
        await prescriptionApi.remove(rx.id);
        setPrescriptions((p) => p.filter((r) => r.id !== rx.id));
        setTotal((t) => Math.max(0, t - 1));
        setConfirm(CONFIRM_CLOSED);
        toast('success', 'Prescription deleted.');
      } catch (err) {
        setConfirm((c) => ({ ...c, loading: false }));
        toast('error', err instanceof Error ? err.message : 'Failed to delete.');
      }
    };
    setConfirm({
      open: true, danger: true, loading: false, label: 'Delete',
      title: 'Delete Prescription',
      message: `Permanently delete ${rx.patientName}'s prescription? This cannot be undone.`,
      action,
    });
  }, [toast]);

  // ── Tab config ──
  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',          label: `All (${counts.all})` },
    { key: 'active',       label: `Active (${counts.active})` },
    { key: 'completed',    label: `Completed (${counts.completed})` },
    { key: 'discontinued', label: `Discontinued (${counts.discontinued})` },
  ];

  // ── Render ──
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page header ── */}
      <div className="border-b border-slate-100 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {loading ? 'Loading…' : `${total} prescription${total !== 1 ? 's' : ''} on record`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchPrescriptions}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:shadow-md disabled:opacity-50 transition"
            >
              <Ico d={icons.refresh} />
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 hover:bg-emerald-700 transition"
            >
              <Ico d={icons.plus} />
              New Prescription
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* ── Stat cards ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total"        value={counts.all}          color="text-slate-700"   bg="bg-slate-100"   icon={icons.doc}   loading={loading} />
          <StatCard label="Active"       value={counts.active}       color="text-emerald-600" bg="bg-emerald-100" icon={icons.check}  loading={loading} />
          <StatCard label="Completed"    value={counts.completed}    color="text-blue-600"    bg="bg-blue-100"    icon={icons.pill}   loading={loading} />
          <StatCard label="Discontinued" value={counts.discontinued} color="text-red-500"     bg="bg-red-100"     icon={icons.ban}    loading={loading} />
        </div>

        {/* ── Filters + Search ── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-semibold transition ${
                  filter === key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative ml-auto w-full sm:w-64">
            <Ico d={icons.search} cls="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              type="search"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition"
              placeholder="Search name, diagnosis, medicine…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Error banner ── */}
        {fetchError && !loading && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-bold">Error:</span> {fetchError}
            <button
              type="button"
              onClick={fetchPrescriptions}
              className="ml-auto rounded-xl bg-red-100 px-3 py-1 text-xs font-semibold hover:bg-red-200 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Card grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-24 text-slate-400">
            <Ico d={icons.doc} cls="mb-3 h-12 w-12 opacity-30" />
            <p className="text-base font-semibold">No prescriptions found</p>
            <p className="mt-1 text-sm">
              {search
                ? 'Try a different search term.'
                : filter !== 'all'
                ? `No ${filter} prescriptions yet.`
                : 'Create your first prescription to get started.'}
            </p>
            {!search && filter === 'all' && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
              >
                <Ico d={icons.plus} /> New Prescription
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((rx) => (
              <RxCard
                key={rx.id}
                rx={rx}
                onView={setDetail}
                onComplete={openComplete}
                onDiscontinue={openDiscontinue}
                onDelete={openDelete}
                onPrint={setPrintRx}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <CreateModal
        open={createOpen}
        loading={saving}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <DetailModal
        rx={detail}
        onClose={() => setDetail(null)}
        onPrint={(rx) => { setDetail(null); setPrintRx(rx); }}
      />

      {printRx && (
        <PrintView rx={printRx} onClose={() => setPrintRx(null)} />
      )}

      <ConfirmModal
        state={confirm}
        onConfirm={confirm.action}
        onCancel={() => setConfirm(CONFIRM_CLOSED)}
      />

      <ToastList toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
};

export default PrescriptionPage;
