import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import sideImg from "../../../assets/Home/Login Art.png";

// ── NEW API IMPORTS ──────────────────────────────────────────────────────────
import { signin, googleAuth, isAuthenticated, getCurrentRole } from "../../../api/auth/auth.api";
import type { SigninRequest } from "../../../api/auth/auth.api";
import { useAuth } from "../../../auth/AuthContext";
// ─────────────────────────────────────────────────────────────────────────────

// ── Firebase error code → human-readable message ─────────────────────────────
const friendlyFirebaseError = (code: string): string => {
  const map: Record<string, string> = {
    'auth/popup-closed-by-user':    'Sign-in popup was closed. Please try again.',
    'auth/popup-blocked':           'Popup was blocked by your browser. Please allow popups for this site.',
    'auth/cancelled-popup-request': 'Sign-in cancelled.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
    'auth/network-request-failed':  'Network error. Please check your connection.',
    'auth/too-many-requests':       'Too many attempts. Please try again later.',
    'auth/user-disabled':           'This account has been disabled.',
    'auth/operation-not-allowed':   'Google sign-in is not enabled. Contact support.',
  };
  return map[code] ?? 'Sign-in failed. Please try again.';
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  onSuccessClose: () => void;
  onGoSignup: () => void;
  onForgotPassword?: () => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginCard({ onSuccessClose, onGoSignup, onForgotPassword }: Props) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [rememberMe, setRememberMe]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]               = useState("");

  // Redirect already-authenticated users
  useEffect(() => {
    if (isAuthenticated() && user) {
      const role = getCurrentRole();
      if (role) navigate(`/${role}`, { replace: true });
    }
  }, [user, navigate]);

  // Pre-fill remembered email
  useEffect(() => {
    const remembered = localStorage.getItem("rememberedEmail");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const handleSuccess = (role: string) => {
    onSuccessClose();
    navigate(`/${role}`, { replace: true });
  };

  // ── Email / Password submit ───────────────────────────────────────────────

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    const payload: SigninRequest = {
      email: email.trim().toLowerCase(),
      password,
    };

    try {
      const res = await signin(payload);

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email.trim().toLowerCase());
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      setUser(res.user);
      handleSuccess(res.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  // ── Google sign-in ────────────────────────────────────────────────────────

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const res = await googleAuth();
      setUser(res.user);
      handleSuccess(res.user.role);
    } catch (err: any) {
      const code: string = err?.code ?? "";
      setError(code ? friendlyFirebaseError(code) : (err?.message ?? "Google sign-in failed"));
    } finally {
      setGoogleLoading(false);
    }
  };

  const anyLoading = loading || googleLoading;

  // ── Render ────────────────────────────────────────────────────────────────

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
        <div className="inline-flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_10px_20px_rgba(16,185,129,0.28)]" />
          <span className="text-sm font-extrabold tracking-tight text-slate-900">Care Home</span>
        </div>

        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to manage elderly care, appointments and monitoring.
        </p>

        {/* Error banner */}
        {error && (
          <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Email / Password form ── */}
        <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
              disabled={anyLoading}
              type="email"
              placeholder="example@email.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                disabled={anyLoading}
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                minLength={8}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                disabled={anyLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition hover:bg-slate-50 disabled:opacity-70"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={anyLoading}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
              />
              Remember me
            </label>
            <button
              type="button"
              className="text-sm font-extrabold text-emerald-700 transition hover:underline hover:underline-offset-4"
              onClick={onForgotPassword}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={anyLoading}
            className="group w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_rgba(16,185,129,0.32)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>

          <p className="pt-1 text-center text-sm font-semibold text-slate-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onGoSignup}
              className="font-extrabold text-sky-700 transition hover:underline hover:underline-offset-4"
            >
              Sign up
            </button>
          </p>
        </form>

        {/* ── Divider ── */}
        <div className="my-5 flex items-center gap-3">
          <span className="h-px w-full bg-slate-200" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            or continue with
          </span>
          <span className="h-px w-full bg-slate-200" />
        </div>

        {/* ── Google sign-in button ── */}
        <button
          type="button"
          disabled={anyLoading}
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleLoading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-red-500" />
          ) : (
            <GoogleIcon />
          )}
          <span>{googleLoading ? "Connecting…" : "Continue with Google"}</span>
        </button>
      </div>
    </div>
  );
}

// ── Icon ──────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M47.532 24.552c0-1.636-.132-3.202-.388-4.701H24.48v9.01h12.985c-.566 2.99-2.24 5.525-4.76 7.226v5.998h7.698c4.508-4.15 7.129-10.269 7.129-17.533z" fill="#4285F4"/>
      <path d="M24.48 48c6.504 0 11.955-2.152 15.94-5.852l-7.698-5.998c-2.156 1.444-4.912 2.295-8.242 2.295-6.34 0-11.706-4.278-13.624-10.026H3.026v6.19C6.998 42.618 15.147 48 24.48 48z" fill="#34A853"/>
      <path d="M10.856 28.42A14.368 14.368 0 0 1 10.01 24c0-1.53.264-3.017.846-4.42v-6.19H3.026A23.928 23.928 0 0 0 .48 24c0 3.86.928 7.512 2.546 10.61l7.83-6.19z" fill="#FBBC05"/>
      <path d="M24.48 9.554c3.57 0 6.762 1.226 9.282 3.634l6.946-6.946C36.428 2.384 30.984 0 24.48 0 15.147 0 6.998 5.382 3.026 13.39l7.83 6.19C12.774 13.832 18.14 9.554 24.48 9.554z" fill="#EA4335"/>
    </svg>
  );
}