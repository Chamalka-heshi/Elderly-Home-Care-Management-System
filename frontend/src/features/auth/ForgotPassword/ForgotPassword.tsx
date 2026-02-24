import { useState } from "react";
import type { FormEvent } from "react";

import sideImg from "../../../assets/Home/Login Art.png";

type Props = {
  onGoLogin: () => void;
};

// Hardcoded demo emails (no backend)
const DEMO_EMAILS = [
  "admin@carehome.com",
  "doctor@carehome.com",
  "caregiver@carehome.com",
  "family@carehome.com",
];

type Step = "email" | "otp" | "newpassword" | "success";

const DEMO_OTP = "123456";

export default function ForgotPasswordCard({ onGoLogin }: Props) {
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  /* Step 1 */
  const onSubmitEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!DEMO_EMAILS.includes(email.trim().toLowerCase())) {
      setError("No account found with this email address.");
      return;
    }
    setStep("otp");
  };

  /* Step 2 */
  const onSubmitOtp = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (otp.trim() !== DEMO_OTP) {
      setError(`Invalid OTP. (Demo hint: ${DEMO_OTP})`);
      return;
    }
    setStep("newpassword");
  };

  /* Step 3 */
  const onSubmitNewPassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setStep("success");
  };

  return (
    <div className="grid items-stretch lg:grid-cols-2">
      {/* LEFT IMAGE */}
      <div className="relative hidden lg:block">
        <img src={sideImg} alt="Care Home" className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/35 via-black/10 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5">
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-3 text-white backdrop-blur-xl shadow-[0_18px_40px_rgba(2,6,23,0.35)]">
            <div className="absolute -top-10 left-1/2 h-20 w-56 -translate-x-1/2 rotate-12 bg-white/10 blur-2xl" />
            <p className="text-base font-black tracking-tight">Care, connected.</p>
            <p className="mt-1 text-sm font-medium text-white/85">
              Family, doctors and caregivers in one system.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="p-5 sm:p-7">
        {/* Logo */}
        <div className="inline-flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_10px_20px_rgba(16,185,129,0.28)]" />
          <span className="text-sm font-extrabold tracking-tight text-slate-900">Care Home</span>
        </div>

        {/* ── STEP 1: Email only ── */}
        {step === "email" && (
          <>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Forgot Password</h1>
            <p className="mt-2 text-sm text-slate-600">
              Enter your registered email and we'll send you a reset code.
            </p>

            {error && (
              <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmitEmail} className="mt-5 space-y-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  type="email"
                  placeholder="example@email.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_rgba(16,185,129,0.32)] active:translate-y-0"
              >
                Reset Password
              </button>

              <p className="pt-1 text-center text-sm font-semibold text-slate-600">
                Remember your password?{" "}
                <button type="button" onClick={onGoLogin} className="font-extrabold text-emerald-700 transition hover:underline hover:underline-offset-4">
                  Sign in
                </button>
              </p>
            </form>
          </>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === "otp" && (
          <>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Check your email</h1>
            <p className="mt-2 text-sm text-slate-600">
              We sent a 6-digit code to <span className="font-bold text-slate-800">{email}</span>.{" "}
              <span className="text-slate-400">(Demo: use {DEMO_OTP})</span>
            </p>

            {error && (
              <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmitOtp} className="mt-5 space-y-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                  One-Time Code
                </label>
                <input
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                  type="text"
                  inputMode="numeric"
                  placeholder="••••••"
                  maxLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-2xl font-black tracking-[0.5em] outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_rgba(16,185,129,0.32)] active:translate-y-0"
              >
                Verify Code →
              </button>

              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
              >
                ← Back
              </button>
            </form>
          </>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === "newpassword" && (
          <>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Set new password</h1>
            <p className="mt-2 text-sm text-slate-600">Choose a strong password for your account.</p>

            {error && (
              <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmitNewPassword} className="mt-5 space-y-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    type={showNewPw ? "text" : "password"}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60"
                  />
                  <button type="button" onClick={() => setShowNewPw(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition hover:bg-slate-50">
                    {showNewPw ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    type={showConfirmPw ? "text" : "password"}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60"
                  />
                  <button type="button" onClick={() => setShowConfirmPw(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition hover:bg-slate-50">
                    {showConfirmPw ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* Strength bar */}
              {newPassword.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                        newPassword.length < 6 && i <= 1 ? "bg-red-400"
                        : newPassword.length < 8 && i <= 2 ? "bg-orange-400"
                        : newPassword.length < 12 && i <= 3 ? "bg-yellow-400"
                        : "bg-emerald-500"
                      } ${i > (newPassword.length < 6 ? 1 : newPassword.length < 8 ? 2 : newPassword.length < 12 ? 3 : 4) ? "bg-slate-200" : ""}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    {newPassword.length < 6 ? "Too short" : newPassword.length < 8 ? "Weak" : newPassword.length < 12 ? "Good" : "Strong"}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_rgba(16,185,129,0.32)] active:translate-y-0"
              >
                Update Password →
              </button>
            </form>
          </>
        )}

        {/* ── STEP 4: Success ── */}
        {step === "success" && (
          <>
            <div className="mt-8 flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                🎉
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">All done!</h1>
              <p className="text-sm text-slate-600">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoLogin}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5"
            >
              Back to Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
