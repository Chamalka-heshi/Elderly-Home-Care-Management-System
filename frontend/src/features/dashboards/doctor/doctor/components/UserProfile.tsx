/**
 * src/features/dashboards/doctor/components/UserProfile.tsx
 * Slide-over profile panel — mirrors admin UserProfile exactly.
 * Footer updated to "Doctor Panel".
 */

import React, { useState, useCallback } from "react";
import { useAuth } from "../../../../auth/AuthContext";

// ── Icons ─────────────────────────────────────────────────────────────────────
const XIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MailIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={1.6} strokeLinejoin="round"
      d="M4 6.5h16c.83 0 1.5.67 1.5 1.5v8c0 .83-.67 1.5-1.5 1.5H4c-.83 0-1.5-.67-1.5-1.5V8c0-.83.67-1.5 1.5-1.5Z" />
    <path strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      d="M4.5 8l6.9 4.6c.38.25.87.25 1.25 0L19.5 8" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={1.6} strokeLinejoin="round"
      d="M8.7 3.5h-2A2.2 2.2 0 0 0 4.5 5.7c0 8.2 5.6 13.8 13.8 13.8a2.2 2.2 0 0 0 2.2-2.2v-2a1.8 1.8 0 0 0-1.2-1.7l-2.7-.9a1.8 1.8 0 0 0-2 .6l-.8 1.1a12.8 12.8 0 0 1-5.1-5.1l1.1-.8a1.8 1.8 0 0 0 .6-2l-.9-2.7A1.8 1.8 0 0 0 8.7 3.5Z" />
  </svg>
);

const LockIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={1.6} strokeLinecap="round"
      d="M7.5 11V8.8A4.5 4.5 0 0 1 12 4.3a4.5 4.5 0 0 1 4.5 4.5V11" />
    <path strokeWidth={1.6} strokeLinejoin="round"
      d="M7.2 11h9.6c1 0 1.7.8 1.7 1.7v6.1c0 1-.8 1.7-1.7 1.7H7.2c-1 0-1.7-.8-1.7-1.7v-6.1c0-1 .8-1.7 1.7-1.7Z" />
  </svg>
);

const StethoscopeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      d="M4 3v5a4 4 0 004 4h0a4 4 0 004-4V3M8 21v-3a4 4 0 018 0v3M20 14a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const AlertIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={1.6} strokeLinejoin="round" d="M12 3.8 21 20H3L12 3.8Z" />
    <path strokeWidth={1.6} strokeLinecap="round" d="M12 9v5" />
    <path strokeWidth={2.2} strokeLinecap="round" d="M12 17.5h.01" />
  </svg>
);

// ── UI helpers ────────────────────────────────────────────────────────────────
const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
    {children}
  </label>
);

const GlassInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = "", ...props
}) => (
  <input
    {...props}
    className={[
      "w-full rounded-xl border border-white/30 bg-white/70 px-4 py-2.5 text-sm text-slate-900",
      "shadow-[0_8px_20px_-15px_rgba(0,0,0,0.5)] backdrop-blur",
      "outline-none focus:border-emerald-400/60 focus:bg-white focus:shadow-[0_12px_40px_-20px_rgba(16,185,129,0.7)]",
      "transition disabled:cursor-not-allowed disabled:opacity-60",
      className,
    ].join(" ")}
  />
);

type TabKey = "profile" | "password";

interface Toast { id: number; kind: "success" | "error"; message: string; }

interface Props { open: boolean; onClose: () => void; }

