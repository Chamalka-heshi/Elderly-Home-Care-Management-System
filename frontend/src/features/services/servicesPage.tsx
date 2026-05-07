import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/navbar';
import Footer from '../../components/Footer/footer';
import heroImage from '../../assets/landing/services-hero.png';
import { useAuth } from '../../auth/AuthContext';
import { getActiveCarePlans } from '../../api/care-plans/family-care-plan.api';
import type { CarePlan } from '../../api/care-plans/care-plan.types';
import { createBooking } from '../../api/bookings/family-booking.api';
import { getMyPatients } from '../../api/patients/family-patient.api';
import type { Patient } from '../../api/patients/patient.types';
import { getAvailableSlots } from '../../api/channeling/public-channeling.api';
import type { ChannelingSlot } from '../../api/channeling/channeling.types';
import { fmt12, fmtDate } from '../../api/channeling/channeling.types';
import { createAppointment } from '../../api/appointment/appointment.api';
import './ServicesPage.css';

// ── Types ──

type Service = {
  title: string;
  desc: string;
  offerings: string[];
  icon: string;
  detail: string;
  accentColor: string;
};


// ── Toast ──

interface ToastItem {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
}

const ToastStack: React.FC<{ toasts: ToastItem[]; onDismiss: (id: number) => void }> = ({
  toasts,
  onDismiss,
}) => (
  <div className="svc-toastStack">
    {toasts.map((t) => (
      <div key={t.id} className={`svc-toast svc-toast--${t.kind}`}>
        <span className="svc-toast__icon">
          {t.kind === 'success' ? '✓' : t.kind === 'error' ? '✕' : 'ℹ'}
        </span>
        <span className="svc-toast__msg">{t.message}</span>
        <button className="svc-toast__close" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
          ×
        </button>
      </div>
    ))}
  </div>
);

// ── Auth Gate Modal ──────────────────────────────────────────────────────────

const AuthGateModal: React.FC<{ onClose: () => void; onLogin: () => void }> = ({
  onClose,
  onLogin,
}) => (
  <div className="svc-modalBackdrop" onClick={onClose}>
    <div className="svc-modal svc-modal--sm" onClick={(e) => e.stopPropagation()}>
      <div className="svc-modal__header">
        <div className="svc-modal__iconWrap svc-modal__iconWrap--amber">🔒</div>
        <div>
          <h3 className="svc-modal__title">Sign in required</h3>
          <p className="svc-modal__sub">Please log in to access this feature.</p>
        </div>
        <button className="svc-modal__closeBtn" onClick={onClose} aria-label="Close">×</button>
      </div>
      <p className="svc-modal__body-text">
        Only registered family members can request meal plans or book activities. Create a free
        account or sign in to continue.
      </p>
      <div className="svc-modal__footer">
        <button className="svc-btn svc-btn--ghost" onClick={onClose}>Cancel</button>
        <button className="svc-btn svc-btn--primary" onClick={onLogin}>
          Go to Login
        </button>
      </div>
    </div>
  </div>
);

// ── Dietary Request Modal ────

interface DietaryModalProps {
  mealPlanTitle: string;
  onClose: () => void;
  addToast: (kind: 'success' | 'error' | 'info', msg: string) => void;
}

