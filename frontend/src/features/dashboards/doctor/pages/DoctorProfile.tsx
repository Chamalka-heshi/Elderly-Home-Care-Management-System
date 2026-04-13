import React, { useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../../auth/AuthContext";
import { updateDoctorProfile, changePasswordApi } from "../../../../api/auth/auth.api";

// ── Shared components (Cleaned up unused imports) ──
import {
  IconMail, IconPhone, IconChevronLeft, IconShield,
} from "../../common/icons";
import {
  FieldLabel, GlassInput,
  SectionCard, PrimaryBtn,
  AmbientBg, ToastList, type Toast,
} from "../../common/ui";
import PasswordTab   from "../../common/PasswordTab";
import DangerZoneTab from "../../common/DangerZoneTab";

const DoctorProfile: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, setUser } = useAuth();

  const [tab, setTab] = useState<"profile" | "password" | "danger">("profile");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Safely bypass the TypeScript error by casting user to any for the profile object
  const userProfile = (user as any)?.profile || {};

  // ── Profile State
  const [fullName, setFullName] = useState(user?.fullName);
  const [contactNumber, setContactNumber] = useState(user?.contactNumber);
  const [specialization, setSpecialization] = useState(userProfile.specialization);
  const [licenseNumber, setLicenseNumber] = useState(userProfile.licenseNumber);
  const [yearsExp, setYearsExp] = useState(userProfile.experienceYears);

  // ── Password State
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  
  const [pwLoading, setPwLoading] = useState(false);
  const [profLoading, setProfLoading] = useState(false);

  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const initials = useMemo(() => {
    const name = user?.fullName ?? "Doctor";
    const parts = name.trim().split(" ").filter(Boolean);
    return ((parts[0]?.[0] ?? "D") + (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")).toUpperCase();
  }, [user?.fullName]);

  // ── Handlers
  const handleUpdateProfile = async () => {
    try {
      setProfLoading(true);
      const updatedData = await updateDoctorProfile({
        fullName,
        contactNumber,
        specialization,
        licenseNumber,
        experienceYears: Number(yearsExp),
      });

      if (user) {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
      }
      addToast("success", "Professional profile updated.");
    } catch (err: any) {
      addToast("error", err.message || "Failed to update profile.");
    } finally {
      setProfLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { addToast("error", "Passwords do not match."); return; }
    try {
      setPwLoading(true);
      await changePasswordApi({ currentPassword: currentPw, newPassword: newPw });
      addToast("success", "Password changed successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      addToast("error", err.message || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AmbientBg />
      <ToastList toasts={toasts} />

      <header className="sticky top-0 z-40 border-b border-white/30 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/25">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
              <p className="text-xs text-slate-500">Doctor Profile</p>
            </div>
          </div>
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white transition">
            <IconChevronLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 rounded-2xl border bg-white/60 p-1 shadow-sm backdrop-blur-xl">
            {["profile", "password", "danger"].map((k) => (
              <button
                key={k}
                onClick={() => setTab(k as any)}
                className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${
                  tab === k ? "bg-emerald-600 text-white shadow-lg" : "text-slate-600 hover:bg-white/70"
                }`}
              >
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {tab === "profile" && (
          <div className="space-y-6">
            <SectionCard title="Doctor Information" subtitle="Update your professional credentials.">
              <div className="mb-6 flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-600 text-xl font-bold text-white shadow-lg">{initials}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{user?.fullName}</h3>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                </div>
                <PrimaryBtn tone="emerald" onClick={handleUpdateProfile} disabled={profLoading}>
                  {profLoading ? "Saving..." : "Update Profile"}
                </PrimaryBtn>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel>Full Name</FieldLabel>
                  <GlassInput value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <FieldLabel><IconMail className="h-4 w-4 inline mr-2" /> Email</FieldLabel>
                  <GlassInput value={user?.email ?? ""} disabled />
                </div>
                <div>
                  <FieldLabel>Specialization</FieldLabel>
                  <GlassInput value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
                </div>
                <div>
                  <FieldLabel>License Number</FieldLabel>
                  <GlassInput value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Years of Experience</FieldLabel>
                  <GlassInput type="number" value={yearsExp} onChange={(e) => setYearsExp(Number(e.target.value))} />
                </div>
                <div>
                  <FieldLabel><IconPhone className="h-4 w-4 inline mr-2" /> Contact Number</FieldLabel>
                  <GlassInput value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {tab === "password" && (
          <PasswordTab
            currentPw={currentPw} newPw={newPw} confirmPw={confirmPw} pwLoading={pwLoading}
            setCurrentPw={setCurrentPw} setNewPw={setNewPw} setConfirmPw={setConfirmPw}
            onSubmit={handleChangePassword}
          />
        )}

        {tab === "danger" && (
          <DangerZoneTab
            deactivateNote="Deactivate your doctor access."
            deleteNote="Permanently delete your account data."
            footerNote="Destructive actions require admin approval."
            footerIcon={IconShield}
            onDeactivate={() => addToast("error", "Contact Admin to deactivate.")}
            onDelete={() => addToast("error", "Contact Admin to delete account.")}
          />
        )}
      </main>
    </div>
  );
};