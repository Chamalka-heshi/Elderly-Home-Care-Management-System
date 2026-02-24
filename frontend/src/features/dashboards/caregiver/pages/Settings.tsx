import React, { useState } from "react";

const Settings: React.FC = () => {
  const [fullName,      setFullName]      = useState("Amali Silva");
  const [contactEmail,  setContactEmail]  = useState("caregiver@carehome.com");
  const [contactNumber, setContactNumber] = useState("+94 77 987 6543");
  const [specialization,setSpecialization]= useState("Elderly & Dementia Care");
  const [shiftPreference,setShiftPreference]= useState("Morning");
  const [address,       setAddress]       = useState("45 Hospital Road, Colombo 07");
  const [saved,         setSaved]         = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">

      {/* Caregiver profile settings */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Caregiver Profile Settings</h2>
            <p className="mt-1 text-sm text-slate-500">Update your personal and professional details.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid max-w-xl grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Contact Number</label>
            <input
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="+94 77 000 0000"
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Specialization</label>
            <input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Elderly & Dementia Care"
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Shift Preference</label>
            <select
              value={shiftPreference}
              onChange={(e) => setShiftPreference(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            >
              <option>Morning</option>
              <option>Afternoon</option>
              <option>Evening</option>
              <option>Night</option>
              <option>Flexible</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Home Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
            {saved && <span className="text-sm font-semibold text-emerald-600">✓ Settings saved</span>}
          </div>
        </form>
      </div>

      {/* Notification preferences */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-sky-500/12 blur-3xl" />

        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">Notification Preferences</h2>
          <p className="mt-1 text-sm text-slate-500">Choose how you receive alerts and updates.</p>
        </div>

        <div className="max-w-xl space-y-3">
          {[
            { label: "Shift Reminders",    desc: "Get notified before your shift starts"        },
            { label: "Patient Alerts",     desc: "Critical vital sign and health notifications"  },
            { label: "Medication Reminders",desc: "Due medication administration reminders"      },
            { label: "Schedule Changes",   desc: "Updates to your care schedule"                 },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked className="peer sr-only" />
                <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* System info */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">System Information</h2>
          <p className="mt-1 text-sm text-slate-500">Read-only connection info.</p>
        </div>
        <div className="max-w-xl space-y-3">
          {[
            { label: "API Base URL",  value: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api" },
            { label: "Auth Strategy", value: "Bearer Token (JWT)" },
            { label: "Current Role",  value: "caregiver" },
            { label: "Panel Version", value: "1.0.0" },
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
