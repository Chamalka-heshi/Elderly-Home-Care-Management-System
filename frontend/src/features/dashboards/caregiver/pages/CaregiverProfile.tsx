import React, { useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../../auth/AuthContext";

// ── Common shared components ─
import {
  IconMail, IconPhone, IconChevronLeft, IconAlert,
  IconUsers, IconSettings,
} from "../../common/icons";
import {
  FieldLabel, GlassInput, GlassSelect,
  SectionCard, PrimaryBtn, Pill,
  AmbientBg, ToastList,
  type Toast,
} from "../../common/ui";
import PasswordTab   from "../../common/PasswordTab";
import DangerZoneTab from "../../common/DangerZoneTab";

// ── Types ──
type TabKey = "profile" | "password" | "danger";

interface Props {
  onBack: () => void;
}

// ── Component ─
const CaregiverProfile: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuth();

  const [tab,    setTab]    = useState<TabKey>("profile");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Editable fields
  const [fullName,        setFullName]        = useState(user?.full_name     ?? "");
  const [contactNumber,   setContactNumber]   = useState(user?.contactNumber ?? "");
  const [specialization,  setSpecialization]  = useState("Elderly & Dementia Care");
  const [shiftPreference, setShiftPreference] = useState("Morning");
  const [employeeId,      setEmployeeId]      = useState("CG-2024-0042");
  const [address,         setAddress]         = useState("45 Hospital Road, Colombo 07");

  // Password fields
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [pwLoading,   setPwLoading]   = useState(false);
  const [profLoading, setProfLoading] = useState(false);

  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const initials = useMemo(() => {
    const name  = user?.full_name ?? "Caregiver User";
    const parts = name.trim().split(" ").filter(Boolean);
    return (
      (parts[0]?.[0] ?? "C") +
      (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")
    ).toUpperCase();
  }, [user?.full_name]);

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) { addToast("error", "Full name cannot be empty."); return; }
    try {
      setProfLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      addToast("success", "Profile updated successfully.");
    } catch {
      addToast("error", "Failed to update profile.");
    } finally {
      setProfLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { addToast("error", "All password fields are required."); return; }
    if (newPw !== confirmPw) { addToast("error", "New passwords do not match."); return; }
    if (newPw.length < 8)   { addToast("error", "Password must be at least 8 characters."); return; }
    try {
      setPwLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      addToast("success", "Password changed successfully.");
    } catch {
      addToast("error", "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: "profile",  label: "Profile",    icon: IconUsers    },
    { key: "password", label: "Password",   icon: IconSettings },
    { key: "danger",   label: "Danger Zone",icon: IconAlert    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <AmbientBg />
      <ToastList toasts={toasts} />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-white/60 px-4 py-4 backdrop-blur-xl md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
              <span className="text-sm font-bold">{initials}</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">{user?.full_name ?? "Caregiver User"}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

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

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Pill tone="emerald">Caregiver</Pill>
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
              subtitle="Update your personal and professional details."
              rightSlot={<Pill tone="emerald">Caregiver</Pill>}
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
                    <h3 className="text-lg font-semibold text-slate-900">{user?.full_name ?? "Caregiver User"}</h3>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Pill tone="emerald">Caregiver</Pill>
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

              {/* Basic fields */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel>Full Name</FieldLabel>
                  <GlassInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" />
                </div>

                <div>
                  <FieldLabel>
                    <span className="inline-flex items-center gap-2">
                      <IconMail className="h-4 w-4 text-slate-400" /> Email Address
                    </span>
                  </FieldLabel>
                  <GlassInput value={user?.email ?? ""} disabled />
                  <p className="mt-1 text-[11px] text-slate-400">Email address cannot be changed here.</p>
                </div>

                <div>
                  <FieldLabel>
                    <span className="inline-flex items-center gap-2">
                      <IconPhone className="h-4 w-4 text-slate-400" /> Contact Number
                    </span>
                  </FieldLabel>
                  <GlassInput value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+94 77 987 6543" />
                </div>

                <div>
                  <FieldLabel>Role</FieldLabel>
                  <GlassInput value="Caregiver" disabled />
                </div>
              </div>

              {/* Caregiver-specific section */}
              <div className="mt-8 border-t border-white/30 pt-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <IconSettings className="h-4 w-4 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-900">Professional Details</h4>
                  </div>
                  <PrimaryBtn tone="blue" onClick={() => addToast("success", "Professional details saved.")} className="py-2 text-xs">
                    Save Details
                  </PrimaryBtn>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <FieldLabel>Specialization</FieldLabel>
                    <GlassInput value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Elderly & Dementia Care" />
                  </div>

                  <div>
                    <FieldLabel>Shift Preference</FieldLabel>
                    <GlassSelect value={shiftPreference} onChange={(e) => setShiftPreference(e.target.value)}>
                      <option>Morning</option>
                      <option>Afternoon</option>
                      <option>Evening</option>
                      <option>Night</option>
                      <option>Flexible</option>
                    </GlassSelect>
                  </div>

                  <div>
                    <FieldLabel>Employee ID</FieldLabel>
                    <GlassInput value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="CG-YYYY-XXXX" />
                  </div>

                  <div>
                    <FieldLabel>Home Address</FieldLabel>
                    <GlassInput value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, Province" />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Account summary */}
            <SectionCard title="Account Summary" subtitle="Read-only overview of your account.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "User ID",       value: (user?.id?.slice(0, 16) ?? "—") + "…", mono: true },
                  { label: "Role",          value: user?.role ?? "caregiver" },
                  { label: "Specialization",value: specialization },
                  { label: "Status",        value: "Active" },
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

        {/* PASSWORD TAB */}
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

        {/* DANGER ZONE TAB */}
        {tab === "danger" && (
          <DangerZoneTab
            deactivateNote="Temporarily disable your caregiver account access. An admin can reactivate it."
            deleteNote="Permanently delete your account and all associated data. This cannot be undone. You will be signed out immediately."
            footerNote="Destructive account actions require confirmation from an admin. Please contact your system administrator to proceed."
            footerIcon={IconUsers}
            onDeactivate={() => addToast("error", "Deactivation requires admin approval.")}
            onDelete={() => addToast("error", "Account deletion requires admin confirmation.")}
          />
        )}
      </main>
    </div>
  );
};

export default CaregiverProfile;
