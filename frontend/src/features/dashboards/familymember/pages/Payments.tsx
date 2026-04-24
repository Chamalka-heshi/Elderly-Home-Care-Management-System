import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMyBookings } from '../../../../api/bookings/family-booking.api';
import type { Booking } from '../../../../api/bookings/booking.types';
import { createPayment, getMyPayments } from '../../../../api/payments/family-payment.api';
import type { Payment, PaymentStatus } from '../../../../api/payments/payment.types';
import { getMyAppointmentBookings } from '../../../../api/appointments/family-appointment-booking.api';
import type { AppointmentBooking } from '../../../../api/appointments/appointment-booking.types';
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

const Payments: React.FC<Props> = ({ addToast }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payingMethod, setPayingMethod] = useState<'card' | 'bank_transfer' | null>(null);
  const [showBankTransferDetails, setShowBankTransferDetails] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardPaid, setCardPaid] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    cvv: '',
  });
  const [cardFormErrors, setCardFormErrors] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    cvv: '',
  });
  const [checkoutNotice, setCheckoutNotice] = useState<
    | null
    | { kind: 'success'; title: string; message: string }
    | { kind: 'info'; title: string; message: string }
  >(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [appointment, setAppointment] = useState<AppointmentBooking | null>(null);
  const [myPayments, setMyPayments] = useState<Payment[]>([]);

  const search = new URLSearchParams(location.search);
  const bookingId = search.get('bookingId');
  const appointmentId = search.get('appointmentId');
  const isCheckoutPage = location.pathname.includes('/payments/checkout');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingsRes, paymentsRes, apptRes] = await Promise.all([
        getMyBookings(),
        getMyPayments(),
        isCheckoutPage && appointmentId ? getMyAppointmentBookings() : Promise.resolve([]),
      ]);

      setMyPayments(paymentsRes.payments ?? []);

      if (isCheckoutPage && bookingId) {
        const selectedBooking =
          (bookingsRes.bookings ?? []).find((item) => item.id === bookingId) ?? null;
        setBooking(selectedBooking);
        setAppointment(null);
      } else if (isCheckoutPage && appointmentId) {
        const selectedAppt =
          (apptRes ?? []).find((item) => item.id === appointmentId) ?? null;
        setAppointment(selectedAppt);
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
    paymentMethod: 'card' | 'bank_transfer',
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
      if (paymentMethod === 'card') {
        setShowBankTransferDetails(false);
        setCardPaid(true);
        setCheckoutNotice({
          kind: 'success',
          title: 'Payment Completed',
          message: 'Payment successful.',
        });
      } else {
        setCheckoutNotice({
          kind: 'info',
          title: 'Payment Pending Approval',
          message: 'Your bank transfer was submitted and is awaiting admin approval.',
        });
      }
      await loadData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPayingMethod(null);
    }
  };

  const handleCardInputChange = (
    field: 'cardNumber' | 'cardHolderName' | 'expiryDate' | 'cvv',
    value: string,
  ) => {
    setCardForm((prev) => ({ ...prev, [field]: value }));
    setCardFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateCardForm = () => {
    const errors = {
      cardNumber: cardForm.cardNumber.trim() ? '' : 'Card number is required.',
      cardHolderName: cardForm.cardHolderName.trim() ? '' : 'Card holder name is required.',
      expiryDate: cardForm.expiryDate.trim() ? '' : 'Expiry date is required.',
      cvv: cardForm.cvv.trim() ? '' : 'CVV is required.',
    };
    setCardFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleCardPayNow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validateCardForm()) {
      return;
    }
    await handleCreatePayment('card', e);
  };

  const summary = useMemo(() => {
    const total = myPayments.reduce((sum, item) => sum + Number(item.amount), 0);
    const paid = myPayments
      .filter((item) => item.status === 'paid')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const pending = myPayments
      .filter((item) => item.status !== 'paid')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return { total, paid, pending };
  }, [myPayments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (isCheckoutPage) {
    if ((bookingId && !booking) || (appointmentId && !appointment) || (!bookingId && !appointmentId)) {
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
            {bookingId ? 'Complete payment for your selected care plan.' : 'Complete payment for your appointment.'}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {checkoutNotice && (
            <div
              className={`mb-5 rounded-2xl border p-4 ${
                checkoutNotice.kind === 'success'
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <p
                className={`text-sm font-bold ${
                  checkoutNotice.kind === 'success' ? 'text-emerald-900' : 'text-amber-900'
                }`}
              >
                {checkoutNotice.title}
              </p>
              <p
                className={`mt-1 text-sm ${
                  checkoutNotice.kind === 'success' ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {checkoutNotice.message}
              </p>
              {checkoutNotice.kind === 'success' && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-900">
                  <span>Status:</span>
                  <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-extrabold text-emerald-800">
                    PAID
                  </span>
                </div>
              )}
            </div>
          )}

          {booking ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Care Plan
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {booking.carePlanSnapshot?.name ?? 'Care Plan'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {booking.carePlanSnapshot?.duration} {booking.carePlanSnapshot?.durationUnit}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Amount to Pay
                </p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-800">
                  LKR{' '}
                  {Number(booking.carePlanSnapshot?.price ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Appointment
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {appointment?.appointmentDate} · {appointment?.appointmentTime}
                </p>
                <p className="mt-1 text-sm text-slate-500">Patient ID: {appointment?.patientId}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Amount to Pay
                </p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-800">LKR 1,000.00</p>
              </div>
            </div>
          )}

          {!cardPaid && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCheckoutNotice(null);
                setShowBankTransferDetails(false);
                setShowCardForm(true);
              }}
              disabled={!!payingMethod}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
            >
              Pay by Card
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCheckoutNotice(null);
                setShowCardForm(false);
                setShowBankTransferDetails(true);
              }}
              disabled={!!payingMethod}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Bank Transfer
            </button>
            </div>
          )}

          {showCardForm && !cardPaid && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">Card payment details</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardForm.cardNumber}
                    onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                    className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-800 outline-none transition ${
                      cardFormErrors.cardNumber
                        ? 'border-red-300 focus:border-red-400'
                        : 'border-slate-300 focus:border-emerald-400'
                    }`}
                    placeholder="1234 5678 9012 3456"
                  />
                  {cardFormErrors.cardNumber && (
                    <p className="mt-1 text-xs text-red-600">{cardFormErrors.cardNumber}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Card Holder Name
                  </label>
                  <input
                    type="text"
                    value={cardForm.cardHolderName}
                    onChange={(e) => handleCardInputChange('cardHolderName', e.target.value)}
                    className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-800 outline-none transition ${
                      cardFormErrors.cardHolderName
                        ? 'border-red-300 focus:border-red-400'
                        : 'border-slate-300 focus:border-emerald-400'
                    }`}
                    placeholder="John Doe"
                  />
                  {cardFormErrors.cardHolderName && (
                    <p className="mt-1 text-xs text-red-600">{cardFormErrors.cardHolderName}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={cardForm.expiryDate}
                    onChange={(e) => handleCardInputChange('expiryDate', e.target.value)}
                    className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-800 outline-none transition ${
                      cardFormErrors.expiryDate
                        ? 'border-red-300 focus:border-red-400'
                        : 'border-slate-300 focus:border-emerald-400'
                    }`}
                    placeholder="MM/YY"
                  />
                  {cardFormErrors.expiryDate && (
                    <p className="mt-1 text-xs text-red-600">{cardFormErrors.expiryDate}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    CVV
                  </label>
                  <input
                    type="password"
                    value={cardForm.cvv}
                    onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                    className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-800 outline-none transition ${
                      cardFormErrors.cvv
                        ? 'border-red-300 focus:border-red-400'
                        : 'border-slate-300 focus:border-emerald-400'
                    }`}
                    placeholder="123"
                  />
                  {cardFormErrors.cvv && (
                    <p className="mt-1 text-xs text-red-600">{cardFormErrors.cvv}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCardPayNow}
                  disabled={!!payingMethod}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {payingMethod === 'card' ? 'Processing Card...' : 'Pay Now'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCardForm(false);
                    setCardFormErrors({
                      cardNumber: '',
                      cardHolderName: '',
                      expiryDate: '',
                      cvv: '',
                    });
                  }}
                  disabled={!!payingMethod}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showBankTransferDetails && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">Bank transfer details</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bank name
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">Commercial Bank</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Account number
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">123-456-7890</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Instructions
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Transfer the amount shown above. After transferring, click{' '}
                  <span className="font-semibold">Confirm Payment</span>.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={(e) => handleCreatePayment('bank_transfer', e)}
                  disabled={!!payingMethod}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {payingMethod === 'bank_transfer'
                    ? 'Confirming...'
                    : 'Confirm Bank Payment'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowBankTransferDetails(false);
                    setCheckoutNotice(null);
                  }}
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

  return (
    <div className="space-y-6">
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

      <TableShell title="Payment History" subtitle="Track your booking payments and statuses.">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Payment ID</th>
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myPayments.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{item.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {item.bookingId ?? item.appointmentId ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    LKR {Number(item.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(item.createdAt).toLocaleString()}
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