// ── Component ─────────────────────────────────────────────────────────────────
const UserProfile: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("profile");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [fullName, setFullName]           = useState(user?.full_name ?? "");
  const [contactNumber, setContactNumber] = useState(user?.contactNumber ?? "");
  const [currentPw, setCurrentPw]         = useState("");
  const [newPw, setNewPw]                 = useState("");
  const [confirmPw, setConfirmPw]         = useState("");

  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const initials = (() => {
    const name = user?.full_name ?? "Doctor";
    const parts = name.trim().split(" ").filter(Boolean);
    const first = parts[0]?.[0] ?? "D";
    const last  = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase();
  })();

  const roleLabel =
    user?.role === "doctor"    ? "Doctor"               :
    user?.role === "admin"     ? "System Administrator" :
    user?.role === "caregiver" ? "Caregiver"            : "Family Member";

  const handleUpdateProfile = async () => {
    addToast("success", "Profile updated successfully.");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) { addToast("error", "Please fill in all password fields."); return; }
    if (newPw !== confirmPw)                { addToast("error", "New passwords do not match.");          return; }
    if (newPw.length < 8)                  { addToast("error", "Password must be at least 8 characters."); return; }
    addToast("success", "Password changed successfully.");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  if (!open) return null;

  return (
    <>
      <button className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm" onClick={onClose} aria-label="Close profile" />

      <aside className={[
        "fixed right-0 top-0 z-[80] flex h-full w-full max-w-[420px] flex-col",
        "border-l border-white/20 bg-white/80 backdrop-blur-2xl",
        "shadow-[-40px_0_80px_-20px_rgba(2,6,23,0.18)]",
        "overflow-y-auto",
      ].join(" ")}>

        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl" />

        {/* Header */}
        <div className="relative border-b border-white/30 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-600/30">
                  {initials}
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">{user?.full_name ?? "Doctor User"}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <StethoscopeIcon />
                  <span>{roleLabel}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition">
              <XIcon />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <MailIcon />{user?.email}
            </span>
            {user?.contactNumber && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                <PhoneIcon />{user.contactNumber}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/30 px-6 py-3">
          <div className="flex gap-1 rounded-2xl border border-white/30 bg-slate-100/70 p-1">
            {(["profile", "password"] as TabKey[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={[
                  "flex-1 rounded-xl py-2 text-xs font-semibold capitalize transition",
                  tab === t ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "text-slate-600 hover:bg-white/70",
                ].join(" ")}>
                {t === "profile" ? "Profile Info" : "Change Password"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 px-6 py-6">

          {toasts.length > 0 && (
            <div className="mb-5 flex flex-col gap-2">
              {toasts.map((t) => (
                <div key={t.id} className={[
                  "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                  t.kind === "success" ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-red-50 text-red-800 ring-1 ring-red-200",
                ].join(" ")}>
                  {t.kind === "success" ? <CheckIcon /> : <AlertIcon />}
                  {t.message}
                </div>
              ))}
            </div>
          )}

          {/* Profile tab */}
          {tab === "profile" && (
            <div className="space-y-5">
              <div>
                <FieldLabel>Full Name</FieldLabel>
                <GlassInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <FieldLabel><span className="inline-flex items-center gap-1.5"><MailIcon /> Email address</span></FieldLabel>
                <GlassInput value={user?.email ?? ""} disabled className="opacity-60" />
                <p className="mt-1 text-[11px] text-slate-400">Email cannot be changed here.</p>
              </div>
              <div>
                <FieldLabel><span className="inline-flex items-center gap-1.5"><PhoneIcon /> Contact Number</span></FieldLabel>
                <GlassInput value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+94 77 123 4567" />
              </div>
              <div>
                <FieldLabel>Role</FieldLabel>
                <GlassInput value={roleLabel} disabled className="opacity-60" />
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/60 px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-3">Account Info</p>
                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>User ID</span>
                    <code className="rounded-lg bg-slate-100 px-2 py-0.5 text-slate-700 font-mono">{user?.id?.slice(0, 16) ?? "—"}…</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Role</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-100">{user?.role}</span>
                  </div>
                </div>
              </div>
              <button onClick={handleUpdateProfile}
                className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-[0.98]">
                Update Profile
              </button>
            </div>
          )}

          {/* Password tab */}
          {tab === "password" && (
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/60 px-4 py-3">
                <LockIcon />
                <p className="text-xs text-amber-800">Choose a strong password that's at least 8 characters and unique to this account.</p>
              </div>
              <div>
                <FieldLabel>Current Password</FieldLabel>
                <GlassInput type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Enter current password" autoComplete="current-password" />
              </div>
              <div>
                <FieldLabel>New Password</FieldLabel>
                <GlassInput type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Enter new password (8+ chars)" autoComplete="new-password" />
              </div>
              <div>
                <FieldLabel>Confirm New Password</FieldLabel>
                <GlassInput type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" />
              </div>
              {newPw && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500">Password strength</p>
                  <div className="flex gap-1">
                    {[8, 12, 16].map((len, i) => (
                      <div key={len} className={["h-1.5 flex-1 rounded-full transition",
                        newPw.length >= len ? i === 0 ? "bg-amber-400" : i === 1 ? "bg-emerald-400" : "bg-emerald-600" : "bg-slate-200",
                      ].join(" ")} />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {newPw.length < 8 ? "Too short" : newPw.length < 12 ? "Moderate" : newPw.length < 16 ? "Good" : "Strong"}
                  </p>
                </div>
              )}
              <button type="submit"
                className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-[0.98]">
                Change Password
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/30 px-6 py-4">
          <p className="text-center text-[11px] text-slate-400">
            Care Home ECMS · Doctor Panel · Secure session
          </p>
        </div>
      </aside>
    </>
  );
};

export default UserProfile;
