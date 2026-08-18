/**
 * src/features/dashboards/familymember/pages/Payments.tsx
 * ─────────────────────────────────────────────────────────
 * Family member payments page.
 *
 * Handles two modes:
 *   1. /family/payments           → payment history list
 *   2. /family/payments/checkout  → checkout for a booking or appointment
 *
 * Checkout query params:
 *   ?bookingId=<uuid>       → care-plan booking payment
 *   ?appointmentId=<uuid>   → doctor appointment payment
 *
 * FIXED: appointment checkout now uses the real Appointment entity
 * (slot + patient + doctor info) instead of the removed AppointmentBooking.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMyBookings } from '../../../../api/bookings/family-booking.api';
import type { Booking } from '../../../../api/bookings/booking.types';
import { createPayment, getMyPayments, initiatePayHerePayment } from '../../../../api/payments/family-payment.api';
import type { Payment, PaymentStatus, PayHereCheckoutResponse } from '../../../../api/payments/payment.types';
import { getMyAppointments } from '../../../../api/appointment/appointment.api';
import type { Appointment } from '../../../../api/appointment/appointment.types';
import {
  fmt12,
  fmtDate as fmtApptDate,
} from '../../../../api/appointment/appointment.types';
import { fmtDateShort } from '../../../../utils/dateTime';
import Badge from '../../common/widgets/Badge';
import TableShell from '../../common/widgets/TableShell';

interface Props {
  addToast: (kind: 'success' | 'error', message: string) => void;
}

const toneForStatus = (status: PaymentStatus) => {
  if (status === 'paid') return 'emerald';
  if (status === 'pending_approval') return 'amber';
  if (status === 'rejected') return 'red';
  return 'slate';
};

const submitPayHereCheckout = (
  checkout: PayHereCheckoutResponse['checkout'],
): void => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action =
    import.meta.env.VITE_PAYHERE_CHECKOUT_URL ||
    'https://sandbox.payhere.lk/pay/checkout';

  Object.entries(checkout).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

const Payments: React.FC<Props> = ({ addToast }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [payingMethod, setPayingMethod] = useState<'card' | 'bank_transfer' | null>(null);
  const [showBankTransferDetails, setShowBankTransferDetails] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState<
    | null
    | { kind: 'success'; title: string; message: string }
    | { kind: 'info'; title: string; message: string }
  >(null);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [myPayments, setMyPayments] = useState<Payment[]>([]);

  const search = new URLSearchParams(location.search);
  const bookingId = search.get('bookingId');
  const appointmentId = search.get('appointmentId');
  const isCheckoutPage = location.pathname.includes('/payments/checkout');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [bookingsRes, paymentsRes, appointmentsRes] = await Promise.all([
        getMyBookings(),
        getMyPayments(),
        // Only fetch appointments when we need them (checkout with appointmentId, or history)
        getMyAppointments().catch(() => [] as Appointment[]),
      ]);

      setMyPayments(paymentsRes.payments ?? []);

      if (isCheckoutPage && bookingId) {
        const selected = (bookingsRes.bookings ?? []).find((b) => b.id === bookingId) ?? null;
        setBooking(selected);
        setAppointment(null);
      } else if (isCheckoutPage && appointmentId) {
        // Use the real Appointment entity — has slot, patient, doctor info
        const appts = Array.isArray(appointmentsRes) ? appointmentsRes : [];
        const selected = appts.find((a) => a.id === appointmentId) ?? null;
        setAppointment(selected);
        setBooking(null);
      } else {
        setBooking(null);
        setAppointment(null);
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [addToast, bookingId, appointmentId, isCheckoutPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePayment = async (
    paymentMethod: 'bank_transfer',
    e?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!bookingId && !appointmentId) {
      addToast('error', 'Missing checkout id.');
      return;
    }

    try {
      setPayingMethod(paymentMethod);
      const res = await createPayment({
        bookingId: bookingId ?? undefined,
        appointmentId: appointmentId ?? undefined,
        paymentMethod,
      });
      addToast('success', res.message || 'Payment processed successfully');

      setCheckoutNotice({
        kind: 'info',
        title: 'Bank Transfer Submitted',
        message: 'Your bank transfer is awaiting admin approval. You will be notified once approved.',
      });
      await loadData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPayingMethod(null);
    }
  };

  const handlePayHerePayment = async (
    e?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!bookingId && !appointmentId) {
      addToast('error', 'Missing checkout id.');
      return;
    }

    try {
      setPayingMethod('card');
      const res = await initiatePayHerePayment({
        bookingId: bookingId ?? undefined,
        appointmentId: appointmentId ?? undefined,
      });
      submitPayHereCheckout(res.checkout);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to start PayHere checkout');
      setPayingMethod(null);
    }
  };

  const summary = useMemo(() => {
    const total = myPayments.reduce((s, p) => s + Number(p.amount), 0);
    const paid = myPayments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
    const pending = myPayments.filter((p) => p.status !== 'paid').reduce((s, p) => s + Number(p.amount), 0);
    return { total, paid, pending };
  }, [myPayments]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  // ── Checkout page ──────────────────────────────────────────────────────────
  if (isCheckoutPage) {
    const checkoutNotFound =
      (bookingId && !booking) || (appointmentId && !appointment) || (!bookingId && !appointmentId);

    if (checkoutNotFound) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm font-semibold text-slate-700">Checkout item not found.</p>
          <button
            type="button"
            onClick={() => navigate('/family/payments')}
            className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Payments
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Checkout</h1>
          <p className="text-sm text-slate-500">
            {bookingId
              ? 'Complete payment for your selected care plan.'
              : 'Complete payment to confirm your doctor appointment.'}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          {/* Notice banner (success / info) */}
          {checkoutNotice && (
            <div className={`mb-5 rounded-2xl border p-4 ${checkoutNotice.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-amber-200 bg-amber-50'
              }`}>
              <p className={`text-sm font-bold ${checkoutNotice.kind === 'success' ? 'text-emerald-900' : 'text-amber-900'
                }`}>
                {checkoutNotice.title}
              </p>
              <p className={`mt-1 text-sm ${checkoutNotice.kind === 'success' ? 'text-emerald-800' : 'text-amber-800'
                }`}>
                {checkoutNotice.message}
              </p>
              {checkoutNotice.kind === 'success' && (
                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-900">
                    <span>Status:</span>
                    <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-extrabold text-emerald-800">
                      PAID
                    </span>
                  </div>
                  {appointmentId && (
                    <button
                      type="button"
                      onClick={() => navigate('/family/appointments')}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      View Appointments →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Care-plan booking summary ── */}
          {booking && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Care Plan</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {booking.carePlanSnapshot?.name ?? 'Care Plan'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {booking.carePlanSnapshot?.duration} {booking.carePlanSnapshot?.durationUnit}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Amount to Pay</p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-800">
                  LKR {Number(booking.carePlanSnapshot?.price ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2, maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          )}

          {/* ── Appointment summary (FIXED — uses real Appointment entity) ── */}
          {appointment && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Appointment Details</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Patient</span>
                    <span className="font-semibold text-slate-800">{appointment.patient?.fullName ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Doctor</span>
                    <span className="font-semibold text-slate-800">
                      {appointment.slot?.doctor?.user?.fullName
                        ? `Dr. ${appointment.slot.doctor.user.fullName}`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Specialization</span>
                    <span className="font-semibold text-slate-800">
                      {appointment.slot?.doctor?.specialization ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date</span>
                    <span className="font-semibold text-slate-800">
                      {fmtApptDate(appointment.slot?.date ?? '')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time</span>
                    <span className="font-semibold text-slate-800">
                      {fmt12(appointment.slot?.startTime ?? '')} – {fmt12(appointment.slot?.endTime ?? '')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Amount to Pay</p>
                {(() => {
                  const consultFee = Number(appointment.slot?.consultationFee ?? 0);
                  const careHomeFee = Number(appointment.slot?.careHomeFee ?? 0);
                  const total = consultFee + careHomeFee;
                  return (
                    <>
                      <p className="mt-1 text-2xl font-extrabold text-emerald-800">
                        LKR {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {(consultFee > 0 || careHomeFee > 0) && (
                        <div className="mt-2 space-y-0.5 text-xs text-emerald-700">
                          {consultFee > 0 && (
                            <p>Doctor fee: LKR {consultFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          )}
                          {careHomeFee > 0 && (
                            <p>Care-home fee: LKR {careHomeFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          )}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-emerald-600">
                        Your appointment will be ready for the doctor once payment is confirmed.
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ── Payment method buttons ── */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => { setCheckoutNotice(null); setShowBankTransferDetails(false); setShowCardForm(true); }}
                disabled={!!payingMethod}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
              >
                💳 Pay by Card
              </button>
              <button
                type="button"
                onClick={() => { setCheckoutNotice(null); setShowCardForm(false); setShowBankTransferDetails(true); }}
                disabled={!!payingMethod}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
              >
                🏦 Bank Transfer
              </button>
          </div>

          {/* ── PayHere card checkout ── */}
          {showCardForm && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">Card payment via PayHere</p>
              <p className="mt-2 text-sm text-slate-600">
                You will be redirected to PayHere to complete your card payment securely.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handlePayHerePayment}
                  disabled={!!payingMethod}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {payingMethod === 'card' ? 'Redirecting…' : 'Pay Now'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCardForm(false)}
                  disabled={!!payingMethod}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Bank transfer details ── */}
          {showBankTransferDetails && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">Bank transfer details</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bank name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">Commercial Bank</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account number</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">123-456-7890</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Instructions</p>
                <p className="mt-1 text-sm text-slate-700">
                  Transfer the amount shown above, then click <span className="font-semibold">Confirm Transfer</span>.
                  An admin will approve your bank transfer, then the doctor can issue a prescription at your slot.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={(e) => handleCreatePayment('bank_transfer', e)}
                  disabled={!!payingMethod}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {payingMethod === 'bank_transfer' ? 'Confirming…' : 'Confirm Transfer'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowBankTransferDetails(false); setCheckoutNotice(null); }}
                  disabled={!!payingMethod}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Payment history list ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">
            LKR {summary.total.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Paid</p>
          <p className="mt-1 text-xl font-extrabold text-emerald-800">
            LKR {summary.paid.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending</p>
          <p className="mt-1 text-xl font-extrabold text-amber-800">
            LKR {summary.pending.toLocaleString()}
          </p>
        </div>
      </div>

      <TableShell title="Payment History" subtitle="Track your booking and appointment payments.">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Payment ID</th>
                <th className="px-4 py-3">For</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myPayments.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{item.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {item.appointmentId
                      ? <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">🩺 Appointment</span>
                      : item.bookingId
                        ? <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">📋 Care Plan</span>
                        : '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    LKR {Number(item.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{item.paymentMethod.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {fmtDateShort(item.createdAt)}
                  </td>
                </tr>
              ))}
              {myPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
};

export default Payments;