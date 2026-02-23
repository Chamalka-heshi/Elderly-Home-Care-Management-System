

import React, { useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../../auth/AuthContext";

// ── Common shared components ───
import {
  IconMail, IconPhone, IconChevronLeft, IconAlert,
  IconUser, IconShield, IconSettings,
} from "../../common/icons";
import {
  FieldLabel, GlassInput, GlassSelect,
  SectionCard, PrimaryBtn, Pill,
  AmbientBg, ToastList,
  type Toast,
} from "../../common/ui";
import PasswordTab   from "../../common/PasswordTab";
import DangerZoneTab from "../../common/DangerZoneTab";

// ── Types 

type TabKey = "profile" | "password" | "danger";

interface Props {
  /** Called when the user clicks "Back to Dashboard" */
  onBack: () => void;
}

// ── Component 

const AdminProfile: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuth();

  // ── UI state 
  const [tab,    setTab]    = useState<TabKey>("profile");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Editable profile fields 
  const [fullName,      setFullName]      = useState(user?.full_name     ?? "");
  const [contactNumber, setContactNumber] = useState(user?.contactNumber ?? "");
  const [department,    setDepartment]    = useState("");
  const [adminLevel,    setAdminLevel]    = useState<"super" | "standard" | "limited">("standard");

  // ── Password fields 
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [pwLoading,   setPwLoading]   = useState(false);
  const [profLoading, setProfLoading] = useState(false);

  // ── Helpers 

  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  /** Two-letter initials derived from the user's display name */
  const initials = useMemo(() => {
    const name  = user?.full_name ?? "Admin";
    const parts = name.trim().split(" ").filter(Boolean);
    return (
      (parts[0]?.[0] ?? "A") +
      (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")
    ).toUpperCase();
  }, [user?.full_name]);

  /** Human-readable role label */
  const roleLabel =
    user?.role === "admin"     ? "Administrator" :
    user?.role === "doctor"    ? "Doctor"        :
    user?.role === "caregiver" ? "Caregiver"     : "Family Member";

  // ── Handlers 

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) { addToast("error", "Full name cannot be empty."); return; }
    try {
      setProfLoading(true);
      // TODO production: );
      await new Promise((r) => setTimeout(r, 600));
      addToast("success", "Profile updated successfully.");
    } catch {
      addToast("error", "Failed to update profile.");
    } finally {
      setProfLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw)          { addToast("error", "Enter your current password.");    return; }
    if (newPw.length < 8)    { addToast("error", "New password must be 8+ chars."); return; }
    if (newPw !== confirmPw) { addToast("error", "New passwords do not match.");     return; }
    try {
      setPwLoading(true);
      // TODO production:);
      await new Promise((r) => setTimeout(r, 700));
      addToast("success", "Password changed successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch {
      addToast("error", "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  // ── Tab definitions 

  const tabs: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: "profile",  label: "Profile",     icon: IconUser  },
    { key: "password", label: "Password",    icon: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7.5 11V8.8A4.5 4.5 0 0 1 12 4.3a4.5 4.5 0 0 1 4.5 4.5V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M7.2 11h9.6c1 0 1.7.8 1.7 1.7v6.1c0 1-.8 1.7-1.7 1.7H7.2c-1 0-1.7-.8-1.7-1.7v-6.1c0-1 .8-1.7 1.7-1.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )
    },
    { key: "danger",   label: "Danger Zone", icon: IconAlert },
  ];

  // ── Render 

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Fixed ambient gradient blobs */}
      <AmbientBg />

      {/* Toast notification stack */}
      <ToastList toasts={toasts} />

      {/* ── Sticky page header ── */}
      <header className="sticky top-0 z-40 border-b border-white/30 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">

          {/* Left — avatar + name + role */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/25">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">{user?.full_name ?? "Admin User"}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <IconShield className="h-3 w-3" />
                {roleLabel}
              </div>
            </div>
          </div>

          {/* Right — back button */}
          <button
            onClick={onBack}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white hover:shadow-md"
          >
            <IconChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">

        {/* Page header strip — role pill + tab bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Pill tone="emerald">{roleLabel}</Pill>
            <p className="text-sm text-slate-500">Manage your account settings and security preferences.</p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/30 bg-white/60 p-1 shadow-sm backdrop-blur-xl">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                type="button"
                className={[
                  "flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                  tab === key
                    ? key === "danger"
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                      : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                    : "text-slate-600 hover:bg-white/70",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <div className="space-y-6">
            <SectionCard
              title="Profile Information"
              subtitle="Update your personal details and admin configuration."
              rightSlot={<Pill tone="emerald">{roleLabel}</Pill>}
            >
              {/* Avatar + name row */}
              <div className="mb-6 flex flex-col gap-4 border-b border-white/30 pb-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-600 text-xl font-bold text-white shadow-lg shadow-emerald-600/25">
                      {initials}
                    </div>
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{user?.full_name ?? "Admin User"}</h3>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Pill tone="emerald">Admin</Pill>
                      <span className="text-xs text-slate-400">ID: {user?.id?.slice(0, 12)}…</span>
                    </div>
                  </div>
                </div>

                <PrimaryBtn
                  tone="emerald"
                  onClick={handleUpdateProfile}
                  disabled={profLoading}
                  className="shrink-0"
                >
                  {profLoading ? "Saving…" : "Update Profile"}
                </PrimaryBtn>
              </div>

              {/* Basic fields grid */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel>Full Name</FieldLabel>
                  <GlassInput
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <FieldLabel>
                    <span className="inline-flex items-center gap-2">
                      <IconMail className="h-4 w-4 text-slate-400" />
                      Email Address
                    </span>
                  </FieldLabel>
                  <GlassInput value={user?.email ?? ""} disabled />
                  <p className="mt-1 text-[11px] text-slate-400">Email address cannot be changed here.</p>
                </div>

                <div>
                  <FieldLabel>
                    <span className="inline-flex items-center gap-2">
                      <IconPhone className="h-4 w-4 text-slate-400" />
                      Contact Number
                    </span>
                  </FieldLabel>
                  <GlassInput
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+94 77 123 4567"
                  />
                </div>

                <div>
                  <FieldLabel>Role</FieldLabel>
                  <GlassInput value={roleLabel} disabled />
                </div>
              </div>

              {/* Admin-specific section */}
              <div className="mt-8 border-t border-white/30 pt-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <IconSettings className="h-4 w-4 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-900">Administrator Details</h4>
                  </div>
                  <PrimaryBtn
                    tone="blue"
                    onClick={() => addToast("success", "Admin details saved.")}
                    className="py-2 text-xs"
                  >
                    Save Details
                  </PrimaryBtn>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <FieldLabel>Admin Level</FieldLabel>
                    <GlassSelect
                      value={adminLevel}
                      onChange={(e) => setAdminLevel(e.target.value as typeof adminLevel)}
                    >
                      <option value="super">Super Admin</option>
                      <option value="standard">Standard Admin</option>
                      <option value="limited">Limited Admin</option>
                    </GlassSelect>
                  </div>

                  <div>
                    <FieldLabel>Department</FieldLabel>
                    <GlassInput
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g., Operations, IT, Clinical"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Account summary — read-only */}
            <SectionCard title="Account Summary" subtitle="Read-only overview of your account.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "User ID",     value: user?.id ? user.id.slice(0, 16) + "…" : "—", mono: true },
                  { label: "Role",        value: user?.role ?? "admin" },
                  { label: "Admin Level", value: adminLevel.charAt(0).toUpperCase() + adminLevel.slice(1) },
                  { label: "Status",      value: "Active" },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="rounded-2xl border border-slate-200/60 bg-white/60 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className={["mt-1.5 text-sm font-semibold text-slate-800", mono ? "font-mono" : ""].join(" ")}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── PASSWORD TAB — shared component ── */}
        {tab === "password" && (
          <PasswordTab
            currentPw={currentPw}
            newPw={newPw}
            confirmPw={confirmPw}
            pwLoading={pwLoading}
            setCurrentPw={setCurrentPw}
            setNewPw={setNewPw}
            setConfirmPw={setConfirmPw}
            onSubmit={handleChangePassword}
          />
        )}

        {/* ── DANGER ZONE TAB —  */}
        {tab === "danger" && (
          <DangerZoneTab
            deactivateNote="Temporarily disable your admin access. A super-admin can reactivate it."
            deleteNote="Permanently delete your admin account and all associated data. This cannot be undone. You will be signed out immediately."
            footerNote="As an administrator, destructive account actions require confirmation from a super-admin or the system owner. Please contact your system administrator if you need to proceed with any of the above actions."
            footerIcon={IconShield}
            onDeactivate={() => addToast("error", "Deactivation requires super-admin approval.")}
            onDelete={() => addToast("error", "Account deletion requires super-admin confirmation.")}
          />
        )}
      </main>
    </div>
  );
};

export default AdminProfile;