const DietaryModal: React.FC<DietaryModalProps> = ({ mealPlanTitle, onClose, addToast }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'loading' | 'pick' | 'submitting' | 'done'>('loading');
  const [plans, setPlans] = useState<CarePlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [plansData, patientsRes] = await Promise.all([
          getActiveCarePlans(),
          getMyPatients(),
        ]);
        if (cancelled) return;
        const activePats = (patientsRes.patients ?? []).filter((p) => p.isActive);
        setPlans(plansData);
        setPatients(activePats);
        if (plansData.length > 0) setSelectedPlanId(plansData[0].id);
        if (activePats.length > 0) setSelectedPatientId(activePats[0].id);
        setStep('pick');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load data. Please try again.');
        setStep('pick');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async () => {
    if (!selectedPlanId || !selectedPatientId) {
      setError('Please select both a care plan and a patient.');
      return;
    }
    setError('');
    setStep('submitting');
    try {
      const res = await createBooking({ carePlanId: selectedPlanId, patientId: selectedPatientId });
      const bookingId = res.booking?.id;
      if (!bookingId) throw new Error('Booking created but no ID returned.');
      addToast('success', 'Meal plan request submitted! Redirecting to payment…');
      onClose();
      navigate(`/family/payments/checkout?bookingId=${encodeURIComponent(bookingId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request.');
      setStep('pick');
    }
  };

  return (
    <div className="svc-modalBackdrop" onClick={onClose}>
      <div className="svc-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="svc-modal__header">
          <div className="svc-modal__iconWrap svc-modal__iconWrap--green">🥗</div>
          <div>
            <h3 className="svc-modal__title">Request Meal Plan</h3>
            <p className="svc-modal__sub">{mealPlanTitle}</p>
          </div>
          <button className="svc-modal__closeBtn" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Body */}
        <div className="svc-modal__body">
          {step === 'loading' && (
            <div className="svc-modal__loadingBox">
              <div className="svc-spinner" />
              <p>Loading available plans…</p>
            </div>
          )}

          {(step === 'pick' || step === 'submitting') && (
            <>
              {/* Care Plan Selector */}
              <div className="svc-field">
                <label className="svc-label">Select Care Plan</label>
                {plans.length === 0 ? (
                  <p className="svc-emptyHint">No active care plans available at the moment.</p>
                ) : (
                  <div className="svc-planGrid">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        className={`svc-planCard ${selectedPlanId === plan.id ? 'svc-planCard--active' : ''}`}
                        onClick={() => setSelectedPlanId(plan.id)}
                        disabled={step === 'submitting'}
                      >
                        <div className="svc-planCard__name">{plan.name}</div>
                        <div className="svc-planCard__meta">
                          {plan.duration} {plan.durationUnit}
                        </div>
                        <div className="svc-planCard__price">
                          LKR {Number(plan.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Patient Selector */}
              <div className="svc-field">
                <label className="svc-label">Select Patient</label>
                {patients.length === 0 ? (
                  <p className="svc-emptyHint">
                    No active patients found.{' '}
                    <button
                      type="button"
                      className="svc-inlineLink"
                      onClick={() => { onClose(); navigate('/family'); }}
                    >
                      Add a patient
                    </button>{' '}
                    in your dashboard first.
                  </p>
                ) : (
                  <select
                    className="svc-select"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    disabled={step === 'submitting'}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} — {p.nic}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {error && <p className="svc-errorMsg">{error}</p>}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="svc-modal__footer">
          <button className="svc-btn svc-btn--ghost" onClick={onClose} disabled={step === 'submitting'}>
            Cancel
          </button>
          <button
            className="svc-btn svc-btn--primary"
            onClick={handleSubmit}
            disabled={step === 'loading' || step === 'submitting' || plans.length === 0 || patients.length === 0}
          >
            {step === 'submitting' ? (
              <><span className="svc-spinnerSm" /> Processing…</>
            ) : (
              'Request Plan & Pay'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Activity Booking Modal ───────────────────────────────────────────────────

interface ActivityModalProps {
  activityTitle: string;
  onClose: () => void;
  addToast: (kind: 'success' | 'error' | 'info', msg: string) => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ activityTitle, onClose, addToast }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'loading' | 'pick' | 'submitting'>('loading');
  const [slots, setSlots] = useState<ChannelingSlot[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [notes, setNotes] = useState(`Activity: ${activityTitle}`);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [slotsData, patientsRes] = await Promise.all([
          getAvailableSlots(),
          getMyPatients(),
        ]);
        if (cancelled) return;
        const activePats = (patientsRes.patients ?? []).filter((p) => p.isActive);
        const now = new Date();
        // Filter to slots that are still open for booking
        const openSlots = slotsData.filter((s) => {
          const [h, m] = s.startTime.split(':').map(Number);
          const slotStart = new Date(`${s.date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
          const cutoff = new Date(slotStart.getTime() - s.bookingCutoffMinutes * 60_000);
          return now < cutoff && s.status === 'active';
        });
        setSlots(openSlots);
        setPatients(activePats);
        if (openSlots.length > 0) setSelectedSlotId(openSlots[0].id);
        if (activePats.length > 0) setSelectedPatientId(activePats[0].id);
        setStep('pick');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load data. Please try again.');
        setStep('pick');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async () => {
    if (!selectedSlotId || !selectedPatientId) {
      setError('Please select a session slot and a patient.');
      return;
    }
    setError('');
    setStep('submitting');
    try {
      const appt = await createAppointment({
        slotId: selectedSlotId,
        patientId: selectedPatientId,
        notes: notes.trim() || undefined,
      });
      addToast('success', 'Activity session booked! Redirecting to payment…');
      onClose();
      navigate(`/family/payments/checkout?appointmentId=${encodeURIComponent(appt.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book session.');
      setStep('pick');
    }
  };

  return (
    <div className="svc-modalBackdrop" onClick={onClose}>
      <div className="svc-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="svc-modal__header">
          <div className="svc-modal__iconWrap svc-modal__iconWrap--purple">🏃</div>
          <div>
            <h3 className="svc-modal__title">Book Activity Session</h3>
            <p className="svc-modal__sub">{activityTitle}</p>
          </div>
          <button className="svc-modal__closeBtn" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Body */}
        <div className="svc-modal__body">
          {step === 'loading' && (
            <div className="svc-modal__loadingBox">
              <div className="svc-spinner" />
              <p>Loading available sessions…</p>
            </div>
          )}

          {(step === 'pick' || step === 'submitting') && (
            <>
              {/* Slot Selector */}
              <div className="svc-field">
                <label className="svc-label">Available Session Slots</label>
                {slots.length === 0 ? (
                  <div className="svc-emptySlots">
                    <span className="svc-emptySlots__icon">📅</span>
                    <p>No open session slots at the moment. Please check back later or contact us.</p>
                  </div>
                ) : (
                  <div className="svc-slotList">
                    {slots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;
                      const fee = (slot.consultationFee ?? 0) + (slot.careHomeFee ?? 0);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          className={`svc-slotCard ${isSelected ? 'svc-slotCard--active' : ''}`}
                          onClick={() => setSelectedSlotId(slot.id)}
                          disabled={step === 'submitting'}
                        >
                          <div className="svc-slotCard__left">
                            <div className="svc-slotCard__date">{fmtDate(slot.date)}</div>
                            <div className="svc-slotCard__time">
                              {fmt12(slot.startTime)} – {fmt12(slot.endTime)}
                            </div>
                            <div className="svc-slotCard__doctor">
                              Dr. {slot.doctor.user?.fullName || 'Unknown'} · {slot.doctor.specialization}
                            </div>
                          </div>
                          <div className="svc-slotCard__right">
                            {fee > 0 && (
                              <div className="svc-slotCard__fee">
                                LKR {fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                            )}
                            <div className={`svc-slotCard__radio ${isSelected ? 'svc-slotCard__radio--on' : ''}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Patient Selector */}
              <div className="svc-field">
                <label className="svc-label">Select Patient</label>
                {patients.length === 0 ? (
                  <p className="svc-emptyHint">
                    No active patients found.{' '}
                    <button type="button" className="svc-inlineLink" onClick={() => { onClose(); navigate('/family'); }}>
                      Add a patient
                    </button>{' '}
                    in your dashboard first.
                  </p>
                ) : (
                  <select
                    className="svc-select"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    disabled={step === 'submitting'}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} — {p.nic}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Notes */}
              <div className="svc-field">
                <label className="svc-label">Notes <span className="svc-label__opt">(optional)</span></label>
                <textarea
                  className="svc-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any specific requirements or notes…"
                  disabled={step === 'submitting'}
                />
              </div>

              {error && <p className="svc-errorMsg">{error}</p>}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="svc-modal__footer">
          <button className="svc-btn svc-btn--ghost" onClick={onClose} disabled={step === 'submitting'}>
            Cancel
          </button>
          <button
            className="svc-btn svc-btn--primary"
            onClick={handleSubmit}
            disabled={step === 'loading' || step === 'submitting' || slots.length === 0 || patients.length === 0}
          >
            {step === 'submitting' ? (
              <><span className="svc-spinnerSm" /> Booking…</>
            ) : (
              'Book & Proceed to Pay'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFamilyUser = user?.role === 'family';

  // ── Toast state ──────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastCounter = React.useRef(0);

  const addToast = useCallback((kind: 'success' | 'error' | 'info', message: string) => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Expanded core service panel ──────────────────────────────────────────
  const [expandedService, setExpandedService] = useState<number | null>(null);

  const toggleService = (idx: number) => {
    setExpandedService((prev) => (prev === idx ? null : idx));
  };

  // ── Auth gate modal ──────────────────────────────────────────────────────
  const [showAuthGate, setShowAuthGate] = useState(false);

  // ── Dietary modal ────────────────────────────────────────────────────────
  const [dietaryModal, setDietaryModal] = useState<string | null>(null);

  const handleRequestPlan = (title: string) => {
    if (!isFamilyUser) { setShowAuthGate(true); return; }
    setDietaryModal(title);
  };

  // ── Activity modal ───────────────────────────────────────────────────────
  const [activityModal, setActivityModal] = useState<string | null>(null);

  const handleBookActivity = (title: string) => {
    if (!isFamilyUser) { setShowAuthGate(true); return; }
    setActivityModal(title);
  };

  // ── Data ─────────────────────────────────────────────────────────────────

  const coreServices: Service[] = [
    {
      title: 'Resident Care',
      desc: 'Comfortable in-house care with structured routines, monitoring, and family updates.',
      icon: '🏠',
      accentColor: '#3AAF5C',
      detail:
        'Our resident care program provides 24/7 supervised support within the facility. Residents follow structured daily routines curated by care coordinators, ensuring physical health and emotional comfort. Families receive scheduled progress reports and can reach the care team at any time.',
      offerings: [
        'Daily care routines & hygiene support',
        'Vitals monitoring & documentation',
        'Emergency response coordination',
        'Family progress updates',
      ],
    },
    {
      title: 'Elderly Nutrition',
      desc: 'Balanced meal plans tailored to health conditions and dietary preferences.',
      icon: '🥗',
      accentColor: '#F59E0B',
      detail:
        'Nutrition is central to healthy ageing. Our registered dietitians design personalised meal plans accommodating chronic conditions like diabetes, hypertension, and renal disease. Every meal is prepared on-site with fresh, age-appropriate ingredients and portion sizes.',
      offerings: [
        'Diet plans with nutrition guidance',
        'Special meals (diabetic, low-salt, etc.)',
        'Hydration reminders & tracking',
        'Weekly menu planning',
      ],
    },
    {
      title: 'Skilled Nursing',
      desc: 'Professional nursing support for medication, wound care, and clinical assistance.',
      icon: '🩺',
      accentColor: '#3B82F6',
      detail:
        'Our qualified nursing staff deliver clinical-grade care directly at the facility. Services include prescribed medication administration, routine wound care, post-operative support, and coordination with visiting or on-call doctors for follow-up consultations and health reviews.',
      offerings: [
        'Medication administration & reminders',
        'Basic wound care & dressing',
        'Doctor coordination & follow-ups',
        'Health record maintenance',
      ],
    },
    {
      title: 'Caring Staff',
      desc: 'Compassionate caregivers trained for daily assistance and emotional support.',
      icon: '🤝',
      accentColor: '#8B5CF6',
      detail:
        'Every caregiver on our team is background-checked, trained in elderly care best practices, and matched with residents based on compatibility and care needs. Beyond physical assistance, our caregivers provide companionship, emotional support, and dignity-first interactions every day.',
      offerings: [
        'Personalised daily care plans',
        'Companionship & mental wellness',
        'Mobility support & fall prevention',
        'Care task logs & accountability',
      ],
    },
  ];

  const dietaryCards = [
    {
      title: 'Meal Plan 01',
      desc: 'Healthy protein + fiber meals with balanced carbs for daily energy.',
      image:
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&q=80&auto=format&fit=crop',
      tag: 'Popular',
      highlights: ['High protein', 'Balanced carbs', 'Heart-friendly'],
    },
    {
      title: 'Meal Plan 02',
      desc: 'Low-oil, low-salt meals for heart-friendly nutrition support.',
      image:
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&q=80&auto=format&fit=crop',
      highlights: ['Low sodium', 'Low cholesterol', 'Diabetes-safe'],
    },
    {
      title: 'Meal Plan 03',
      desc: 'Balanced meal options with gentle digestion and hydration focus.',
      image:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80&auto=format&fit=crop',
      highlights: ['Gut-friendly', 'Hydration rich', 'Soft textures'],
    },
  ];

  const activityCards = [
    {
      title: 'Yoga & Mobility',
      desc: 'Gentle movement routines to improve flexibility and reduce stiffness.',
      image:
        'https://www.storypoint.com/wp-content/uploads/2021/07/Yoga-for-Seniors-Blog-Cover.jpg',
      tag: 'Wellness',
      chips: ['Supervised', 'Safe', 'Engaging'],
      scheduleNote: 'Mon, Wed, Fri · Morning sessions',
    },
    {
      title: 'Board Games',
      desc: 'Fun games to support memory, social bonding and cognitive activity.',
      image:
        'https://www.shutterstock.com/image-photo/outdoor-photo-show-group-seniors-260nw-2631252003.jpg',
      chips: ['Group sessions', 'Cognitive', 'Social'],
      scheduleNote: 'Daily · Afternoon sessions',
    },
    {
      title: 'Gardening',
      desc: 'Light outdoor activity for calmness, purpose, and connection with nature.',
      image:
        'https://static.vecteezy.com/system/resources/thumbnails/046/308/043/small/two-happy-smiling-senior-women-in-the-garden-together-taking-care-of-flowers-gardening-joy-of-communication-floriculture-friendship-friendly-support-photo.jpg',
      chips: ['Outdoor', 'Therapeutic', 'Light activity'],
      scheduleNote: 'Tue, Thu · Morning sessions',
    },
    {
      title: 'Indoor Activities',
      desc: 'Group programs like music, art, and guided interactive sessions.',
      image:
        'https://meadowviewassisted.com/wp-content/uploads/sites/23/2023/10/Fun-Indoor-Activities-For-Seniors-Hero-1024x672.jpg',
      tag: 'Social',
      chips: ['Creative', 'Group', 'Fun'],
      scheduleNote: 'Daily · Flexible hours',
    },
  ];

  // ── Render ───

  return (
    <div className="min-h-screen bg-[#F6F8F7]">
      <Navbar />

      {/* TOAST STACK */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* ── HERO ── */}
      <section
        className="svc-hero relative overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="svc-heroOverlay" />
        <div className="svc-orb orb-1" />
        <div className="svc-orb orb-2" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[260px] md:h-[330px] flex items-center">
          <div className="svc-heroContent max-w-3xl">
            <span className="svc-pill">Care Home • Services</span>
            <h1 className="mt-4 text-white text-3xl md:text-5xl font-extrabold tracking-tight">
              Services designed for comfort, safety &amp; dignity.
            </h1>
            <p className="mt-3 text-white/85 text-sm md:text-lg leading-relaxed">
              From daily care to medical coordination, we support elderly well-being with structured
              programs and compassionate staff.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#core" className="svc-ctaPrimary">Explore Services</a>
              <a href="/contact" className="svc-ctaSecondary">Talk to Us</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE SERVICES ── */}
      <section id="core" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#101828]">
            Our Core Services
          </h2>
          <p className="mt-3 text-[#475467] text-sm md:text-base">
            Clean, well-structured services with real care coordination — built to match modern
            healthcare standards.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {coreServices.map((s, idx) => {
            const isOpen = expandedService === idx;
            return (
              <div key={idx} className={`svc-card ${isOpen ? 'svc-card--expanded' : ''}`}>
                <div className="svc-cardTop">
                  <div className="svc-icon" style={{ background: `${s.accentColor}18`, borderColor: `${s.accentColor}28` }}>
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="svc-title">{s.title}</h3>
                    <p className="svc-desc">{s.desc}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {s.offerings.map((o, i) => (
                    <span key={i} className="svc-chip">{o}</span>
                  ))}
                </div>

                {/* Expandable detail */}
                {isOpen && (
                  <div className="svc-detail">
                    <p className="svc-detail__text">{s.detail}</p>
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    className="svc-learnBtn"
                    style={{ '--btn-color': s.accentColor } as React.CSSProperties}
                    onClick={() => toggleService(idx)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? '↑ Less Info' : '↓ Learn More'}
                  </button>
                  <a href="/contact" className="svc-contactBtn">
                    Enquire
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── DIETARY SERVICES ── */}
      <section className="bg-white/70 border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#101828]">
              Dietary Services
            </h2>
            <p className="mt-3 text-[#475467] text-sm md:text-base">
              Carefully prepared meal plans based on health needs and preferences.{' '}
              {!isFamilyUser && (
                <span className="svc-loginHint">
                  <a href="/login" className="svc-inlineLink">Log in</a> as a family member to request a plan.
                </span>
              )}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {dietaryCards.map((m, idx) => (
              <div key={idx} className="img-card">
                <div className="img-wrap">
                  <img src={m.image} alt={m.title} className="img" />
                  <div className="img-overlay" />
                  {m.tag && <span className="img-tag">{m.tag}</span>}
                </div>
                <div className="p-5">
                  <div className="img-title">{m.title}</div>
                  <p className="mt-2 text-sm text-[#667085] leading-relaxed">{m.desc}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.highlights.map((h) => (
                      <span key={h} className="svc-chip svc-chip--xs">{h}</span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="svc-requestBtn mt-4"
                    onClick={() => handleRequestPlan(m.title)}
                  >
                    {isFamilyUser ? 'Request Plan →' : 'Request Plan (Login required) →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTIVITIES ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#101828]">
            Recreational &amp; Social Activities
          </h2>
          <p className="mt-3 text-[#475467] text-sm md:text-base">
            Activities designed to improve mental wellness, mobility, and social connection.{' '}
            {!isFamilyUser && (
              <span className="svc-loginHint">
                <a href="/login" className="svc-inlineLink">Log in</a> to book a session for your loved one.
              </span>
            )}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {activityCards.map((a, idx) => (
            <div key={idx} className="img-card img-card--wide">
              <div className="img-wrap">
                <img src={a.image} alt={a.title} className="img" />
                <div className="img-overlay" />
                {a.tag && <span className="img-tag img-tag--soft">{a.tag}</span>}
              </div>
              <div className="p-5">
                <div className="img-title">{a.title}</div>
                <p className="mt-2 text-sm text-[#667085] leading-relaxed">{a.desc}</p>

                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#3AAF5C] font-semibold">
                  <span>📅</span>
                  <span>{a.scheduleNote}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {a.chips.map((c) => (
                    <span key={c} className="svc-chip">{c}</span>
                  ))}
                </div>

                <button
                  type="button"
                  className="svc-bookBtn mt-4"
                  onClick={() => handleBookActivity(a.title)}
                >
                  {isFamilyUser ? 'Book Session →' : 'Book Session (Login required) →'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA strip */}
        <div className="mt-12 svc-finalCta">
          <div>
            <h3 className="text-xl md:text-2xl font-extrabold text-[#101828]">
              Need a customised care program?
            </h3>
            <p className="mt-2 text-sm md:text-base text-[#475467]">
              Tell us your needs and we'll recommend the best service plan.
            </p>
          </div>
          <a href="/contact" className="svc-ctaPrimary">
            Contact Us
          </a>
        </div>
      </section>

      <Footer />

      {/* ── MODALS ── */}
      {showAuthGate && (
        <AuthGateModal
          onClose={() => setShowAuthGate(false)}
          onLogin={() => navigate('/login')}
        />
      )}

      {dietaryModal && (
        <DietaryModal
          mealPlanTitle={dietaryModal}
          onClose={() => setDietaryModal(null)}
          addToast={addToast}
        />
      )}

      {activityModal && (
        <ActivityModal
          activityTitle={activityModal}
          onClose={() => setActivityModal(null)}
          addToast={addToast}
        />
      )}
    </div>
  );
};

export default ServicesPage;