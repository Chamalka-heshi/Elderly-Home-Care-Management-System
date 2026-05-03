import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllPayments,
  approvePayment,
  rejectPayment,
} from '../../../../api/payments/admin-payment.api';
import type { Payment, PaymentStatus } from '../../../../api/payments/payment.types';
import { IconCheck, IconCurrency, IconX, IconFilter, IconRefresh, IconSpinner } from '../../common/icons';
import { useAuth } from '../../../../auth/AuthContext';

// Formats date and time for the table
const fmtDT = (v: string) =>
  new Date(v).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// Formats numbers as LKR currency (e.g. LKR 1,000.00)
const fmtLKR = (n: number) =>
  new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 }).format(n);

// Label and color settings for different payment statuses
const STATUS_CONFIG: Record<PaymentStatus, { label: string; cls: string; dot: string }> = {
  paid: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-100', dot: 'bg-emerald-500' },
  pending_approval: { label: 'Pending Approval', cls: 'bg-amber-50 text-amber-700 ring-amber-100', dot: 'bg-amber-400 animate-pulse' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 ring-red-100', dot: 'bg-red-400' },
  pending: { label: 'Pending', cls: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
};

// StatusBadge
// Shows the current status of a payment with a colored dot
const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// MethodBadge
// Shows if payment was via bank transfer or card
const MethodBadge: React.FC<{ method: string }> = ({ method }) =>
  method === 'bank_transfer' ? (
    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
      🏦 Bank Transfer
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
      💳 Card
    </span>
  );

// TypeBadge
// Shows if the payment is for an appointment or a care plan
const TypeBadge: React.FC<{ payment: Payment }> = ({ payment }) =>
  payment.appointmentId ? (
    <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
      🩺 Doctor Appointment
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
      🏠 Care Plan
    </span>
  );

interface ConfirmModalProps {
  action: 'approve' | 'reject';
  payerName: string;
  amount: number;
  onConfirm: () => void;
  onClose: () => void;
}

// ConfirmModal
// Popup to ask for confirmation before approving or rejecting a payment
const ConfirmModal: React.FC<ConfirmModalProps> = ({ action, payerName, amount, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
      <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${action === 'approve' ? 'bg-emerald-100' : 'bg-red-100'}`}>
        {action === 'approve'
          ? <IconCheck className="h-6 w-6 text-emerald-600" />
          : <IconX className="h-6 w-6 text-red-600" />}
      </div>
      <h3 className="text-sm font-bold text-slate-800">
        {action === 'approve' ? 'Approve Payment' : 'Reject Payment'}
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        {action === 'approve'
          ? <>Confirm <span className="font-semibold text-slate-700">{fmtLKR(amount)}</span> bank transfer from <span className="font-semibold text-slate-700">{payerName}</span>? The linked appointment or care plan will be activated.</>
          : <>Reject this payment from <span className="font-semibold text-slate-700">{payerName}</span>? The linked appointment or booking will be cancelled.</>}
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm ${action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            }`}
        >
          {action === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
        </button>
      </div>
    </div>
  </div>
);

// PaymentDrawer
// Side panel that shows all details for a single payment
const PaymentDrawer: React.FC<{ payment: Payment; onClose: () => void }> = ({ payment, onClose }) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-end bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
    <div
      className="flex h-full w-full max-w-md flex-col overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur px-6 py-4">
        <h3 className="text-sm font-bold text-slate-800">Payment Details</h3>
        <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
          <IconX className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-4 p-6">
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 text-center">
          <p className="text-xs font-semibold text-slate-500">Amount</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">{fmtLKR(Number(payment.amount))}</p>
          <div className="mt-2.5 flex items-center justify-center gap-2">
            <StatusBadge status={payment.status} />
            <MethodBadge method={payment.paymentMethod} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paid By (Family Member)</p>
          <p className="mt-1.5 text-sm font-bold text-slate-800">{payment.user?.user?.fullName ?? '—'}</p>
          <p className="text-xs text-slate-500">{payment.user?.user?.email ?? ''}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment For</p>
          <div className="mt-1.5">
            <TypeBadge payment={payment} />
          </div>
          {payment.appointment && (
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              {payment.appointment.patient?.fullName && (
                <p>Patient: <span className="font-semibold">{payment.appointment.patient.fullName}</span></p>
              )}
              {payment.appointment.slot?.doctor?.user?.fullName && (
                <p>Doctor: <span className="font-semibold">{payment.appointment.slot.doctor.user.fullName}</span>
                  {payment.appointment.slot.doctor.specialization && (
                    <span className="ml-1 text-slate-400">({payment.appointment.slot.doctor.specialization})</span>
                  )}
                </p>
              )}
              {payment.appointment.slot?.date && (
                <p>Slot date: <span className="font-semibold">{payment.appointment.slot.date}</span></p>
              )}
              <p className="text-slate-400 font-mono text-[10px] break-all">Appt ID: {payment.appointmentId}</p>
            </div>
          )}
          {payment.booking && (
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              {payment.booking.carePlanSnapshot?.name && (
                <p>Plan: <span className="font-semibold">{payment.booking.carePlanSnapshot.name}</span></p>
              )}
              {payment.booking.carePlanSnapshot?.duration != null && (
                <p>Duration: <span className="font-semibold">
                  {payment.booking.carePlanSnapshot.duration} {payment.booking.carePlanSnapshot.durationUnit}
                </span></p>
              )}
              <p className="text-slate-400 font-mono text-[10px] break-all">Booking ID: {payment.bookingId}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-400">Created</p>
            <p>{fmtDT(payment.createdAt)}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-400">Last Updated</p>
            <p>{fmtDT(payment.updatedAt)}</p>
          </div>
          <div className="col-span-2">
            <p className="font-semibold text-slate-400">Payment ID</p>
            <p className="break-all font-mono text-[10px]">{payment.id}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface Props {
  addToast: (kind: 'success' | 'error', message: string) => void;
}

// PaymentsManagement
// Main page for admins to view and manage all money transactions
const PaymentsManagement: React.FC<Props> = ({ addToast }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'' | PaymentStatus>('');
  const [filterMethod, setFilterMethod] = useState<'' | 'card' | 'bank_transfer'>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string; action: 'approve' | 'reject'; payerName: string; amount: number;
  } | null>(null);

  const canManage = user?.role === 'admin' || user?.role === 'super_admin';

  // Loads all payments from the database
  const load = useCallback(async () => {
    if (!canManage) return;
    try {
      setLoading(true);
      const data = await getAllPayments();
      setPayments(data.payments);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [addToast, canManage]);

  useEffect(() => { load(); }, [load]);

  // Calculates summary stats like total revenue and pending counts
  const stats = useMemo(() => {
    const all = payments;
    const pendingApproval = all.filter(p => p.status === 'pending_approval');
    const paid = all.filter(p => p.status === 'paid');
    const rejected = all.filter(p => p.status === 'rejected');
    const totalRevenue = paid.reduce((s, p) => s + Number(p.amount), 0);
    const pendingValue = pendingApproval.reduce((s, p) => s + Number(p.amount), 0);
    const bankTransfers = all.filter(p => p.paymentMethod === 'bank_transfer');
    const cards = all.filter(p => p.paymentMethod === 'card');
    return {
      total: all.length, pendingApproval: pendingApproval.length,
      paid: paid.length, rejected: rejected.length,
      totalRevenue, pendingValue,
      bankTransfers: bankTransfers.length, cards: cards.length,
    };
  }, [payments]);

  const displayed = useMemo(() => {
    return payments.filter(p => {
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterMethod && p.paymentMethod !== filterMethod) return false;
      return true;
    });
  }, [payments, filterStatus, filterMethod]);

  // Processes the approval or rejection of a payment
  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { id, action } = confirmAction;
    try {
      setProcessingId(id);
      if (action === 'approve') {
        const res = await approvePayment(id);
        addToast('success', res.message || 'Payment approved successfully');
      } else {
        const res = await rejectPayment(id);
        addToast('success', res.message || 'Payment rejected');
      }
      await load();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Action failed');
    } finally {
      setProcessingId(null);
      setConfirmAction(null);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
        <p className="text-sm font-semibold text-red-700">Access Denied</p>
        <p className="mt-1 text-xs text-red-600">Only Admin or Super Admin users can access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Full payment history across all appointments and care-plan bookings — approve pending bank transfers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <IconRefresh className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <IconFilter /> Filters {showFilters ? '▲' : '▼'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Revenue Collected</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{fmtLKR(stats.totalRevenue)}</p>
          <p className="mt-1 text-xs text-slate-400">{stats.paid} paid transactions</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 shadow-sm">
          <p className="text-xs font-semibold text-amber-600">Pending Approval</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{fmtLKR(stats.pendingValue)}</p>
          <p className="mt-1 text-xs text-amber-500">{stats.pendingApproval} bank transfers awaiting</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">By Method</p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">🏦 Bank Transfer</span>
              <span className="font-bold text-slate-800">{stats.bankTransfers}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">💳 Card</span>
              <span className="font-bold text-slate-800">{stats.cards}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Transaction Breakdown</p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-600">✓ Paid</span>
              <span className="font-bold text-slate-800">{stats.paid}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-500">✗ Rejected</span>
              <span className="font-bold text-slate-800">{stats.rejected}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Total</span>
              <span className="font-bold text-slate-800">{stats.total}</span>
            </div>
          </div>
        </div>
      </div>

      {stats.pendingApproval > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white text-sm font-bold">
            {stats.pendingApproval}
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {stats.pendingApproval} bank transfer{stats.pendingApproval > 1 ? 's' : ''} awaiting your approval
            </p>
            <p className="text-xs text-amber-600">
              Total value: {fmtLKR(stats.pendingValue)} — review and approve or reject below
            </p>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="flex flex-wrap gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as '' | PaymentStatus)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="">All Statuses</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Payment Method</label>
            <select
              value={filterMethod}
              onChange={e => setFilterMethod(e.target.value as '' | 'card' | 'bank_transfer')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="">All Methods</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
            </select>
          </div>
          {(filterStatus || filterMethod) && (
            <div className="flex items-end">
              <button
                onClick={() => { setFilterStatus(''); setFilterMethod(''); }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-800">
            All Payment Transactions
            {stats.pendingApproval > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {stats.pendingApproval}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500">{displayed.length} of {payments.length} records · Click a row for full details</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <IconSpinner className="h-10 w-10 text-emerald-500" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-2xl">💰</div>
            <p className="mt-4 text-sm font-semibold text-slate-600">No payments found</p>
            <p className="mt-1 text-xs text-slate-400">Payment records will appear here once families make transactions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">Payer</th>
                  <th className="px-5 py-3">Payment For</th>
                  <th className="px-5 py-3">Amount (LKR)</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map(payment => {
                  const isPendingApproval = payment.status === 'pending_approval';
                  const isProcessing = processingId === payment.id;

                  const payerName = payment.user?.user?.fullName ?? '—';
                  const payerEmail = payment.user?.user?.email ?? '';
                  const patientName = payment.appointment?.patient?.fullName
                    ?? payment.booking?.patient?.fullName ?? null;
                  const doctorName = payment.appointment?.slot?.doctor?.user?.fullName ?? null;
                  const planName = payment.booking?.carePlanSnapshot?.name ?? null;

                  return (
                    <tr
                      key={payment.id}
                      onClick={() => setSelectedPayment(payment)}
                      className={`cursor-pointer transition hover:bg-emerald-50/40 ${isPendingApproval ? 'bg-amber-50/30' : ''
                        }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-50 text-base">
                            👤
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{payerName}</p>
                            <p className="text-xs text-slate-400">{payerEmail}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <TypeBadge payment={payment} />
                        {patientName && (
                          <p className="mt-1 text-xs font-medium text-slate-700">Patient: {patientName}</p>
                        )}
                        {doctorName && (
                          <p className="text-xs text-slate-400">Dr. {doctorName}</p>
                        )}
                        {planName && (
                          <p className="text-xs text-slate-500">{planName}</p>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-base font-bold text-slate-800">
                          <IconCurrency className="h-4 w-4 text-emerald-600" />
                          {Number(payment.amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <MethodBadge method={payment.paymentMethod} />
                      </td>

                      <td className="px-5 py-3.5">
                        <StatusBadge status={payment.status} />
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        <p>{new Date(payment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p className="text-slate-400">{new Date(payment.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>

                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {isPendingApproval && (
                            <>
                              <button
                                onClick={() => setConfirmAction({
                                  id: payment.id, action: 'approve',
                                  payerName, amount: Number(payment.amount),
                                })}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <IconCheck className="h-3.5 w-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => setConfirmAction({
                                  id: payment.id, action: 'reject',
                                  payerName, amount: Number(payment.amount),
                                })}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <IconX className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            </>
                          )}
                          {!isPendingApproval && (
                            <span className="text-xs text-slate-400 italic">
                              {payment.status === 'paid' ? 'Processed' : payment.status === 'rejected' ? 'Rejected' : 'Auto-processed'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPayment && (
        <PaymentDrawer payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}

      {confirmAction && (
        <ConfirmModal
          action={confirmAction.action}
          payerName={confirmAction.payerName}
          amount={confirmAction.amount}
          onConfirm={handleConfirm}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};

export default PaymentsManagement;
