import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/navbar';
import Footer from '../../components/Footer/footer';
import heroImage from '../../assets/landing/payments-hero.png';
import { getActiveCarePlans } from '../../api/care-plans/family-care-plan.api';
import type { CarePlan } from '../../api/care-plans/care-plan.types';
import Badge from '../dashboards/common/widgets/Badge';
import { IconCurrency } from '../dashboards/common/icons';
import { parseChecklist } from '../dashboards/common/utils/parseChecklist';
import './PaymentsPage.css';

const CostPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingPlans(true);
        setPlansError(null);
        const res = await getActiveCarePlans();
        const active = (res ?? []).filter((p) => p.isActive !== false);
        if (!alive) return;
        setCarePlans(active);
      } catch (err) {
        if (!alive) return;
        setPlansError(err instanceof Error ? err.message : 'Failed to load care plans');
        setCarePlans([]);
      } finally {
        if (!alive) return;
        setLoadingPlans(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const planUi = useMemo(() => {
    return carePlans;
  }, [carePlans]);

  const paymentMethods = [
    { name: 'Card Payment', icon: '💳', hint: 'Pay instantly with card' },
    { name: 'Bank Transfer', icon: '🏦', hint: 'Bank transfer with admin approval' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8F7]">
      <Navbar />

      {/* HERO */}
      <section
        className="pay-hero relative overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="pay-heroOverlay" />

        <div className="pay-orb orb-1" />
        <div className="pay-orb orb-2" />

        <div className="relative z-10 mx-auto flex h-[260px] max-w-7xl items-center px-4 sm:px-6 lg:h-[320px] lg:px-8">
          <div className="mx-auto max-w-3xl text-center pay-heroContent">
            <p className="mb-4 inline-flex items-center justify-center gap-2 text-white/90 text-sm md:text-base">
              <span className="pay-pill">Care Home</span>
              <span className="hidden sm:inline text-white/70">•</span>
              <span className="hidden sm:inline text-white/85">Secure checkout, admin-approved transfers</span>
            </p>

            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-white/85 text-sm md:text-lg leading-relaxed">
              Choose the right care plan for your loved ones.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href="#plans" className="pay-ctaPrimary">
                View Plans
              </a>
              <a href="#methods" className="pay-ctaSecondary">
                Flexible Payment Options
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="plans" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#101828]">
            Pricing Plans
          </h2>
          <p className="mt-3 text-sm md:text-base text-[#475467]">
            Compare plans and pick the right level of care support.
          </p>
        </div>

        {/* Care Plan Cards (dashboard-consistent) */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 items-stretch">
          {loadingPlans &&
            Array.from({ length: 3 }).map((_, index) => (
              <article
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-full">
                    <div className="h-5 w-40 rounded bg-slate-200" />
                    <div className="mt-3 space-y-2">
                      <div className="h-3.5 w-full rounded bg-slate-200" />
                      <div className="h-3.5 w-11/12 rounded bg-slate-200" />
                    </div>
                  </div>
                  <div className="h-6 w-24 rounded-full bg-slate-200" />
                </div>
                <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3">
                  <div className="h-3.5 w-24 rounded bg-emerald-200/60" />
                  <div className="mt-2 h-7 w-36 rounded bg-emerald-200/60" />
                </div>
                <div className="mt-5 h-11 w-full rounded-xl bg-slate-200" />
              </article>
            ))}

          {!loadingPlans && plansError && (
            <div className="col-span-full text-center">
              <div className="mx-auto max-w-xl rounded-2xl border border-[#EAECF0] bg-white p-6">
                <div className="text-3xl">📄</div>
                <p className="mt-2 text-sm font-semibold text-[#101828]">Unable to load care plans</p>
                <p className="mt-1 text-sm text-[#667085]">{plansError}</p>
              </div>
            </div>
          )}

          {!loadingPlans && !plansError && planUi.length === 0 && (
            <div className="col-span-full text-center">
              <div className="mx-auto max-w-xl rounded-2xl border border-[#EAECF0] bg-white p-8">
                <div className="text-3xl">🩺</div>
                <p className="mt-2 text-sm font-semibold text-[#101828]">
                  No plans available at the moment
                </p>
                <p className="mt-1 text-sm text-[#667085]">
                  Please check back soon for updated plans and pricing.
                </p>
              </div>
            </div>
          )}

          {!loadingPlans &&
            !plansError &&
            planUi.map((plan: CarePlan) => {
              const { items, fallback } = parseChecklist(plan.description, 6);
              return (
                <article
                  key={plan.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>

                      {items.length > 0 ? (
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
                      ) : (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{fallback}</p>
                      )}
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
                    type="button"
                    onClick={() => navigate(`/login?carePlanId=${encodeURIComponent(plan.id)}`)}
                    className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
                  >
                    Get Started
                  </button>
                </article>
              );
            })}
        </div>
      </section>

      {/* METHODS */}
      <section id="methods" className="methods-section py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Flexible Payment Options
            </h2>
            <p className="mt-3 text-white/85 text-sm md:text-base">
              Choose the payment method that works best for you.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {paymentMethods.map((method, index) => (
              <div key={index} className="method-card">
                <div className="method-icon">{method.icon}</div>
                <h3 className="method-title">{method.name}</h3>
                <p className="method-hint">{method.hint}</p>
              </div>
            ))}
          </div>

          {/* Trust / Info */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { title: 'Secure Payments', desc: 'Encrypted and protected transactions.' },
              { title: 'Trusted by Families', desc: 'Built for real-world healthcare care needs.' },
              { title: 'Admin-approved Transfers', desc: 'Bank transfers verified before activation.' },
            ].map((item) => (
              <div
                key={item.title}
                className="relative z-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-white backdrop-blur"
              >
                <p className="text-sm font-extrabold">{item.title}</p>
                <p className="mt-1 text-xs text-white/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CostPaymentPage;