import React, { useMemo, useState } from 'react';
import Navbar from '../../components/Navbar/navbar';
import Footer from '../../components/Footer/footer';
import heroImage from '../../assets/Home/pa_image.png';
import './CostPaymentPage.css';

type BillingCycle = 'monthly' | 'yearly';

const CostPaymentPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const plans = useMemo(() => {
    // NOTE: If you want “yearly” pricing to differ, apply a discount here.
    const multiplier = billingCycle === 'yearly' ? 12 * 0.8 : 1; // yearly = 20% off
    const suffix = billingCycle === 'yearly' ? 'Per member, per Year' : 'Per member, per Month';

    return [
      {
        name: 'BASIC',
        basePrice: 15000,
        tag: null,
        features: [
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: false, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: 'Coming Soon' },
          { text: 'Name of the Service Offerings', included: true, badge: 'Coming Soon' },
          { text: 'Name of the Service Offerings', included: true, badge: 'Coming Soon' },
        ],
        tone: 'basic' as const,
      },
      {
        name: 'PREMIUM',
        basePrice: 45000,
        tag: 'Most Popular',
        features: [
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: 'Coming Soon' },
          { text: 'Name of the Service Offerings', included: true, badge: 'Coming Soon' },
          { text: 'Name of the Service Offerings', included: true, badge: 'Coming Soon' },
        ],
        tone: 'premium' as const,
      },
      {
        name: 'REGULAR',
        basePrice: 30000,
        tag: null,
        features: [
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: false, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: null },
          { text: 'Name of the Service Offerings', included: true, badge: 'Coming Soon' },
          { text: 'Name of the Service Offerings', included: true, badge: 'Coming Soon' },
          { text: 'Name of the Service Offerings', included: true, badge: 'Coming Soon' },
        ],
        tone: 'regular' as const,
      },
    ].map(p => ({
      ...p,
      price: Math.round(p.basePrice * multiplier),
      suffix,
    }));
  }, [billingCycle]);

  const paymentMethods = [
    { name: 'Credit / Debit cards', icon: '💳', hint: 'Visa, Master, Amex' },
    { name: 'Bank transfer', icon: '🏦', hint: 'Local & online banking' },
    //{ name: 'Mobile payments', icon: '📱', hint: 'Easy & fast payments' },
    { name: 'Cash payments', icon: '💵', hint: 'Pay at the care home' },
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[260px] md:h-[320px] flex items-center">
          <div className="max-w-3xl pay-heroContent">
            <p className="inline-flex items-center gap-2 text-white/90 text-sm md:text-base mb-3">
              <span className="pay-pill">Care Home</span>
              <span className="hidden sm:inline text-white/70">•</span>
              <span className="hidden sm:inline text-white/85">Transparent pricing, flexible payments</span>
            </p>

            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Cost &amp; Payment
            </h1>
            <p className="mt-3 text-white/85 text-sm md:text-lg leading-relaxed">
              Choose the plan that fits your care needs. Upgrade anytime, no hidden charges.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#plans" className="pay-ctaPrimary">
                View Plans
              </a>
              <a href="#methods" className="pay-ctaSecondary">
                Payment Methods
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="plans" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#101828]">
            Payment Plans
          </h2>
          <p className="mt-3 text-sm md:text-base text-[#475467]">
            Simple plans designed for families, caregivers, and medical coordination.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="billing-toggle">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`billing-btn ${billingCycle === 'monthly' ? 'is-active' : ''}`}
            >
              Monthly
            </button>

            <button
              onClick={() => setBillingCycle('yearly')}
              className={`billing-btn ${billingCycle === 'yearly' ? 'is-active' : ''}`}
            >
              <span className="yearly-text">Yearly</span>
              <span className="save-badge">Save 20%</span>
            </button>

            <span
              className={`billing-slider ${billingCycle === 'yearly' ? 'is-right' : ''}`}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`price-card ${plan.tone === 'premium' ? 'price-card--premium' : ''}`}
            >
              {/* gradient top strip */}
              <div className="price-strip" />

              {/* header */}
              <div className="p-6 lg:p-8">
                <div className="flex items-center justify-between gap-3">
                  <span className="plan-chip">{plan.name}</span>
                  {plan.tag && <span className="plan-tag">{plan.tag}</span>}
                </div>

                <div className="mt-6">
                  <div className="flex items-end gap-2 flex-wrap">
                    <span className="price-text">
                      Rs {plan.price.toLocaleString()}
                    </span>
                    {billingCycle === 'yearly' && (
                      <span className="yearly-hint">
                        (20% off)
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-[#667085]">
                    {plan.suffix}
                  </p>
                </div>

                {/* features */}
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <span className="feat-icon feat-ok" aria-hidden="true">✓</span>
                      ) : (
                        <span className="feat-icon feat-no" aria-hidden="true">✕</span>
                      )}

                      <span className={`text-sm leading-relaxed ${feature.included ? 'text-[#344054]' : 'text-[#98A2B3] line-through'}`}>
                        {feature.text}
                      </span>

                      {feature.badge && (
                        <span className="feat-badge">{feature.badge}</span>
                      )}
                    </li>
                  ))}
                </ul>

                <button
                  className={`mt-8 w-full plan-btn ${plan.tone === 'premium' ? 'plan-btn--premium' : ''}`}
                >
                  Register
                </button>

                <p className="mt-3 text-xs text-[#98A2B3] text-center">
                  Cancel or change plan anytime.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* METHODS */}
      <section id="methods" className="methods-section py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Payment Methods
            </h2>
            <p className="mt-3 text-white/85 text-sm md:text-base">
              Choose your preferred payment option. We keep it flexible.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {paymentMethods.map((method, index) => (
              <div key={index} className="method-card">
                <div className="method-icon">{method.icon}</div>
                <h3 className="method-title">{method.name}</h3>
                <p className="method-hint">{method.hint}</p>
                <button className="method-btn">Pay</button>
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