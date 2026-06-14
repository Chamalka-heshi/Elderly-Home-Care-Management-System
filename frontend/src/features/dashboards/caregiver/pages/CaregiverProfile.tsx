import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useAuth } from "../../../../auth/AuthContext";
import {
  getProfile,
  updateCaregiverProfile,
  changePasswordApi,
} from "../../../../api/auth/auth.api";

import DeleteAccountButton from "../../../../components/deleteaccount";

// ── Common shared components ─────────────────────────────────────────────
import {
  IconMail, IconPhone, IconChevronLeft, IconAlert,
  IconUsers, IconSettings, IconShield, IconIdCard, IconSpinner,
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

// ── Types ────────────────────────────────────────────────────────────────
type TabKey = "profile" | "password" | "danger";

interface Props {
  onBack: () => void;
}

// ══════════════════════════════════════════════════════════════════════════
//  CaregiverProfile Component
// ══════════════════════════════════════════════════════════════════════════
const CaregiverProfile: React.FC<Props> = ({ onBack }) => {
  const { user, setUser } = useAuth();

  // ── UI state ──────────────────────────────────────────────────────────
  const [tab,    setTab]    = useState<TabKey>("profile");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Profile fetch state ───────────────────────────────────────────────
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError,   setProfileError]   = useState<string | null>(null);

  // ── Editable fields ───────────────────────────────────────────────────
  const [fullName,        setFullName]        = useState("");
  const [contactNumber,   setContactNumber]   = useState("");
  const [address,         setAddress]         = useState("");
  const [qualification,   setQualification]   = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [availableShifts, setAvailableShifts] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);

  // ── Read-only fields ──────────────────────────────────────────────────
  const [nic,       setNic]       = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // ── Password fields ───────────────────────────────────────────────────
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [pwLoading,   setPwLoading]   = useState(false);
  const [profLoading, setProfLoading] = useState(false);

  // ── Fetch profile on mount ────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);

        const freshUser = await getProfile();

        setUser({ ...freshUser, avatarUrl: (freshUser as any).avatarUrl ?? null });

        const profile = (freshUser as any)?.profile ?? {};

        setFullName(freshUser.fullName ?? "");
        setContactNumber(freshUser.contactNumber ?? "");
        setAddress(profile.address ?? "");
        setQualification(profile.qualification ?? "");
        setEmergencyContact(profile.emergencyContact ?? "");
        setExperienceYears(profile.experienceYears ?? 0);
        setAvailableShifts(profile.availableShifts ?? []);
        setSpecializations(profile.specializations ?? []);
        setNic(profile.nic ?? null);
        setCreatedAt((freshUser as any).createdAt ?? null);
      } catch (err: any) {
        setProfileError(err.message || "Failed to load profile. Please try again.");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ───────────────────────────────────────────────────────────
  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const initials = useMemo(() => {
    const name  = user?.fullName ?? "Caregiver User";
    const parts = name.trim().split(" ").filter(Boolean);
    return (
      (parts[0]?.[0] ?? "C") +
      (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")
    ).toUpperCase();
  }, [user?.fullName]);

  // ── API Handlers ──────────────────────────────────────────────────────
  const handleUpdateProfile = async () => {
    if (!fullName.trim()) { addToast("error", "Full name cannot be empty."); return; }
    try {
      setProfLoading(true);
      const updatedData = await updateCaregiverProfile({
        fullName,
        contactNumber,
        address,
        qualification,
        emergencyContact,
        experienceYears: Number(experienceYears),
        specializations,
        availableShifts,
      });

      // Reflect updated base-user fields back into the auth context.
      // Caregiver-specific fields (address, specializations, etc.) live in
      // the profile sub-object and must NOT be spread onto the User root.
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
    if (!currentPw) { addToast("error", "Enter your current password."); return; }
    if (newPw.length < 8) { addToast("error", "New password must be 8+ characters."); return; }
    if (newPw !== confirmPw) { addToast("error", "New passwords do not match."); return; }
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

  // ── Tab definitions ───────────────────────────────────────────────────
  const tabs: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: "profile",  label: "Profile",     icon: IconUsers    },
    { key: "password", label: "Password",    icon: IconSettings },
    { key: "danger",   label: "Danger Zone", icon: IconAlert    },
  ];

  // ── Loading / Error state ─────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <IconSpinner className="h-10 w-10 text-emerald-500" />
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

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-white/60 px-4 py-4 backdrop-blur-xl md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <AvatarUpload initials={initials} size="sm" interactive={false} />
            <div>
              <p className="text-base font-bold text-slate-900">{user?.fullName ?? "Caregiver User"}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-white/40 bg-white/60 px-3 py-1.5 sm:flex">
              <IconShield className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">Caregiver</span>
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
              subtitle="Update your personal and professional details. Email and NIC cannot be changed."
              rightSlot={<Pill tone="emerald">Caregiver</Pill>}
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
                    <h3 className="text-lg font-semibold text-slate-900">{user?.fullName ?? "Caregiver User"}</h3>
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

              {/* Fields */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Editable */}
                <div>
                  <FieldLabel>Full Name</FieldLabel>
                  <GlassInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" />
                </div>

                <div>
                  <FieldLabel>
                    <span className="inline-flex items-center gap-2">
                      <IconPhone className="h-4 w-4 text-slate-400" />
                      Contact Number
                    </span>
                  </FieldLabel>
                  <GlassInput value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+94 77 123 4567" />
                </div>

                <div>
                  <FieldLabel>Address</FieldLabel>
                  <GlassInput value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your address" />
                </div>

                <div>
                  <FieldLabel>Qualification</FieldLabel>
                  <GlassInput value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. Diploma in Nursing" />
                </div>

                <div>
                  <FieldLabel>Emergency Contact</FieldLabel>
                  <GlassInput value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="0771234567" />
                </div>

                <div>
                  <FieldLabel>Years of Experience</FieldLabel>
                  <GlassInput
                    type="number"
                    value={String(experienceYears)}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    placeholder="e.g. 3"
                  />
                </div>

                <div>
                  <FieldLabel>Specializations (comma-separated)</FieldLabel>
                  <GlassInput
                    value={specializations.join(", ")}
                    onChange={(e) =>
                      setSpecializations(
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="e.g. Elderly Care, Dementia Care"
                  />
                </div>

                <div>
                  <FieldLabel>Available Shifts (comma-separated)</FieldLabel>
                  <GlassInput
                    value={availableShifts.join(", ")}
                    onChange={(e) =>
                      setAvailableShifts(
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="e.g. day, night, flexible"
                  />
                </div>

                {/* Read-only */}
                <div>
                  <FieldLabel>
                    <span className="inline-flex items-center gap-2">
                      <IconMail className="h-4 w-4 text-slate-400" />
                      Email Address
                    </span>
                  </FieldLabel>
                  <GlassInput value={user?.email ?? ""} disabled />
                  <p className="mt-1 text-[11px] text-slate-400">Email address cannot be changed.</p>
                </div>

                <div>
                  <FieldLabel>
                    <span className="inline-flex items-center gap-2">
                      <IconIdCard className="h-4 w-4 text-slate-400" />
                      NIC Number
                    </span>
                  </FieldLabel>
                  <GlassInput value={nic ?? "—"} disabled />
                  <p className="mt-1 text-[11px] text-slate-400">NIC cannot be changed after account creation.</p>
                </div>
              </div>
            </SectionCard>

            {/* Account Summary */}
            <SectionCard title="Account Summary" subtitle="Read-only overview of your caregiver profile.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "User ID",     value: user?.id ? user.id.slice(0, 16) + "…" : "—", mono: true },
                  { label: "Role",        value: "Caregiver" },
                  { label: "NIC",         value: nic ?? "—", mono: true },
                  { label: "Experience",  value: experienceYears ? `${experienceYears} years` : "—" },
                  {
                    label: "Shifts",
                    value: availableShifts.length ? availableShifts.join(", ") : "—",
                  },
                  {
                    label: "Specializations",
                    value: specializations.length ? specializations.join(", ") : "—",
                  },
                  {
                    label: "Member Since",
                    value: createdAt
                      ? new Date(createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })
                      : "—",
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

        {/* ── PASSWORD TAB ── */}
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

        {/* ── DANGER ZONE TAB ── */}
        {tab === "danger" && (
          <DangerZoneTab
            deleteNote="Permanently delete your caregiver account and all associated data. This cannot be undone."
            deleteButton={<DeleteAccountButton />}
          />
        )}
      </main>
    </div>
  );
};

export default CaregiverProfile;
