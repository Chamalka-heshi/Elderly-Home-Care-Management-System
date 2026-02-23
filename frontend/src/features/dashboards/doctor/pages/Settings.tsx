

import React, { useState } from "react";

const Settings: React.FC = () => {
  const [systemName,    setSystemName]    = useState("Care Home ECMS");
  const [contactEmail,  setContactEmail]  = useState("doctor@carehome.com");
  const [specialization,setSpecialization]= useState("General Medicine");
  const [licenseNumber, setLicenseNumber] = useState("SL-MED-20210045");
  const [saved, setSaved]                 = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">

      {/* Doctor profile settings */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Doctor Profile Settings</h2>
            <p className="mt-1 text-sm text-slate-500">Update your professional and contact details.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid max-w-xl grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">System Name</label>
            <input
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Specialization</label>
            <input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Cardiology"
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">License Number</label>
            <input
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div className="flex items-center gap-4 md:col-span-2">
            <button
              type="submit"
              className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              Save Settings
            </button>
            {saved && (
              <span className="text-sm font-semibold text-emerald-600">✓ Settings saved</span>
            )}
          </div>
        </form>
      </div>

      {/* API Configuration — read-only, same as admin */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-sky-500/12 blur-3xl" />

        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">API Configuration</h2>
          <p className="mt-1 text-sm text-slate-500">Backend connection information — read only.</p>
        </div>

        <div className="max-w-xl space-y-3">
          {[
            { label: "API Base URL",    value: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api" },
            { label: "Auth Strategy",   value: "Bearer Token (JWT)" },
            { label: "Current Role",    value: "doctor" },
            { label: "Panel Version",   value: "1.0.0" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/60 px-4 py-3">
              <span className="text-sm font-medium text-slate-600">{label}</span>
              <code className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-700">{value}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
