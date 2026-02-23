/**
 * src/features/dashboards/common/PasswordTab.tsx
 * ─────────────────────────────────────────────────
 * The "Change Password" tab content is byte-for-byte identical between
 * AdminProfile and DoctorProfile, so we extract it here as a single
 * shared component. Both profiles simply render <PasswordTab />.
 *
 * Props:
 *  currentPw / newPw / confirmPw — controlled field values
 *  setters                        — state setters for each field
 *  pwLoading                      — true while the API call is in-flight
 *  onSubmit                       — form submit handler
 */

import React from "react";
import { SectionCard, GlassInput, PrimaryBtn, FieldLabel } from "./ui";
import { IconLock, IconCheck } from "./icons";

interface Props {
  currentPw:    string;
  newPw:        string;
  confirmPw:    string;
  pwLoading:    boolean;
  setCurrentPw: (v: string) => void;
  setNewPw:     (v: string) => void;
  setConfirmPw: (v: string) => void;
  onSubmit:     (e: React.FormEvent) => void;
}

const PasswordTab: React.FC<Props> = ({
  currentPw, newPw, confirmPw, pwLoading,
  setCurrentPw, setNewPw, setConfirmPw, onSubmit,
}) => {
  // Password-strength helpers — derived from newPw length
  const pwStrength =
    newPw.length >= 16 ? "Strong"   :
    newPw.length >= 12 ? "Good"     :
    newPw.length >=  8 ? "Moderate" : "Too short";

  const pwColor =
    newPw.length >= 16 ? "bg-emerald-600" :
    newPw.length >= 12 ? "bg-emerald-400" :
    newPw.length >=  8 ? "bg-amber-400"   : "bg-red-400";

  const pwWidth =
    newPw.length >= 16 ? "w-full" :
    newPw.length >= 12 ? "w-3/4"  :
    newPw.length >=  8 ? "w-1/2"  :
    newPw.length  >  0 ? "w-1/4"  : "w-0";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

      {/* ── Change-password form (3/5 columns on large screens) ── */}
      <div className="lg:col-span-3">
        <SectionCard
          title="Change Password"
          subtitle="Choose a strong password you don't reuse anywhere else."
          rightSlot={
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
              <IconLock className="h-4 w-4" />
              Secure update
            </span>
          }
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <FieldLabel>Current Password</FieldLabel>
              <GlassInput
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter your current password"
                autoComplete="current-password"
              />
            </div>

            <div>
              <FieldLabel>New Password</FieldLabel>
              <GlassInput
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />

              {/* Strength meter — only visible when the user has started typing */}
              {newPw && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full rounded-full transition-all duration-500 ${pwColor} ${pwWidth}`} />
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">{pwStrength}</p>
                </div>
              )}
            </div>

            <div>
              <FieldLabel>Confirm New Password</FieldLabel>
              <GlassInput
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
              {confirmPw && confirmPw !== newPw && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">Passwords do not match</p>
              )}
              {confirmPw && confirmPw === newPw && newPw.length >= 8 && (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <IconCheck className="h-3 w-3" /> Passwords match
                </p>
              )}
            </div>

            <PrimaryBtn tone="emerald" type="submit" disabled={pwLoading} className="w-full">
              {pwLoading ? "Updating…" : "Change Password"}
            </PrimaryBtn>
          </form>
        </SectionCard>
      </div>

      {/* ── Tips sidebar (2/5 columns) ── */}
      <div className="lg:col-span-2">
        <div className="sticky top-24">
          <SectionCard title="Password Tips" subtitle="Keep your account secure.">
            <ul className="space-y-3 text-sm text-slate-600">
              {[
                "Use at least 8 characters",
                "Mix uppercase, lowercase, numbers & symbols",
                "Avoid reusing passwords from other sites",
                "Don't share your password with anyone",
                "Consider using a password manager",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <IconCheck className="h-3 w-3" />
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default PasswordTab;
