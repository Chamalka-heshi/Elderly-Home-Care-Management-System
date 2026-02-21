import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./homePage.css";


import Navbar from "../../components/Navbar/navbar";
import Footer from "../../components/Footer/footer";

import heroImg from "../../assets/Home/hero.jpg";
import aboutImg from "../../assets/Home/about.jpg";
import bestCareImg from "../../assets/Home/best-care.jpg";


//../../../components/Auth/AuthModal
import AuthModal, { type AuthMode } from "../../components/Auth/AuthModal";
import LoginCard from "../auth/Login/LoginCard";
import SignupCard from "../auth/Signin/Signupcard";

interface Service {
  title: string;
  desc: string;
}

const services: Service[] = [
  { title: "Resident Care", desc: "Daily support for seniors with comfort, safety, and compassionate assistance." },
  { title: "Elderly Nutrition", desc: "Personalized meal planning to improve energy, health, and long-term wellbeing." },
  { title: "Skilled Nursing", desc: "Professional medical care with safe medication and health monitoring support." },
  { title: "Caring Staff", desc: "Dedicated caregivers ensuring every resident feels valued, respected, and secure." },
];

const Home: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const openLogin = () => {
    setAuthMode("login");
    setAuthOpen(true);
  };

  const openSignup = () => {
    setAuthMode("signup");
    setAuthOpen(true);
  };

  const closeAuth = () => setAuthOpen(false);

  useEffect(() => {
    const onScroll = () => {
      const el = document.querySelector<HTMLDivElement>(".hp-heroParallax");
      if (!el) return;
      el.style.transform = `translateY(${window.scrollY * 0.18}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.12 }
    );

    document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />


      <section id="home" className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 hp-heroParallax">
          <img src={heroImg} alt="Elderly care" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 hp-heroOverlayModern" />

        <div className="relative z-10 w-full">
          <div className="mx-auto max-w-287.5 px-4 pt-24 pb-16">
            <div className="max-w-160 reveal is-visible">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-white/90 text-xs font-semibold backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Elderly Care Management System
              </div>

              <h1 className="mt-5 text-white text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
                Stay Comfortable <br /> Like Your Home
              </h1>

              <p className="mt-4 text-white/90 text-sm md:text-base leading-relaxed max-w-[56ch]">
                Care Home connects families, doctors, caregivers, and administrators to deliver safe, consistent care with real-time updates.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                
                <button
                  onClick={openLogin}
                  className="btn-modern inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-700/20"
                >
                  Login
                </button>

                <button
                  onClick={openSignup}
                  className="btn-modern inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 transition backdrop-blur"
                >
                  Sign up
                </button>

                <a
                  href="#about"
                  className="btn-modern inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 transition backdrop-blur"
                >
                  Explore more
                </a>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { v: "24/7", k: "Support" },
                  { v: "Safe", k: "Care Plans" },
                  { v: "Fast", k: "Appointments" },
                  { v: "Live", k: "Updates" },
                ].map((s) => (
                  <div
                    key={s.k}
                    className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 backdrop-blur"
                  >
                    <div className="text-white font-extrabold text-lg">{s.v}</div>
                    <div className="text-white/80 text-xs mt-1">{s.k}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-xs flex flex-col items-center gap-2">
            <span>Scroll</span>
            <span className="hp-scrollDot" />
          </div>
        </div>
      </section>

      <section id="about" className="bg-white">
        <div className="group mx-auto max-w-287.5 px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="relative reveal">
              <div className="absolute -inset-3 rounded-2xl bg-emerald-100/60 blur-2xl" />
              <div className="relative img-hover rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm">
                <img src={aboutImg} alt="About Care Home" className="w-full rounded-xl object-cover" />
              </div>
            </div>

            <div className="reveal">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">About Us</h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Our dedicated team is committed to delivering high-quality care with compassion,
                respect, and dignity. Every senior has unique needs, and we tailor services to ensure
                comfort and safety.
              </p>
              <Link to="/about">
                <div className="mt-5 text-sm font-semibold text-emerald-700 opacity-0 group-hover:opacity-100 transition">
                  Learn more →
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-slate-50/60">
        <div className="mx-auto max-w-287.5 px-4 py-16">
          <div className="text-center max-w-175 mx-auto reveal">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Our Services</h2>
            <p className="mt-3 text-slate-600">Modern care workflows built for safety, coordination, and transparency.</p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((s, idx) => (
              <div
                key={s.title}
                className={`group card-hover reveal ${idx === 0 ? "reveal-delay-1" : idx === 1 ? "reveal-delay-2" : "reveal-delay-3"} rounded-2xl border border-slate-100 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <span className="h-4 w-4 rounded bg-emerald-600 inline-block" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg">{s.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
                <Link to="/services">
                  <div className="mt-5 text-sm font-semibold text-emerald-700 opacity-0 group-hover:opacity-100 transition">
                    Learn more →
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

  
      <section className="bg-white">
        <div className="mx-auto max-w-287.5 px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="reveal">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                The Best Elderly Care Center For You
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                CareHome simplifies daily care tasks, appointment scheduling, and health monitoring.
                With real-time updates and effortless coordination, it brings peace of mind for families
                and safer care for seniors.
              </p>

              <div className="mt-7 flex gap-3">
                <Link to="/about" className="btn-modern inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition">
                  Learn More
                </Link>

                <button
                  onClick={openLogin}
                  className="btn-modern inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
                >
                  Login
                </button>
              </div>
            </div>

            <div className="relative reveal">
              <div className="absolute -inset-3 rounded-2xl bg-emerald-100/60 blur-2xl" />
              <div className="relative img-hover rounded-2xl border border-slate-100 shadow-sm">
                <img src={bestCareImg} alt="Elderly care support" className="w-full object-cover rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={closeAuth}
        onSwitchMode={(m) => setAuthMode(m)}
      >
        {authMode === "login" ? (
          <LoginCard
            onSuccessClose={closeAuth}
            onGoSignup={() => setAuthMode("signup")}
          />
        ) : (
          <SignupCard
            onSuccessClose={closeAuth}
            onGoLogin={() => setAuthMode("login")}
          />
        )}
      </AuthModal>

      <Footer />
    </div>
  );
};

export default Home;