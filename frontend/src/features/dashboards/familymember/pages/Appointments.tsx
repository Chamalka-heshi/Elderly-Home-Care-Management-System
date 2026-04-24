import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPatients } from '../../../../api/patients/family-patient.api';
import type { Patient } from '../../../../api/patients/patient.types';
import {
  createAppointmentBooking,
  getMyAppointmentBookings,
} from '../../../../api/appointments/family-appointment-booking.api';
import type {
  AppointmentBooking,
  AppointmentBookingStatus,
} from '../../../../api/appointments/appointment-booking.types';

const inputCls =
  'w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10';

const toneForStatus = (status: AppointmentBookingStatus) => {
  if (status === 'confirmed') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  if (status === 'cancelled') return 'bg-red-50 text-red-700 ring-red-100';
  return 'bg-amber-50 text-amber-700 ring-amber-100';
};

const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'book' | 'mine'>('book');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [myAppointments, setMyAppointments] = useState<AppointmentBooking[]>([]);

  const [patientId, setPatientId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);

  const patientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of patients) map.set(p.id, p.fullName);
    return map;
  }, [patients]);

  const showToast = (kind: 'success' | 'error', msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [patientsRes, apptRes] = await Promise.all([
          getMyPatients(),
          getMyAppointmentBookings(),
        ]);

        const activePats = (patientsRes.patients ?? []).filter((p) => p.isActive);
        setPatients(activePats);
        if (activePats.length > 0) setPatientId(activePats[0].id);

        setMyAppointments(Array.isArray(apptRes) ? apptRes : []);

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        setAppointmentDate(`${yyyy}-${mm}-${dd}`);
      } catch (err: any) {
        showToast('error', err?.message ?? 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleBook = async (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    const pid = patientId.trim();
    const date = appointmentDate.trim();
    const time = appointmentTime.trim();

    // eslint-disable-next-line no-console
    console.log('appointment booking values:', pid, date, time);

    if (!pid || !date || !time) {
      showToast('error', 'Please select patient, date, and time.');
      return;
    }

    try {
      setBookingLoading(true);
      const res = await createAppointmentBooking({
        patientId: pid,
        appointmentDate: date,
        appointmentTime: time,
      });
      showToast('success', res.message || 'Appointment booked successfully');
      navigate(`/family/payments/checkout?appointmentId=${encodeURIComponent(res.appointment.id)}`);
    } catch (err: any) {
      showToast('error', err?.message ?? 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={[
            'fixed right-4 top-4 z-[100] flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-xl',
            toast.kind === 'success' ? 'bg-emerald-600' : 'bg-red-600',
          ].join(' ')}
        >
          {toast.kind === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
        <p className="text-sm text-slate-500">Book an appointment and complete payment.</p>
      </div>

      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 w-fit">
        {(['book', 'mine'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'rounded-xl px-5 py-2 text-sm font-semibold transition',
              tab === t ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100',
            ].join(' ')}
          >
            {t === 'book' ? '📅 Book Appointment' : '📋 My Appointments'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
        </div>
      ) : tab === 'book' ? (
        <div className="space-y-5">
          <form
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={handleBook}
          >
            <p className="text-sm font-bold text-slate-900">Book Appointment</p>
            <p className="mt-1 text-xs text-slate-500">
              Your appointment is created in <span className="font-semibold">pending_payment</span>{' '}
              status.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Patient
                </label>
                {patients.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No active patients found. Please add a patient in <strong>Elderly Profile</strong>{' '}
                    first.
                  </p>
                ) : (
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className={inputCls}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} — NIC: {p.nic}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Time</label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Price
                </p>
                <p className="mt-1 font-extrabold text-emerald-800">LKR 1,000.00</p>
              </div>

              <button
                type="submit"
                disabled={bookingLoading || patients.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {bookingLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {bookingLoading ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          {myAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-3xl">
                📋
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-600">No appointments yet</p>
              <button
                type="button"
                onClick={() => setTab('book')}
                className="mt-3 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
              >
                Book Your First Appointment
              </button>
            </div>
          ) : (
            myAppointments.map((appt) => (
              <div key={appt.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {patientNameById.get(appt.patientId) ?? 'Patient'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(`${appt.appointmentDate}T00:00:00`).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      · {appt.appointmentTime}
                    </p>
                  </div>
                  <span
                    className={[
                      'rounded-full px-3 py-0.5 text-[11px] font-semibold ring-1',
                      toneForStatus(appt.status),
                    ].join(' ')}
                  >
                    {appt.status.toUpperCase()}
                  </span>
                </div>

                {appt.status === 'pending_payment' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/family/payments/checkout?appointmentId=${encodeURIComponent(appt.id)}`,
                        )
                      }
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-700"
                    >
                      Pay Now
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Appointments;

