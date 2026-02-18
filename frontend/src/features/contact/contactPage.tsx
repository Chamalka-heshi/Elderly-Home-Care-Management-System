import React, { useMemo, useState } from 'react';
import Navbar from '../../components/Navbar/navbar';
import Footer from '../../components/Footer/footer';
import image from '../../assets/Home/c_image.png';
import './ContactPage.css';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const isFormValid = useMemo(() => {
    return formData.fullName.trim() && formData.email.trim() && formData.message.trim();
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ fullName: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-[#F6F8F7]">
      <Navbar />

      {/* HERO */}
      <section
        className="hero-section relative overflow-hidden"
        style={{
          backgroundImage: `url(${image})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        {/* overlay */}
        <div className="hero-overlay" />

        {/* subtle decorative shapes */}
        <div className="floating-orb orb-1" />
        <div className="floating-orb orb-2" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-[320px] md:h-[380px] flex items-center">
          <div className="hero-content max-w-3xl">
            <p className="inline-flex items-center gap-2 text-white/90 text-sm md:text-base mb-3">
              <span className="hero-pill">Care Home Support</span>
              <span className="hidden sm:inline text-white/70">•</span>
              <span className="hidden sm:inline text-white/80">We respond within 24 hours</span>
            </p>

            <h1 className="text-white text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Get in Touch With Us
            </h1>

            <p className="mt-3 text-white/85 text-sm md:text-lg leading-relaxed">
              We&apos;re here to help. Contact us with any questions about our services.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#contact-form" className="cta-primary">
                Send a Message
              </a>
              <a href="tel:+94777777777" className="cta-secondary">
                Call Emergency Line
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
          {/* FORM */}
          <section
            id="contact-form"
            className="contact-form-card relative bg-white/90 backdrop-blur rounded-2xl shadow-[0_18px_50px_rgba(16,24,40,0.08)] border border-black/5 overflow-hidden"
          >
            <div className="gradient-border" />

            <div className="p-6 md:p-8 lg:p-10">
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#101828]">
                  Send Us a Message
                </h2>
                <p className="mt-2 text-sm md:text-base text-[#475467]">
                  Fill out the form below and we&apos;ll get back to you shortly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="fullName" className="form-label">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g., Sachin Maleesha"
                    required
                    className="form-input"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    required
                    className="form-input"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="form-label">
                    Phone Number <span className="text-[#98A2B3] font-medium">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(+94) 77 777 7777"
                    className="form-input"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label htmlFor="message" className="form-label">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    required
                    rows={5}
                    className="form-textarea"
                  />
                  <p className="text-xs text-[#667085]">
                    Tip: Include patient name / preferred date / requested service (if applicable).
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className="submit-btn relative w-full rounded-xl py-3.5 px-6 text-sm md:text-base font-semibold text-white"
                >
                  <span className="relative z-10">Send Message</span>
                  <span className="button-shine" aria-hidden="true" />
                </button>

                {!isFormValid && (
                  <p className="text-xs text-[#667085]">
                    Please fill <b>Full Name</b>, <b>Email</b> and <b>Message</b> to continue.
                  </p>
                )}
              </form>
            </div>
          </section>

          {/* INFO CARDS */}
          <aside className="space-y-5">
            {/* Call */}
            <div className="contact-card contact-card--green">
              <div className="contact-icon">
                <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>

              <div className="min-w-0">
                <h3 className="contact-title">Call Us</h3>
                <p className="contact-subtitle">Available 24/7 for emergencies</p>
                <a href="tel:+94777777777" className="contact-link">
                  (+94) 77 7777 777
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="contact-card contact-card--purple">
              <div className="contact-icon">
                <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>

              <div className="min-w-0">
                <h3 className="contact-title">Email Us</h3>
                <p className="contact-subtitle">We&apos;ll respond within 24 hours</p>
                <a href="mailto:carehome@gmail.com" className="contact-link break-all">
                  carehome@gmail.com
                </a>
              </div>
            </div>

            {/* Visit */}
            <div className="contact-card contact-card--neutral">
              <div className="contact-icon">
                <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <h3 className="contact-title">Visit Us</h3>
                <p className="contact-subtitle">Our location</p>
                <p className="text-sm md:text-base text-[#344054] leading-relaxed">
                  122 New Road,
                  <br />
                  New City, Colombo
                </p>
              </div>
            </div>

            {/* Optional extra: small trust card */}
            <div className="trust-card">
              <div className="trust-dot" />
              <p className="text-sm text-[#475467]">
                Your message is safe with us. We only use your details to respond to your request.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;