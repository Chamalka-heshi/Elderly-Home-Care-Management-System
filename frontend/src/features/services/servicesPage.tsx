import React from 'react';
import Navbar from '../../components/Navbar/navbar';
import Footer from '../../components/Footer/footer';
import heroImage from '../../assets/Home/services_image.png'; 
import './ServicesPage.css';

type Service = {
  title: string;
  desc: string;
  offerings: string[];
  icon: string;
};

type CardItem = {
  title: string;
  desc: string;
  image: string;
  tag?: string;
};

const ServicesPage: React.FC = () => {
  const coreServices: Service[] = [
    {
      title: 'Resident Care',
      desc: 'Comfortable in-house care with structured routines, monitoring, and family updates.',
      icon: '🏠',
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
      offerings: [
        'Personalized daily care plans',
        'Companionship & mental wellness',
        'Mobility support & fall prevention',
        'Care task logs & accountability',
      ],
    },
  ];

  const dietaryCards: CardItem[] = [
    {
      title: 'Meal Plan 01',
      desc: 'Healthy protein + fiber meals with balanced carbs for daily energy.',
      image:
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&q=80&auto=format&fit=crop',
      tag: 'Popular',
    },
    {
      title: 'Meal Plan 02',
      desc: 'Low-oil, low-salt meals for heart-friendly nutrition support.',
      image:
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&q=80&auto=format&fit=crop',
    },
    {
      title: 'Meal Plan 03',
      desc: 'Balanced meal options with gentle digestion and hydration focus.',
      image:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80&auto=format&fit=crop',
    },
  ];

  const activityCards: CardItem[] = [
    {
      title: 'Yoga & Mobility',
      desc: 'Gentle movement routines to improve flexibility and reduce stiffness.',
      image:
        'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=1200&q=80&auto=format&fit=crop',
      tag: 'Wellness',
    },
    {
      title: 'Board Games',
      desc: 'Fun games to support memory, social bonding and cognitive activity.',
      image:
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80&auto=format&fit=crop',
    },
    {
      title: 'Gardening',
      desc: 'Light outdoor activity for calmness, purpose, and connection with nature.',
      image:
        'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200&q=80&auto=format&fit=crop',
    },
    {
      title: 'Indoor Activities',
      desc: 'Group programs like music, art, and guided interactive sessions.',
      image:
        'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=1200&q=80&auto=format&fit=crop',
      tag: 'Social',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8F7]">
      <Navbar />

      {/* HERO */}
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
              Services designed for comfort, safety & dignity.
            </h1>
            <p className="mt-3 text-white/85 text-sm md:text-lg leading-relaxed">
              From daily care to medical coordination, we support elderly well-being with structured programs and compassionate staff.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#core" className="svc-ctaPrimary">Explore Services</a>
              <a href="/contact" className="svc-ctaSecondary">Talk to Us</a>
            </div>
          </div>
        </div>
      </section>

      {/* CORE SERVICES */}
      <section id="core" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#101828]">
            Our Core Services
          </h2>
          <p className="mt-3 text-[#475467] text-sm md:text-base">
            Clean, well-structured services with real care coordination — built to match modern healthcare standards.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {coreServices.map((s, idx) => (
            <div key={idx} className="svc-card">
              <div className="svc-cardTop">
                <div className="svc-icon">{s.icon}</div>
                <div>
                  <h3 className="svc-title">{s.title}</h3>
                  <p className="svc-desc">{s.desc}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {s.offerings.map((o, i) => (
                  <span key={i} className="svc-chip">{o}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DIETARY SERVICES */}
      <section className="bg-white/70 border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#101828]">
              Dietary Services
            </h2>
            <p className="mt-3 text-[#475467] text-sm md:text-base">
              Carefully prepared meal plans based on health needs and preferences.
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
                  <a href="/contact" className="mt-4 inline-flex font-extrabold text-[#4A2C4F] hover:translate-x-1 transition">
                    Request plan →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACTIVITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#101828]">
            Recreational & Social Activities
          </h2>
          <p className="mt-3 text-[#475467] text-sm md:text-base">
            Activities designed to improve mental wellness, mobility, and social connection.
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="svc-chip">Supervised</span>
                  <span className="svc-chip">Safe</span>
                  <span className="svc-chip">Engaging</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 svc-finalCta">
          <div>
            <h3 className="text-xl md:text-2xl font-extrabold text-[#101828]">
              Need a customized care program?
            </h3>
            <p className="mt-2 text-sm md:text-base text-[#475467]">
              Tell us your needs and we’ll recommend the best service plan.
            </p>
          </div>
          <a href="/contact" className="svc-ctaPrimary">
            Contact Us
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServicesPage;