
import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";

const Settings: React.FC = () => {
  const [systemName,  setSystemName]  = useState("Care Home ECMS");
  const [contactEmail,setContactEmail]= useState("admin@carehome.com");
  const [saved, setSaved]             = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <TableShell title="System Settings" subtitle="Configure your Care Home platform preferences.">
        <div className="grid max-w-xl gap-5">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-600">System Name</span>
            <input
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Contact Email</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              Save Settings
            </button>
            {saved && <span className="text-sm font-semibold text-emerald-600">✓ Saved successfully</span>}
          </div>
        </div>
      </TableShell>

      <TableShell title="API Configuration" subtitle="Backend connection details (read-only).">
        <div className="grid max-w-xl gap-3 text-sm">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span className="font-medium text-slate-600">API Base URL</span>
            <code className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {import.meta.env.VITE_API_URL || "http://localhost:3000/api"}
            </code>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span className="font-medium text-slate-600">Auth Strategy</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              Bearer Token (JWT)
            </span>
          </div>
        </div>
      </TableShell>
    </div>
  );
};

export default Settings;
