import React, { useState, useEffect } from "react";
import TableShell from "../../common/widgets/TableShell";
import { getContactInfo, updateContactInfo } from "../../../../api/contact.api";

// ── Types ──────────────────────────────────────────────────────────────────

interface ContactForm {
  phonePrimary:   string;
  phoneEmergency: string;
  email:          string;
  addressLine1:   string;
  addressLine2:   string;
  city:           string;
  openHours:      string;
  mapUrl:         string;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const EMPTY_CONTACT: ContactForm = {
  phonePrimary:   '',
  phoneEmergency: '',
  email:          '',
  addressLine1:   '',
  addressLine2:   '',
  city:           '',
  openHours:      '',
  mapUrl:         '',
};

// ── Reusable field components ──────────────────────────────────────────────

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50';

interface FieldProps {
  label:       string;
  hint?:       string;
  optional?:   boolean;
  children:    React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, hint, optional, children }) => (
  <label className="grid gap-1.5">
    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
      {label}
      {optional && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
          optional
        </span>
      )}
    </span>
    {children}
    {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
  </label>
);

// ── Component ──────────────────────────────────────────────────────────────

const Settings: React.FC = () => {
  // ── Contact info state ─────────────────────────────────────────────────
  const [contact,     setContact]     = useState<ContactForm>(EMPTY_CONTACT);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [saveState,   setSaveState]   = useState<SaveState>('idle');
  const [saveError,   setSaveError]   = useState('');

  // ── Load existing contact info on mount ────────────────────────────────
  useEffect(() => {
    getContactInfo()
      .then((info) => {
        setContact({
          phonePrimary:   info.phonePrimary   ?? '',
          phoneEmergency: info.phoneEmergency ?? '',
          email:          info.email          ?? '',
          addressLine1:   info.addressLine1   ?? '',
          addressLine2:   info.addressLine2   ?? '',
          city:           info.city           ?? '',
          openHours:      info.openHours      ?? '',
          mapUrl:         info.mapUrl         ?? '',
        });
      })
      .catch(() => {/* keep empty defaults */})
      .finally(() => setLoadingInfo(false));
  }, []);

  const handleContactChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setContact((prev) => ({ ...prev, [name]: value }));
  };

  // ── Save contact info ──────────────────────────────────────────────────
  const handleSaveContact = async () => {
    setSaveState('saving');
    setSaveError('');
    try {
      // Strip empty optional fields so backend doesn't overwrite with ''
      const payload = Object.fromEntries(
        Object.entries(contact).filter(([, v]) => v.trim() !== ''),
      );
      await updateContactInfo(payload);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to save. Please try again.');
      setSaveState('error');
    }
  };

  const isSaving = saveState === 'saving';

  return (
    <div className="space-y-6">

      {/* ── Contact Information ──────────────────────────────────────────── */}
      <TableShell
        title="Contact Information"
        subtitle="These details appear on the public Contact page and in automated reply emails."
      >
        {loadingInfo ? (
          <div className="grid max-w-xl gap-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid max-w-xl gap-5">

            {/* Phone numbers */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Primary Phone" hint="Shown on the contact page under 'Call Us'">
                <input
                  name="phonePrimary"
                  value={contact.phonePrimary}
                  onChange={handleContactChange}
                  placeholder="+94 11 123 4567"
                  disabled={isSaving}
                  className={inputClass}
                />
              </Field>
              <Field label="Emergency Phone" optional hint="Shown as the emergency line button in the hero">
                <input
                  name="phoneEmergency"
                  value={contact.phoneEmergency}
                  onChange={handleContactChange}
                  placeholder="+94 77 000 0000"
                  disabled={isSaving}
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Email */}
            <Field label="Contact Email" hint="Used in reply emails and shown on the contact page">
              <input
                type="email"
                name="email"
                value={contact.email}
                onChange={handleContactChange}
                placeholder="info@carehome.lk"
                disabled={isSaving}
                className={inputClass}
              />
            </Field>

            {/* Address */}
            <Field label="Address Line 1">
              <input
                name="addressLine1"
                value={contact.addressLine1}
                onChange={handleContactChange}
                placeholder="123 Serenity Lane"
                disabled={isSaving}
                className={inputClass}
              />
            </Field>

            <Field label="Address Line 2" optional>
              <input
                name="addressLine2"
                value={contact.addressLine2}
                onChange={handleContactChange}
                placeholder="Suite 4B"
                disabled={isSaving}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="City">
                <input
                  name="city"
                  value={contact.city}
                  onChange={handleContactChange}
                  placeholder="Colombo"
                  disabled={isSaving}
                  className={inputClass}
                />
              </Field>
              <Field label="Opening Hours" optional hint="e.g. Mon–Fri: 8 AM – 6 PM">
                <input
                  name="openHours"
                  value={contact.openHours}
                  onChange={handleContactChange}
                  placeholder="Mon–Fri: 8 AM – 6 PM"
                  disabled={isSaving}
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Map URL */}
            <Field
              label="Google Maps URL"
              optional
              hint="Paste the 'Share' link from Google Maps — used for the embedded map and 'Open Maps' button"
            >
              <input
                name="mapUrl"
                value={contact.mapUrl}
                onChange={handleContactChange}
                placeholder="https://maps.google.com/maps?q=..."
                disabled={isSaving}
                className={inputClass}
              />
            </Field>

            {/* Save button */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSaveContact}
                disabled={isSaving}
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60 disabled:translate-y-0"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Saving…
                  </span>
                ) : 'Save Contact Info'}
              </button>

              {saveState === 'saved' && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd"/>
                  </svg>
                  Saved successfully
                </span>
              )}

              {saveState === 'error' && (
                <span className="text-sm font-semibold text-red-500">
                  ✕ {saveError}
                </span>
              )}
            </div>
          </div>
        )}
      </TableShell>

      {/* ── API Configuration (read-only) ────────────────────────────────── */}
      <TableShell
        title="API Configuration"
        subtitle="Backend connection details (read-only)."
      >
        <div className="grid max-w-xl gap-3 text-sm">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span className="font-medium text-slate-600">API Base URL</span>
            <code className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}
            </code>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span className="font-medium text-slate-600">Auth Strategy</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              Bearer Token (JWT)
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span className="font-medium text-slate-600">Environment</span>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
              {import.meta.env.MODE ?? 'development'}
            </span>
          </div>
        </div>
      </TableShell>

    </div>
  );
};

export default Settings;