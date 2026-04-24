import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveCarePlans } from '../../../../api/care-plans/family-care-plan.api';
import type { CarePlan } from '../../../../api/care-plans/care-plan.types';
import { createBooking } from '../../../../api/bookings/family-booking.api';
import { getMyPatients } from '../../../../api/patients/family-patient.api';
import type { Patient } from '../../../../api/patients/patient.types';
import { useAuth } from '../../../../auth/AuthContext';
import Badge from '../../common/widgets/Badge';
import { IconCurrency, IconHeart } from '../../common/icons';
import { parseChecklist } from '../../common/utils/parseChecklist';

interface Props {
  addToast: (kind: 'success' | 'error', message: string) => void;
}

const CarePlans: React.FC<Props> = ({ addToast }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<CarePlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingForPlanId, setCreatingForPlanId] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const [plansData, patientsRes] = await Promise.all([
        getActiveCarePlans(),
        getMyPatients(),
      ]);
      const activePatients = (patientsRes.patients ?? []).filter((p) => p.isActive);
      setPatients(activePatients);
      if (activePatients.length > 0) {
        setSelectedPatientId(activePatients[0].id);
      }

      const data = plansData;
      setPlans(data);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to load care plans');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleSelectPlan = (carePlanId: string) => {
    if (patients.length === 0) {
      addToast('error', 'No active patient found. Please add a patient first.');
      return;
    }

    setSelectedPlanId(carePlanId);
    setIsPickerOpen(true);
  };

  const handleCreateBooking = async () => {
    if (!selectedPlanId || !selectedPatientId) {
      addToast('error', 'Please select a patient to continue.');
      return;
    }

    try {
      setCreatingForPlanId(selectedPlanId);
      const res = await createBooking({
        carePlanId: selectedPlanId,
        patientId: selectedPatientId,
      });

      const bookingId = res.booking?.id;
      if (!bookingId) {
        throw new Error('Booking was created but booking id was not returned');
      }

      setIsPickerOpen(false);
      addToast('success', 'Booking created. Continue with payment.');
      navigate(`/family/payments/checkout?bookingId=${encodeURIComponent(bookingId)}`);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setCreatingForPlanId(null);
    }
  };

  if (user?.role !== 'family') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
        <p className="text-sm font-semibold text-red-700">Access Denied</p>
        <p className="mt-1 text-xs text-red-600">Only family users can access care plans.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Care Plans</h1>
        <p className="text-sm text-slate-500">
          Browse available care packages and select a plan to continue booking.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100">
            <IconHeart className="h-8 w-8 text-slate-400" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-600">
            No care plans available at the moment
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  {(() => {
                    const { items, fallback } = parseChecklist(plan.description, 6);
                    if (items.length > 0) {
                      return (
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                          {items.map((text) => (
                            <li key={text} className="flex items-start gap-2.5">
                              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                ✓
                              </span>
                              <span className="leading-relaxed">{text}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    return (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">{fallback}</p>
                    );
                  })()}
                </div>
                <Badge tone="blue">
                  {plan.duration} {plan.durationUnit}
                </Badge>
              </div>

              <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Plan Price
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-2xl font-extrabold text-emerald-800">
                  <IconCurrency className="h-5 w-5" />
                  {Number(plan.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={creatingForPlanId === plan.id}
                className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
              >
                {creatingForPlanId === plan.id ? 'Processing...' : 'Select Plan'}
              </button>
            </article>
          ))}
        </div>
      )}

      {isPickerOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setIsPickerOpen(false)}
            aria-label="Close modal"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Select Patient</h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose the patient for this care plan booking.
            </p>

            <label className="mt-4 block text-xs font-semibold text-slate-600">Patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName} - {patient.nic}
                </option>
              ))}
            </select>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateBooking}
                disabled={!!creatingForPlanId}
                className="flex-1 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {creatingForPlanId ? 'Creating...' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarePlans;
