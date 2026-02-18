import React from 'react';
import Navbar from '../../components/Navbar/navbar';
import Footer from '../../components/Footer/footer';
import heroImage from '../../assets/Home/about_image.png'; 
import './AboutPage.css';

type TeamMember = {
  name: string;
  role: string;
  img: string;
};

const AboutPage: React.FC = () => {
  const stats = [
    { label: 'Care Programs', value: '12+' },
    { label: 'Caregivers', value: '40+' },
    { label: 'Happy Families', value: '500+' },
    { label: 'Response Time', value: '< 10 min' },
  ];

  const timeline = [
    {
      year: '1990',
      title: 'A New Beginning',
      desc: 'We started with a simple mission: compassionate, safe elderly care with dignity.',
    },
    {
      year: '2000',
      title: 'Resident Care Expanded',
      desc: 'Introduced structured daily routines, monitoring, and family communication.',
    },
    {
      year: '2010',
      title: 'Home Care Service Started',
      desc: 'Launched home-based support and caregiver visits for flexible care needs.',
    },
    {
      year: '2020',
      title: 'Country-wide Coverage',
      desc: 'Expanded services with a stronger medical network and emergency coordination.',
    },
  ];

  const team: TeamMember[] = [
    { name: 'John Doe', role: 'Head Nurse', img: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=900&q=80&auto=format&fit=crop' },
    { name: 'John Doe', role: 'Care Coordinator', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=900&q=80&auto=format&fit=crop' },
    { name: 'John Doe', role: 'Medical Officer', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=900&q=80&auto=format&fit=crop' },
    { name: 'John Doe', role: 'Senior Caregiver', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=900&q=80&auto=format&fit=crop' },
    { name: 'John Doe', role: 'Physiotherapy', img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=900&q=80&auto=format&fit=crop' },
    { name: 'John Doe', role: 'Nutrition & Diet', img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=900&q=80&auto=format&fit=crop' },
    { name: 'John Doe', role: 'Home Visit Nurse', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=900&q=80&auto=format&fit=crop' },
    { name: 'John Doe', role: 'Care Support', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=900&q=80&auto=format&fit=crop' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8F7]">
      <Navbar />

      {/* HERO */}
      <section
        className="about-hero relative overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="about-heroOverlay" />
        <div className="about-orb orb-1" />
        <div className="about-orb orb-2" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[280px] md:h-[360px] flex items-center">
          <div className="about-heroContent max-w-3xl">
            <span className="about-pill">Care Home • About Us</span>
            <h1 className="mt-4 text-white text-3xl md:text-5xl font-extrabold tracking-tight">
              Compassionate care, built on trust.
            </h1>
            <p className="mt-3 text-white/85 text-sm md:text-lg leading-relaxed">
              Supporting elderly well-being, every single day
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#mission" className="about-ctaPrimary">Our Mission</a>
              <a href="#team" className="about-ctaSecondary">Meet the Team</a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-10 relative z-20">
        <div className="about-stats">
          {stats.map((s, idx) => (
            <div key={idx} className="about-statItem">
              <div className="about-statValue">{s.value}</div>
              <div className="about-statLabel">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MISSION / VISION */}
      <section id="mission" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
          <div className="about-card">
            <div className="about-cardTop">
              <span className="about-iconChip">🎯</span>
              <h2 className="about-title">Mission</h2>
            </div>
            <p className="about-text">
              Provide safe, respectful and compassionate elderly care with proper medical coordination and daily monitoring.
            </p>
            <ul className="mt-6 space-y-3">
              <li className="about-bullet">
                <span className="about-bulletDot" />
                Daily health monitoring & caregiver logs
              </li>
              <li className="about-bullet">
                <span className="about-bulletDot" />
                Doctor channeling & medication management
              </li>
              <li className="about-bullet">
                <span className="about-bulletDot" />
                Family transparency and emergency alerts
              </li>
            </ul>
          </div>

          <div className="about-card about-card--gradient">
            <div className="about-cardTop">
              <span className="about-iconChip about-iconChip--purple">✨</span>
              <h2 className="about-title">Vision</h2>
            </div>
            <p className="about-text">
              To be the most trusted eldercare platform, enabling families and caregivers to deliver better care through technology.
            </p>
            <div className="mt-6 p-4 rounded-xl bg-white/70 border border-black/5">
              <p className="text-sm text-[#475467]">
                <b className="text-[#101828]">Industry-level approach:</b> secure access, role-based control, and real-time care updates for accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STORY / TIMELINE */}
      <section className="bg-white/70 border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#101828]">
              Our Story
            </h2>
            <p className="mt-3 text-[#475467]">
              We started small, and grew into a coordinated care model that connects families, doctors and caregivers.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* timeline */}
            <div className="about-timeline">
              {timeline.map((t, idx) => (
                <div key={idx} className="about-timelineItem">
                  <div className="about-year">{t.year}</div>
                  <div className="about-timelineContent">
                    <div className="about-timelineTitle">{t.title}</div>
                    <p className="about-timelineDesc">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* story highlight card */}
            <div className="about-highlight">
              <div className="about-highlightBadge">Why families choose us</div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="about-miniCard">
                  <div className="about-miniTitle">Safety First</div>
                  <div className="about-miniText">Vitals tracking, care logs, emergency alerts.</div>
                </div>
                <div className="about-miniCard">
                  <div className="about-miniTitle">Medical Accuracy</div>
                  <div className="about-miniText">Doctor-managed records and prescriptions.</div>
                </div>
                <div className="about-miniCard">
                  <div className="about-miniTitle">Transparency</div>
                  <div className="about-miniText">Families stay informed with records access.</div>
                </div>
                <div className="about-miniCard">
                  <div className="about-miniTitle">Reliable Support</div>
                  <div className="about-miniText">24/7 response and structured care plans.</div>
                </div>
              </div>

              <a href="/contact" className="about-highlightCta">
                Contact us for a consultation →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#101828]">
            Meet Our Care Team
          </h2>
          <p className="mt-3 text-[#475467]">
            Experienced professionals dedicated to dignity, safety and compassionate support.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, idx) => (
            <div key={idx} className="team-card">
              <div className="team-imgWrap">
                <img src={member.img} alt={member.name} className="team-img" />
                <div className="team-overlay">
                  <div className="team-social">
                    <button className="team-socialBtn" aria-label="LinkedIn">in</button>
                    <button className="team-socialBtn" aria-label="Twitter">𝕏</button>
                    <button className="team-socialBtn" aria-label="Email">@</button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="team-name">{member.name}</div>
                <div className="team-role">{member.role}</div>
                <p className="mt-2 text-sm text-[#667085]">
                  Dedicated to safe care routines, patient comfort, and family communication.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;