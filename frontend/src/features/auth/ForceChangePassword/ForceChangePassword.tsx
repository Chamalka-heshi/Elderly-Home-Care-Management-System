import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { firstLoginChangePasswordApi } from "../../../api/auth/auth.api";
import sideImg from "../../../assets/landing/auth-side-art.png";

// Configuration constants
const MIN_PASSWORD_LENGTH = 8;
const REDIRECT_DELAY = 2000;

// Password-strength calculation based on length and complexity
const getStrength = (pw: string) => {
  if (pw.length >= 16) return { label: "Strong",    color: "bg-emerald-500", bars: 4 };
  if (pw.length >= 12) return { label: "Good",      color: "bg-emerald-400", bars: 3 };
  if (pw.length >=  8) return { label: "Moderate",  color: "bg-amber-400",   bars: 2 };
  return                      { label: "Too short", color: "bg-red-400",     bars: pw.length > 0 ? 1 : 0 };
};

// Interface for mandatory password update upon first login
const ForceChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Redirect if user is not logged in or doesn't need to change password
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!user.mustChangePassword) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [user, navigate]);

  const strength = getStrength(newPw);
  const passwordsMatch = newPw.length >= MIN_PASSWORD_LENGTH && confirmPw === newPw;

  // Submit the new password and update user context upon success
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPw.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPw)) {
      setError("Password must include uppercase, lowercase, number & special character.");
      return;
    }

    if (newPw !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await firstLoginChangePasswordApi({ newPassword: newPw, confirmPassword: confirmPw });
      if (user) setUser({ ...user, mustChangePassword: false });
      setSuccess(true);
      setTimeout(() => navigate(`/${user?.role}`, { replace: true }), REDIRECT_DELAY);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_32px_80px_rgba(0,0,0,0.12)]">
        <div className="grid items-stretch lg:grid-cols-2">
          {/* Left side: Hero Image and Branding */}
          <div className="relative hidden lg:block">
            <img 
              src={sideImg} 
              alt="Care Home" 
              className="h-full w-full object-cover" 
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/35 via-black/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-3 text-white backdrop-blur-xl shadow-[0_18px_40px_rgba(2,6,23,0.35)]">
                <div className="absolute -top-10 left-1/2 h-20 w-56 -translate-x-1/2 rotate-12 bg-white/10 blur-2xl" />
                <p className="text-base font-black tracking-tight">One last step.</p>
                <p className="mt-1 text-sm font-medium text-white/85">
                  Set a personal password to secure your account.
                </p>
              </div>
            </div>
          </div>

          {/* Right side: Form container */}
          <div className="overflow-y-auto p-5 sm:p-7" style={{ maxHeight: "90vh" }}>
            <div className="inline-flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_10px_20px_rgba(16,185,129,0.28)]" />
              <span className="text-sm font-extrabold tracking-tight text-slate-900">Care Home</span>
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Set your password</h1>
            <p className="mt-2 text-sm text-slate-600">
              Your account requires a new personal password before you can continue.
            </p>

            {/* Welcome hint banner */}
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-800">
                👋 Welcome, <span className="font-extrabold">{user.fullName}</span>
              </p>
              <p className="mt-0.5 text-xs font-medium text-emerald-700">
                You logged in with your temporary password. Now set a new personal
                password — you won't need to enter the temporary one again.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {success && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <span>✓</span><span>Password set! Redirecting to your dashboard…</span>
              </div>
            )}

            {/* Password Update Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => { setNewPw(e.target.value); setError(""); }}
                    placeholder="Minimum 8 characters"
                    autoFocus
                    disabled={loading || success}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    disabled={loading || success}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition hover:bg-slate-50 disabled:opacity-70"
                  >
                    {showNew ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>

                {/* Strength indicator */}
                {newPw.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.bars ? strength.color : "bg-slate-200"}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
                    placeholder="Repeat your new password"
                    disabled={loading || success}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    disabled={loading || success}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition hover:bg-slate-50 disabled:opacity-70"
                  >
                    {showConfirm ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {confirmPw && !passwordsMatch && (
                  <p className="mt-1 text-xs font-bold text-red-500">Passwords do not match</p>
                )}
                {passwordsMatch && (
                  <p className="mt-1 text-xs font-bold text-emerald-600">✓ Passwords match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_rgba(16,185,129,0.32)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving…
                  </span>
                ) : success ? "Done ✓" : "Set New Password →"}
              </button>
            </form>

            {/* Footer tips */}
            <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
              Use at least 8 characters with uppercase, lowercase, numbers &amp; symbols. Never share your password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForceChangePassword;
