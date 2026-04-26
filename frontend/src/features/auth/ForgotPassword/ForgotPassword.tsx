import { useState, useCallback, useEffect } from "react";
import type { FormEvent, ChangeEvent } from "react";
import {
  checkEmailForReset,
  forgotPasswordApi,
  resetPasswordApi,
} from "../../../api/auth/auth.api";
import sideImg from "../../../assets/Home/Login Art.png";

type Props = {
  onGoLogin: () => void;
};

type Step = "verify" | "set-password" | "success";

// ── Password-strength helper ──────────────────────────────────────────────────
const getStrength = (pw: string) => {
  if (pw.length >= 16) return { label: "Strong",   color: "bg-emerald-500", bars: 4 };
  if (pw.length >= 12) return { label: "Good",     color: "bg-emerald-400", bars: 3 };
  if (pw.length >=  8) return { label: "Moderate", color: "bg-amber-400",   bars: 2 };
  return { label: "Too short", color: "bg-red-400", bars: pw.length > 0 ? 1 : 0 };
};

// ── Tiny shared components ────────────────────────────────────────────────────
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
    {children}
  </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={[
      "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none",
      "transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60",
      props.className ?? "",
    ].join(" ")}
  />
);

const PrimaryBtn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }
> = ({ loading, children, ...rest }) => (
  <button
    {...rest}
    disabled={loading || rest.disabled}
    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_rgba(16,185,129,0.32)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
  >
    {loading ? (
      <span className="flex items-center justify-center gap-2">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        Please wait…
      </span>
    ) : (
      children
    )}
  </button>
);

