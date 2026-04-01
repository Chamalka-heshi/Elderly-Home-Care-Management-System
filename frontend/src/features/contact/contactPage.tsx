import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar/navbar';
import Footer from '../../components/Footer/footer';
import image from '../../assets/Home/c_image.png';
import './ContactPage.css';

// ─── NEW API IMPORTS ──────────────────────────────────────────────────────────
import { getContactInfo, submitContactMessage } from '../../api/contact/public-contact.api';
import type { ContactInfo } from '../../api/contact/contact.types';

// ─── Types ────────────────────────────────────────────────────────────────

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

// ─── Validation helpers ───────────────────────────────────────────────────

const validators = {
  fullName: (v: string) =>
    !v.trim() ? 'Full name is required' : v.trim().length < 2 ? 'Name is too short' : '',
  email: (v: string) => {
    if (!v.trim()) return 'Email is required';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address';
  },
  phone: (v: string) => {
    if (!v.trim()) return '';
    return /^[+\d][\d\s\-().]{6,19}$/.test(v) ? '' : 'Enter a valid phone number';
  },
  message: (v: string) =>
    !v.trim() ? 'Message is required' : v.trim().length < 10 ? 'Message is too short' : '',
};

/**
 * Build a Google Maps embed src from whatever we have — no new backend field needed.
 *
 * Strategy (in priority order):
 * 1. If mapUrl looks like a full maps.google.com URL, swap ?output=embed in.
 * 2. Build from addressLine1 + city (works without an API key).
 */
const resolveEmbedUrl = (info: ContactInfo): string | null => {
  // 1 — full Google Maps URL (contains /maps/place/ or maps?q=)
  if (info.mapUrl?.trim()) {
    try {
      const u = new URL(info.mapUrl);
      // already an embeddable maps URL → just ensure output=embed
      if (u.hostname.includes('google.com') && u.pathname.includes('/maps')) {
        u.searchParams.set('output', 'embed');
        return u.toString();
      }
    } catch {
      // not a parseable URL — fall through
    }
  }

  // 2 — build from address fields (always present once API responds)
  if (info.addressLine1?.trim() && info.city?.trim()) {
    const q = [info.addressLine1, info.addressLine2, info.city]
      .filter(Boolean)
      .join(', ');
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  }

  return null;
};

// ─── Component ────────────────────────────────────────────────────────────

