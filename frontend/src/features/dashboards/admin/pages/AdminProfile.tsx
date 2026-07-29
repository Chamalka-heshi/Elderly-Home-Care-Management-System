import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useAuth } from "../../../../auth/AuthContext";
import { fmtDateShort } from "../../../../utils/dateTime";
import type { User } from "../../../../auth/AuthContext";         
import {
  getProfile,
  updateAdminProfile,
  changePasswordApi,
} from "../../../../api/auth/auth.api";
import {
  IconMail,
  IconPhone,
  IconChevronLeft,
  IconAlert,
  IconUser,
  IconShield,
  IconLock,
  IconIdCard,
  IconSpinner,
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
import AvatarUpload from "../../common/AvatarUpload";
import DeleteAccountButton from "../../../../components/deleteaccount";

type TabKey = "profile" | "password" | "danger";

interface Props {
  onBack: () => void;
}

// AdminProfile
// Page for administrators to update their own profile, password, or delete their account
const AdminProfile: React.FC<Props> = ({ onBack }) => {
  const { user, setUser } = useAuth();

  const [tab, setTab] = useState<TabKey>("profile");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [nic, setNic] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [pwLoading, setPwLoading] = useState(false);
  const [profLoading, setProfLoading] = useState(false);

  // Gets the latest profile data when the page opens
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);

        const freshUser = await getProfile();

        setUser({ ...freshUser, avatarUrl: (freshUser as any).avatarUrl ?? null });

        setFullName(freshUser.fullName ?? "");
        setContactNumber(freshUser.contactNumber ?? "");

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

  const roleLabel = user?.role === "super_admin" ? "Super Administrator" : "Administrator";

  const tabs: {
    key: TabKey;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { key: "profile", label: "Profile", icon: IconUser },
    { key: "password", label: "Password", icon: IconLock },
    { key: "danger", label: "Danger Zone", icon: IconAlert },
  ];

  // Sends the updated profile info (name, phone) to the server
  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      addToast("error", "Full name cannot be empty.");
      return;
    }
    try {
      setProfLoading(true);
      const updatedUser = await updateAdminProfile({ fullName, contactNumber });

      if (user) {
        const newUserState: User = {
          ...user,
          fullName:      updatedUser.fullName      ?? user.fullName,
          contactNumber: updatedUser.contactNumber ?? user.contactNumber,
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

  // Updates the account password after checking the new password fields
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

      {/* Header with user info and back button */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-white/60 px-4 py-4 backdrop-blur-xl md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <AvatarUpload initials={initials} size="sm" interactive={false} />
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

      {/* Main content area */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        
        {/* Tab selection buttons */}
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

        {/* Show the selected tab content */}
        {tab === "profile" && (
          <div className="space-y-6">
            <SectionCard
              title="Profile Information"
              subtitle="Update your personal details. Email and NIC cannot be changed."
              rightSlot={<Pill tone="emerald">{roleLabel}</Pill>}
            >
              {/* Avatar upload and user details header */}
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

              {/* Form fields for profile details */}
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
                      <IconIdCard className="h-4 w-4 text-slate-400" />
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

            {/* Read-only account summary */}
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
                    value: createdAt ? fmtDateShort(createdAt) : "—",
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