// ── EyeToggle ─────────────────────────────────────────────────────────────────
const EyeToggle: React.FC<{ show: boolean; onToggle: () => void }> = ({ show, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition hover:bg-slate-50"
    aria-label={show ? "Hide password" : "Show password"}
  >
    {show ? "👁️" : "👁️‍🗨️"}
  </button>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function ForgotPasswordCard({ onGoLogin }: Props) {
  // ── shared state ──────────────────────────────────────────────────────────
  const [step,         setStep]         = useState<Step>("verify");
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  // ── step 1 state ──────────────────────────────────────────────────────────
  const [email,         setEmail]         = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [maskedContact, setMaskedContact] = useState<string | null>(null);
  const [emailChecked,  setEmailChecked]  = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);

  // ── step 2 state ──────────────────────────────────────────────────────────
  const [tempPassword,     setTempPassword]     = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showTemp,         setShowTemp]         = useState(false);
  const [showNew,          setShowNew]          = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const strength = getStrength(newPassword);

  // ── Step 1: check email on blur ───────────────────────────────────────────
  const handleEmailBlur = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;

    setEmailChecking(true);
    setEmailChecked(false);
    setMaskedContact(null);
    setError("");

    try {
      const { maskedContact: mc } = await checkEmailForReset(trimmed);
      setMaskedContact(mc);
      setEmailChecked(true);
    } catch (err: any) {
      const msg: string =
        err?.message ??
        err?.response?.data?.message ??
        "No account found with this email address.";
      setError(msg);
      setEmailChecked(false);
    } finally {
      setEmailChecking(false);
    }
  }, [email]);

  // ── Step 1 submit: verify email + contact → send temp password email ──────
  const onSubmitVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedEmail   = email.trim();
    const trimmedContact = contactNumber.trim();

    if (!trimmedEmail) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address."); return;
    }
    if (!trimmedContact) { setError("Please enter your contact number."); return; }
    if (trimmedContact.length < 7) {
      setError("Please enter a valid contact number."); return;
    }

    setLoading(true);
    try {
      await forgotPasswordApi({ email: trimmedEmail, contactNumber: trimmedContact });
      setStep("set-password");
    } catch (err: any) {
      const msg: string =
        err?.message ??
        err?.response?.data?.message ??
        "Verification failed. Please check your details and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 submit: verify temp password + set new password → go to login ──
  const onSubmitReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!tempPassword) { setError("Please enter the temporary password from your email."); return; }
    if (newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await resetPasswordApi({
        email: email.trim(),
        tempPassword,
        newPassword,
        confirmPassword,
      });
      setStep("success");
    } catch (err: any) {
      setError(
        err?.message ?? "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Redirect to login 2 s after success ─────────────────────────────────
  useEffect(() => {
    if (step !== "success") return;
    const t = setTimeout(onGoLogin, 2000);
    return () => clearTimeout(t);
  }, [step, onGoLogin]);

    // ── Shared error banner ───────────────────────────────────────────────────
  const ErrorBanner = () =>
    error ? (
      <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        <span className="mt-0.5 shrink-0">⚠️</span>
        <span>{error}</span>
      </div>
    ) : null;

  // ── Side image panel (shared across all steps) ───────────────────────────
  const SideImage = () => (
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
  );

  // ── Logo ──────────────────────────────────────────────────────────────────
  const Logo = () => (
    <div className="inline-flex items-center gap-2">
      <span className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_10px_20px_rgba(16,185,129,0.28)]" />
      <span className="text-sm font-extrabold tracking-tight text-slate-900">Care Home</span>
    </div>
  );

  // ── Step indicator ────────────────────────────────────────────────────────
  const StepPips = ({ current }: { current: 1 | 2 }) => (
    <div className="mt-4 flex items-center gap-1.5">
      {[1, 2].map((n) => (
        <div
          key={n}
          className={[
            "h-1.5 rounded-full transition-all",
            n === current
              ? "w-6 bg-emerald-600"
              : n < current
              ? "w-3 bg-emerald-400"
              : "w-3 bg-slate-200",
          ].join(" ")}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-slate-400">Step {current} of 2</span>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="grid items-stretch lg:grid-cols-2">
      <SideImage />

      <div className="p-5 sm:p-7">
        <Logo />

        {/* ── STEP 1: Email + Contact Number on one page ─────────────────── */}
        {step === "verify" && (
          <>
            <StepPips current={1} />
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              Forgot password?
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Enter your registered email and contact number to verify your identity.
              We'll send a temporary password to your email.
            </p>

            <ErrorBanner />

            <form onSubmit={onSubmitVerify} className="mt-4 space-y-3.5">

              {/* Email field */}
              <div>
                <Label>Email address</Label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setEmail(e.target.value);
                      setError("");
                      setEmailChecked(false);
                      setMaskedContact(null);
                    }}
                    onBlur={handleEmailBlur}
                    autoComplete="email"
                  />
                  {/* Inline status badge */}
                  {emailChecking && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent inline-block" />
                    </span>
                  )}
                  {emailChecked && !emailChecking && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">
                      ✓
                    </span>
                  )}
                </div>
                {emailChecked && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    ✓ Email found in our system
                  </p>
                )}
              </div>

              {/* Contact Number field */}
              <div>
                <Label>Contact number</Label>
                <Input
                  type="tel"
                  placeholder={maskedContact ?? "Enter your registered contact number"}
                  value={contactNumber}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setContactNumber(e.target.value);
                    setError("");
                  }}
                  autoComplete="tel"
                />
                {!maskedContact && email && !emailChecking && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Enter the contact number linked to your account.
                  </p>
                )}
              </div>

              <PrimaryBtn type="submit" loading={loading}>
                Verify &amp; Send Temporary Password →
              </PrimaryBtn>

              <p className="pt-1 text-center text-sm font-semibold text-slate-600">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={onGoLogin}
                  className="font-extrabold text-emerald-700 transition hover:underline hover:underline-offset-4"
                >
                  Sign in
                </button>
              </p>
            </form>
          </>
        )}

        {/* ── STEP 2: Enter temp password + set new password ──────────────── */}
        {step === "set-password" && (
          <>
            <StepPips current={2} />
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              Set your new password
            </h1>

            {/* Success info card */}
            <div className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <span className="mt-0.5 shrink-0">📧</span>
              <div>
                <p className="font-bold">Temporary password sent!</p>
                <p className="mt-0.5 font-medium text-emerald-700">
                  Check your inbox at{" "}
                  <span className="font-extrabold">{email}</span> and copy the
                  temporary password below.
                </p>
              </div>
            </div>

            <ErrorBanner />

            <form onSubmit={onSubmitReset} className="mt-4 space-y-3.5">

              {/* Temp password */}
              <div>
                <Label>Temporary password (from email)</Label>
                <div className="relative">
                  <Input
                    type={showTemp ? "text" : "password"}
                    placeholder="Paste the code from your email"
                    value={tempPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setTempPassword(e.target.value);
                      setError("");
                    }}
                    className="pr-12"
                    autoComplete="one-time-code"
                  />
                  <EyeToggle show={showTemp} onToggle={() => setShowTemp((p) => !p)} />
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                NOW CHOOSE YOUR NEW PASSWORD
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* New password */}
              <div>
                <Label>New password</Label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
                    className="pr-12"
                    autoComplete="new-password"
                  />
                  <EyeToggle show={showNew} onToggle={() => setShowNew((p) => !p)} />
                </div>
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={[
                            "h-1.5 flex-1 rounded-full transition-all",
                            i <= strength.bars ? strength.color : "bg-slate-200",
                          ].join(" ")}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <Label>Confirm new password</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    className="pr-12"
                    autoComplete="new-password"
                  />
                  <EyeToggle show={showConfirm} onToggle={() => setShowConfirm((p) => !p)} />
                </div>
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs font-bold text-red-500">Passwords do not match</p>
                )}
                {confirmPassword.length > 0 &&
                  newPassword === confirmPassword &&
                  newPassword.length >= 8 && (
                    <p className="mt-1 text-xs font-bold text-emerald-600">✓ Passwords match</p>
                  )}
              </div>

              <PrimaryBtn type="submit" loading={loading}>
                Reset Password &amp; Sign In →
              </PrimaryBtn>

            </form>
          </>
        )}

        {/* ── SUCCESS ────────────────────────────────────────────────────── */}
        <style>{`@keyframes shrinkBar { from { width: 100%; } to { width: 0%; } }`}</style>
        {step === "success" && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              ✅
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Password changed!
            </h1>
            <p className="text-sm text-slate-500 max-w-xs">
              Your password has been updated successfully.<br />
              Redirecting you to sign in…
            </p>
            <div className="mt-2 h-1 w-36 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-emerald-500" style={{ animation: "shrinkBar 1s linear forwards" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}