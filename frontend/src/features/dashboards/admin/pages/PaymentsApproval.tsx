import React, { useCallback, useEffect, useState } from 'react';
import {
  approvePayment,
  getPendingPayments,
  rejectPayment,
} from '../../../../api/payments/admin-payment.api';
import type { Payment, PaymentStatus } from '../../../../api/payments/payment.types';
import TableShell from '../../common/widgets/TableShell';
import Badge from '../../common/widgets/Badge';
import { IconCheck, IconCurrency, IconX } from '../../common/icons';
import { useAuth } from '../../../../auth/AuthContext';

interface Props {
  addToast: (kind: 'success' | 'error', message: string) => void;
}

const PaymentsApproval: React.FC<Props> = ({ addToast }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const canManagePayments = user?.role === 'admin' || user?.role === 'super_admin';

  const loadPayments = useCallback(async () => {
    if (!canManagePayments) return;

    try {
      setLoading(true);
      const data = await getPendingPayments();
      setPayments(data.payments);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [addToast, canManagePayments]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleApprove = async (paymentId: string) => {
    try {
      setProcessingId(paymentId);
      const res = await approvePayment(paymentId);
      addToast('success', res.message || 'Payment approved successfully');
      await loadPayments();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to approve payment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    try {
      setProcessingId(paymentId);
      const res = await rejectPayment(paymentId);
      addToast('success', res.message || 'Payment rejected successfully');
      await loadPayments();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to reject payment');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusTone = (status: PaymentStatus) => {
    if (status === 'paid') return 'emerald';
    if (status === 'rejected') return 'red';
    return 'amber';
  };

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (!canManagePayments) {
    return (
      <TableShell
        title="Payments Management"
        subtitle="Approve or reject family bank transfer payments."
      >
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-red-700">Access Denied</p>
          <p className="mt-1 text-xs text-red-600">
            Only Admin or Super Admin users can access this page.
          </p>
        </div>
      </TableShell>
    );
  }

  return (
    <TableShell
      title="Payments Management"
      subtitle="Review pending bank transfer payments and take action."
      right={
        <button
          onClick={loadPayments}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Refresh
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Payment ID</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => {
                const isPendingApproval = payment.status === 'pending_approval';
                const isProcessing = processingId === payment.id;

                return (
                  <tr key={payment.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">{payment.id}</td>
                    <td className="px-4 py-3 text-slate-600">{payment.userId}</td>
                    <td className="px-4 py-3 text-slate-600">{payment.bookingId}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                        <IconCurrency className="h-4 w-4 text-emerald-600" />
                        {Number(payment.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{payment.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <Badge tone={getStatusTone(payment.status)}>
                        {payment.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(payment.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(payment.id)}
                          disabled={!isPendingApproval || isProcessing}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <IconCheck className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(payment.id)}
                          disabled={!isPendingApproval || isProcessing}
                          className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <IconX className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                    No pending payments to review.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </TableShell>
  );
};

export default PaymentsApproval;
