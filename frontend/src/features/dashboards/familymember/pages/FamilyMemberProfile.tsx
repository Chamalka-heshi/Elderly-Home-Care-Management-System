/**
 * src/features/dashboards/familymember/pages/FamilyMemberProfile.tsx
 * ───────────────────────────────────────────────────────────────────
 * Profile page for the Family Member role.
 * Fetches real data from the backend on mount and persists changes via
 * updateFamilyProfile (PATCH /family/profile).
 */

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useAuth } from "../../../../auth/AuthContext";
import {
  getProfile,
  updateFamilyProfile,
  changePasswordApi,
} from "../../../../api/auth/auth.api";
import DeleteAccountButton from "../../../../components/deleteaccount";
import { fmtDate } from '../../../../utils/dateTime';

// ── Common shared components ──────────────────────────────────────────────────
import {
  IconMail, IconPhone, IconChevronLeft, IconAlert,
  IconUsers, IconSettings, IconLock
} from "../../common/icons";
import {
  FieldLabel, GlassInput,
  SectionCard, PrimaryBtn, Pill,
  AmbientBg, ToastList,
  type Toast,
} from "../../common/ui";
import PasswordTab   from "../../common/PasswordTab";
import DangerZoneTab from "../../common/DangerZoneTab";
import AvatarUpload  from "../../common/AvatarUpload";

// ── Types ─────────────────────────────────────────────────────────────────────
type TabKey = "profile" | "password" | "danger";

interface Props {
  onBack: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
const FamilyMemberProfile: React.FC<Props> = ({ onBack }) => {
  const { user, setUser } = useAuth();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [tab,    setTab]    = useState<TabKey>("profile");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Profile fetch state ───────────────────────────────────────────────────
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError,   setProfileError]   = useState<string | null>(null);

  // ── Editable fields ───────────────────────────────────────────────────────
  const [fullName,      setFullName]      = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // ── Read-only fields ──────────────────────────────────────────────────────
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // ── Password fields ───────────────────────────────────────────────────────
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [pwLoading,   setPwLoading]   = useState(false);
  const [profLoading, setProfLoading] = useState(false);

  // ── Fetch profile on mount ────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);

        const freshUser = await getProfile();

        setUser({ ...freshUser, avatarUrl: (freshUser as any).avatarUrl ?? null });

        setFullName(freshUser.fullName ?? "");
        setContactNumber(freshUser.contactNumber ?? "");
        setCreatedAt((freshUser as any).createdAt ?? null);
      } catch (err: any) {
        setProfileError(err.message || "Failed to load profile. Please try again.");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ───────────────────────────────────────────────────────────────
  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const initials = useMemo(() => {
    const name  = user?.fullName ?? "Family Member";
    const parts = name.trim().split(" ").filter(Boolean);
    return (
      (parts[0]?.[0] ?? "F") +
      (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")
    ).toUpperCase();
  }, [user?.fullName]);

  // ── API Handlers ──────────────────────────────────────────────────────────
  const handleUpdateProfile = async () => {
    if (!fullName.trim()) { addToast("error", "Full name cannot be empty."); return; }

    try {
      setProfLoading(true);

      const updatedData = await updateFamilyProfile({ fullName, contactNumber });

      // Merge updated fields back into auth context
      if (user) {
        const newUserState = {
          ...user,
          fullName:      (updatedData as any).fullName      ?? user.fullName,
          contactNumber: (updatedData as any).contactNumber ?? user.contactNumber,
        };
        setUser(newUserState);
      }

      addToast("success", "Profile updated successfully.");
    } catch (err: any) {
      addToast("error", err.message || "Failed to update profile.");
    } finally {
      setProfLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw)          { addToast("error", "Enter your current password.");    return; }
    if (newPw.length < 8)    { addToast("error", "New password must be 8+ characters."); return; }
    if (newPw !== confirmPw) { addToast("error", "New passwords do not match.");     return; }

    try {
      setPwLoading(true);
      const response = await changePasswordApi({ currentPassword: currentPw, newPassword: newPw });
      addToast("success", response.message || "Password changed successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      addToast("error", err.message || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: "profile",  label: "Profile",     icon: IconUsers },
    { key: "password", label: "Password",    icon: IconLock },
    { key: "danger",   label: "Danger Zone", icon: IconAlert },
  ];

  // ── Loading / Error states ────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-red-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm text-red-600">{profileError}</p>
          <button onClick={onBack} className="mt-4 text-sm font-semibold text-emerald-600 underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AmbientBg />
      <ToastList toasts={toasts} />

      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-white/30 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <AvatarUpload initials={initials} size="sm" interactive={false} />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">{user?.fullName ?? "Family Member"}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <IconUsers className="h-3 w-3" />
                Family Member
              </div>
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
            <Pill tone="emerald">Family Member</Pill>
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
              subtitle="Update your personal and contact details. Email cannot be changed."
              rightSlot={<Pill tone="emerald">Family Member</Pill>}
            >
              {/* Avatar + name row */}
              <div className="mb-6 flex flex-col gap-4 border-b border-white/30 pb-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <AvatarUpload
                    initials={initials}
                    size="lg"
                    interactive
                    onSuccess={() => addToast("success", "Profile photo updated.")}
                    onError={(msg) => addToast("error", msg)}
                    onRemoved={() => addToast("success", "Profile photo removed.")}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{user?.fullName ?? "Family Member"}</h3>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Pill tone="emerald">Family Member</Pill>
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

              {/* Editable fields */}
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
                  <GlassInput
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="0771234567"
                  />
                </div>

                <div>
                  <FieldLabel>
                    <span className="inline-flex items-center gap-2">
                      <IconSettings className="h-4 w-4 text-slate-400" /> Role
                    </span>
                  </FieldLabel>
                  <GlassInput value="Family Member" disabled />
                </div>
              </div>
            </SectionCard>

            {/* Account summary */}
            <SectionCard title="Account Summary" subtitle="Read-only overview of your account.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "User ID",      value: (user?.id?.slice(0, 16) ?? "—") + "…", mono: true },
                  { label: "Role",         value: user?.role ?? "family" },
                  {
                    label: "Member Since",
                    value: createdAt ? fmtDate(createdAt) : "—",
                  },
                  { label: "Status", value: "Active" },
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
            deleteNote="Permanently delete your admin account and all associated data. This cannot be undone."
            deleteButton={<DeleteAccountButton />}
          />
        )}
      </main>
    </div>
  );
};

export default FamilyMemberProfile;
