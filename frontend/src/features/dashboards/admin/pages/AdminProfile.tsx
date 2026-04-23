import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useAuth } from "../../../../auth/AuthContext";
import type { User } from "../../../../auth/AuthContext";         
import {
  getProfile,
  updateAdminProfile,
  changePasswordApi,
} from "../../../../api/auth/auth.api";

// ── Common shared components ───────────────────────────────────────────────
import {
  IconMail,
  IconPhone,
  IconChevronLeft,
  IconAlert,
  IconUser,
  IconShield,
} from "../../common/icons";
import {
  FieldLabel,
  GlassInput,
  SectionCard,
  PrimaryBtn,
  Pill,
  AmbientBg,
  ToastList,
  type Toast,
} from "../../common/ui";
import PasswordTab from "../../common/PasswordTab";
import DangerZoneTab from "../../common/DangerZoneTab";
import DeleteAccountButton from "../../../../components/deleteaccount";

// ── Types ──────────────────────────────────────────────────────────────────
type TabKey = "profile" | "password" | "danger";

interface Props {
  onBack: () => void;
}

// ══════════════════════════════════════════════════════════════════════════
//  AdminProfile Component
// ══════════════════════════════════════════════════════════════════════════
const AdminProfile: React.FC<Props> = ({ onBack }) => {
  const { user, setUser } = useAuth();

  // ── UI state ──────────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabKey>("profile");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Profile fetch state ───────────────────────────────────────────────
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ── Editable profile fields ───────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // ── Read-only profile fields ──────────────────────────────────────────
  const [nic, setNic] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // ── Password fields ───────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // ── Loading states ────────────────────────────────────────────────────
  const [pwLoading, setPwLoading] = useState(false);
  const [profLoading, setProfLoading] = useState(false);

  // ── Fetch profile on mount ────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);

        const freshUser = await getProfile();

        // Sync AuthContext with the latest data from the server
        setUser(freshUser);

        // Sync localStorage so refreshes are consistent
        localStorage.setItem("user", JSON.stringify(freshUser));

        // Pre-fill editable fields with fresh data
        setFullName(freshUser.fullName ?? "");
        setContactNumber(freshUser.contactNumber ?? "");

        // Read-only profile fields come from the nested `profile` object
        const profile = (freshUser as any)?.profile ?? {};
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
  const addToast = useCallback(
    (kind: "success" | "error", message: string) => {
      const id = Date.now();
      setToasts((t) => [...t, { id, kind, message }]);
      setTimeout(
        () => setToasts((t) => t.filter((x) => x.id !== id)),
        4500
      );
    },
    []
  );

  const initials = useMemo(() => {
    const name = user?.fullName ?? "Admin";
    const parts = name.trim().split(" ").filter(Boolean);
    return (
      (parts[0]?.[0] ?? "A") +
      (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")
    ).toUpperCase();
  }, [user?.fullName]);

  const roleLabel =
    user?.role === "super_admin" ? "Super Administrator" : "Administrator";

  // ── Tab definitions ───────────────────────────────────────────────────
  const tabs: {
    key: TabKey;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { key: "profile", label: "Profile", icon: IconUser },
    {
      key: "password",
      label: "Password",
      icon: ({ className }) => (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7.5 11V8.8A4.5 4.5 0 0 1 12 4.3a4.5 4.5 0 0 1 4.5 4.5V11"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M7.2 11h9.6c1 0 1.7.8 1.7 1.7v6.1c0 1-.8 1.7-1.7 1.7H7.2c-1 0-1.7-.8-1.7-1.7v-6.1c0-1 .8-1.7 1.7-1.7Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    { key: "danger", label: "Danger Zone", icon: IconAlert },
  ];

  // ── API Handlers ──────────────────────────────────────────────────────

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      addToast("error", "Full name cannot be empty.");
      return;
    }
    try {
      setProfLoading(true);
      const updatedUser = await updateAdminProfile({ fullName, contactNumber });

      // Merge updated fields back into AuthContext and localStorage
      if (user) {
        const newUserState: User = {
          ...user,
          fullName:      updatedUser.fullName      ?? user.fullName,
          contactNumber: updatedUser.contactNumber ?? user.contactNumber,
        };
        setUser(newUserState);
        localStorage.setItem("user", JSON.stringify(newUserState));
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
    if (!currentPw) {
      addToast("error", "Enter your current password.");
      return;
    }
    if (newPw.length < 8) {
      addToast("error", "New password must be 8+ characters.");
      return;
    }
    if (newPw !== confirmPw) {
      addToast("error", "New passwords do not match.");
      return;
    }

    try {
      setPwLoading(true);
      const response = await changePasswordApi({
        currentPassword: currentPw,
        newPassword: newPw,
      });
      addToast("success", response.message || "Password changed successfully.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: any) {
      addToast("error", err.message || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  // ── Loading / Error state ─────────────────────────────────────────────
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
          <button
            onClick={onBack}
            className="mt-4 text-sm font-semibold text-emerald-600 underline"
          >
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

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-white/60 px-4 py-4 backdrop-blur-xl md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
              <span className="text-sm font-bold">{initials}</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                {user?.fullName ?? "Admin User"}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-white/40 bg-white/60 px-3 py-1.5 sm:flex">
              <IconShield className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">
                {roleLabel}
              </span>
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

      {/* ── Main ── */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">

        {/* Tab bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Pill tone="emerald">{roleLabel}</Pill>
            <p className="text-sm text-slate-500">
              Manage your account settings and security preferences.
            </p>
          </div>

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

        {/* ── Profile Tab ── */}
        {tab === "profile" && (
          <div className="space-y-6">
            <SectionCard
              title="Profile Information"
              subtitle="Update your personal details. Email and NIC cannot be changed."
              rightSlot={<Pill tone="emerald">{roleLabel}</Pill>}
            >
              {/* Avatar + Save row */}
              <div className="mb-6 flex flex-col gap-4 border-b border-white/30 pb-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-600 text-xl font-bold text-white shadow-lg shadow-emerald-600/25">
                      {initials}
                    </div>
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {user?.fullName ?? "Admin User"}
                    </h3>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Pill tone="emerald">{roleLabel}</Pill>
                      <span className="text-xs text-slate-400">
                        ID: {user?.id?.slice(0, 12)}…
                      </span>
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
                  <GlassInput
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
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

                {/* Read-only */}
                <div>
                  <FieldLabel>
                    <span className="inline-flex items-center gap-2">
                      <IconMail className="h-4 w-4 text-slate-400" />
                      Email Address
                    </span>
                  </FieldLabel>
                  <GlassInput value={user?.email ?? ""} disabled />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Email address cannot be changed.
                  </p>
                </div>

                <div>
                  <FieldLabel>
                    <span className="inline-flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                      </svg>
                      NIC Number
                    </span>
                  </FieldLabel>
                  <GlassInput value={nic ?? "—"} disabled />
                  <p className="mt-1 text-[11px] text-slate-400">
                    NIC cannot be changed after account creation.
                  </p>
                </div>

                <div>
                  <FieldLabel>Role</FieldLabel>
                  <GlassInput value={roleLabel} disabled />
                </div>
              </div>
            </SectionCard>

            {/* Account Summary */}
            <SectionCard
              title="Account Summary"
              subtitle="Read-only overview of your account details."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "User ID",
                    value: user?.id ? user.id.slice(0, 16) + "…" : "—",
                    mono: true,
                  },
                  { label: "Role", value: user?.role ?? "admin" },
                  { label: "NIC", value: nic ?? "—", mono: true },
                  {
                    label: "Member Since",
                    value: createdAt
                      ? new Date(createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—",
                  },
                  { label: "Status", value: "Active" },
                ].map(({ label, value, mono }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200/60 bg-white/60 px-4 py-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </p>
                    <p
                      className={[
                        "mt-1.5 text-sm font-semibold text-slate-800",
                        mono ? "font-mono" : "",
                      ].join(" ")}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Password Tab ── */}
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

        {/* ── Danger Zone Tab ── */}
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

export default AdminProfile;