const ContactPage: React.FC = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    message: '',
  });

  const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
    fullName: false,
    email: false,
    phone: false,
    message: false,
  });

  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [charCount, setCharCount] = useState(0);

  // ── Derived validation ──────────────────────────────────────────────────
  const errors = useMemo<Record<keyof FormData, string>>(
    () => ({
      fullName: validators.fullName(formData.fullName),
      email:    validators.email(formData.email),
      phone:    validators.phone(formData.phone),
      message:  validators.message(formData.message),
    }),
    [formData],
  );

  const isFormValid = useMemo(
    () => !errors.fullName && !errors.email && !errors.phone && !errors.message,
    [errors],
  );

  // Embed URL — derived from existing API fields, no extra backend field needed
  const mapEmbedUrl = useMemo(
    () => (contactInfo ? resolveEmbedUrl(contactInfo) : null),
    [contactInfo],
  );

  // ── Fetch contact info ──────────────────────────────────────────────────
  useEffect(() => {
    getContactInfo()
      .then(setContactInfo)
      .catch((err) => {
        console.error('Failed to load contact info:', err);
        setContactInfo(null);
      })
      .finally(() => setInfoLoading(false));
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name === 'message') setCharCount(value.length);
    },
    [],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setTouched((prev) => ({ ...prev, [e.target.name]: true }));
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, phone: true, message: true });
    if (!isFormValid) return;

    setSubmitState('submitting');
    try {
      await submitContactMessage({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        message: formData.message,
      });
      setSubmitState('success');
      setFormData({ fullName: '', email: '', phone: '', message: '' });
      setTouched({ fullName: false, email: false, phone: false, message: false });
      setCharCount(0);
    } catch {
      setSubmitState('error');
    }
  };

  const handleMapClick = () => {
    if (contactInfo?.mapUrl) {
      window.open(contactInfo.mapUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // ── Utilities ────────────────────────────────────────────────────────────
  const Skeleton = () => <div className="cp-skeleton" />;

  const fieldClass = (name: keyof FormData, base: string) => {
    if (!touched[name]) return base;
    return errors[name] ? `${base} cp-field__input--error` : `${base} cp-field__input--valid`;
  };

  const charWarning = charCount > 1800;
  const charDanger  = charCount >= 2000;

  return (
    <div className="cp-root">
      <Navbar />

      {/* ── HERO ────────────────────────────────────────────── */}
      <section
        className="cp-hero"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="cp-hero__overlay" />
        <div className="cp-hero__orb cp-hero__orb--a" />
        <div className="cp-hero__orb cp-hero__orb--b" />

        <div className="cp-hero__inner">
          <span className="cp-hero__pill">Care Home Support</span>
          <h1 className="cp-hero__title">
            Let's <em>Talk</em>
          </h1>
          <p className="cp-hero__sub">
            Questions about our services? We're here — 24 hours a day,
            every day of the year.
          </p>
          <div className="cp-hero__ctas">
            <a href="#contact-form" className="cp-btn cp-btn--primary">
              Send a Message
            </a>
            {contactInfo?.phoneEmergency && (
              <a
                href={`tel:${contactInfo.phoneEmergency}`}
                className="cp-btn cp-btn--ghost"
              >
                Emergency Line
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── MAIN ────────────────────────────────────────────── */}
      <main className="cp-main">
        <div className="cp-grid">

          {/* ── FORM CARD ───────────────────────────────────── */}
          <section id="contact-form" className="cp-card">
            <div className="cp-card__stripe" />

            {submitState === 'success' ? (
              <div className="cp-success">
                <div className="cp-success__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="cp-success__title">Message Sent!</h2>
                <p className="cp-success__body">
                  Thank you for reaching out. We'll be in touch within 24 hours.
                </p>
                <button
                  className="cp-btn cp-btn--primary"
                  onClick={() => setSubmitState('idle')}
                >
                  Send Another
                </button>
              </div>
            ) : (
              <div className="cp-card__body">
                <div className="cp-form-header">
                  <h2 className="cp-form-header__title">Send Us a Message</h2>
                  <p className="cp-form-header__sub">
                    Fill in the form below and we'll respond within 24 hours.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="cp-form">

                  {/* Row: Full Name + Email */}
                  <div className="cp-form__row">
                    <div className="cp-field">
                      <label htmlFor="fullName" className="cp-field__label">Full Name</label>
                      <div className="cp-field__wrap">
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Jane Smith"
                          required
                          autoComplete="name"
                          aria-describedby={touched.fullName && errors.fullName ? 'fullName-error' : undefined}
                          aria-invalid={touched.fullName && !!errors.fullName}
                          className={fieldClass('fullName', 'cp-field__input')}
                        />
                        {touched.fullName && !errors.fullName && (
                          <span className="cp-field__tick" aria-hidden>✓</span>
                        )}
                      </div>
                      {touched.fullName && errors.fullName && (
                        <span id="fullName-error" className="cp-field__error" role="alert">
                          {errors.fullName}
                        </span>
                      )}
                    </div>

                    <div className="cp-field">
                      <label htmlFor="email" className="cp-field__label">Email</label>
                      <div className="cp-field__wrap">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="example@email.com"
                          required
                          autoComplete="email"
                          aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                          aria-invalid={touched.email && !!errors.email}
                          className={fieldClass('email', 'cp-field__input')}
                        />
                        {touched.email && !errors.email && (
                          <span className="cp-field__tick" aria-hidden>✓</span>
                        )}
                      </div>
                      {touched.email && errors.email && (
                        <span id="email-error" className="cp-field__error" role="alert">
                          {errors.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="cp-field">
                    <label htmlFor="phone" className="cp-field__label">
                      Phone <span className="cp-field__optional">(optional)</span>
                    </label>
                    <div className="cp-field__wrap">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="+94 77 777 7777"
                        autoComplete="tel"
                        aria-describedby={touched.phone && errors.phone ? 'phone-error' : undefined}
                        aria-invalid={touched.phone && !!errors.phone}
                        className={fieldClass('phone', 'cp-field__input')}
                      />
                      {touched.phone && !errors.phone && formData.phone && (
                        <span className="cp-field__tick" aria-hidden>✓</span>
                      )}
                    </div>
                    {touched.phone && errors.phone && (
                      <span id="phone-error" className="cp-field__error" role="alert">
                        {errors.phone}
                      </span>
                    )}
                  </div>

                  {/* Message */}
                  <div className="cp-field">
                    <div className="cp-field__label-row">
                      <label htmlFor="message" className="cp-field__label">Message</label>
                      <span
                        className={`cp-field__count ${
                          charDanger  ? 'cp-field__count--danger'  :
                          charWarning ? 'cp-field__count--warning' : ''
                        }`}
                      >
                        {charCount}/2000
                      </span>
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Tell us how we can help — include patient name, preferred date, or requested service if relevant."
                      required
                      rows={5}
                      maxLength={2000}
                      aria-describedby={touched.message && errors.message ? 'message-error' : undefined}
                      aria-invalid={touched.message && !!errors.message}
                      className={fieldClass('message', 'cp-field__textarea')}
                    />
                    {touched.message && errors.message && (
                      <span id="message-error" className="cp-field__error" role="alert">
                        {errors.message}
                      </span>
                    )}
                  </div>

                  {submitState === 'error' && (
                    <div className="cp-alert cp-alert--error" role="alert">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{ flexShrink: 0 }}>
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Something went wrong. Please try again or call us directly.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitState === 'submitting'}
                    className="cp-btn cp-btn--submit"
                    aria-busy={submitState === 'submitting'}
                  >
                    {submitState === 'submitting' ? (
                      <><span className="cp-spinner" aria-hidden />Sending…</>
                    ) : (
                      'Send Message'
                    )}
                    <span className="cp-btn__shine" aria-hidden />
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* ── INFO CARDS ──────────────────────────────────── */}
          <aside className="cp-info" aria-label="Contact information">

            {/* Call */}
            <div className="cp-info-card cp-info-card--green">
              <div className="cp-info-card__icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <div>
                <h3 className="cp-info-card__title">Call Us</h3>
                <p className="cp-info-card__sub">Available 24/7 for emergencies</p>
                {infoLoading ? <Skeleton /> : contactInfo?.phonePrimary ? (
                  <a href={`tel:${contactInfo.phonePrimary}`} className="cp-info-card__link">
                    {contactInfo.phonePrimary}
                  </a>
                ) : <span className="cp-info-card__link">—</span>}
              </div>
            </div>

            {/* Email */}
            <div className="cp-info-card cp-info-card--purple">
              <div className="cp-info-card__icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <h3 className="cp-info-card__title">Email Us</h3>
                <p className="cp-info-card__sub">Response within 24 hours</p>
                {infoLoading ? <Skeleton /> : contactInfo?.email ? (
                  <a href={`mailto:${contactInfo.email}`} className="cp-info-card__link">
                    {contactInfo.email}
                  </a>
                ) : <span className="cp-info-card__link">—</span>}
              </div>
            </div>

            {/* ── Visit Us — with embedded map ──────────────── */}
            <div className="cp-info-card cp-info-card--neutral cp-info-card--map">

              {/* Address row */}
              <div className="cp-info-card__top">
                <div className="cp-info-card__icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="cp-info-card__title-row">
                    <h3 className="cp-info-card__title">Visit Us</h3>
                    {!infoLoading && contactInfo?.mapUrl && (
                      <span
                        className="cp-map-badge"
                        onClick={handleMapClick}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleMapClick()}
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10">
                          <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                          <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                        </svg>
                        Open Maps
                      </span>
                    )}
                  </div>
                  {infoLoading ? <Skeleton /> : contactInfo?.addressLine1 ? (
                    <p className="cp-info-card__address">
                      {contactInfo.addressLine1}
                      {contactInfo.addressLine2 && <>, {contactInfo.addressLine2}</>}
                      <br />{contactInfo.city}
                    </p>
                  ) : <span className="cp-info-card__link">—</span>}
                </div>
              </div>

              {/* Embedded map — shown once contact info loads */}
              {!infoLoading && mapEmbedUrl && (
                <div className="cp-map-embed">
                  <iframe
                    src={mapEmbedUrl}
                    title="Our location on Google Maps"
                    width="100%"
                    height="200"
                    style={{ border: 0, borderRadius: '8px', display: 'block' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>

            {/* Hours */}
            <div className="cp-info-card cp-info-card--hours">
              <div className="cp-info-card__icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="cp-info-card__title">Opening Hours</h3>
                <p className="cp-info-card__sub">When we're available</p>
                {infoLoading ? <Skeleton /> : (
                  <p className="cp-info-card__address">
                    {contactInfo?.openHours ?? '—'}
                    <br />
                    <span className="cp-badge cp-badge--green">Emergency line open 24/7</span>
                  </p>
                )}
              </div>
            </div>

            <div className="cp-trust">
              <span className="cp-trust__dot" />
              <p>
                Your details are safe with us. We only use them to respond to
                your enquiry.
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