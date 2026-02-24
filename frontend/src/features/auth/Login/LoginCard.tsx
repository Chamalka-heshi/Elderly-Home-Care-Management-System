import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import sideImg from "../../../assets/Home/Login Art.png";
import { signin, isAuthenticated, getCurrentRole } from "../../../api/auth.api";
import type { SigninRequest } from "../../../api/auth.api";
import { useAuth } from "../../../auth/AuthContext";

type Props = {
  onSuccessClose: () => void;
  onGoSignup: () => void;
  onForgotPassword?: () => void;
};

export default function LoginCard({ onSuccessClose, onGoSignup, onForgotPassword }: Props) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated() && user) {
      const role = getCurrentRole();
      if (role) navigate(`/${role}`, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const remembered = localStorage.getItem("rememberedEmail");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

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
      setUser(res.user);

      onSuccessClose();
      navigate(`/${res.user.role}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setPassword("");
    } finally {
      setLoading(false);
    }
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
        <div className="inline-flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_10px_20px_rgba(16,185,129,0.28)]" />
          <span className="text-sm font-extrabold tracking-tight text-slate-900">Care Home</span>
        </div>

        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to manage elderly care, appointments and monitoring.
        </p>

        {error && (
          <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              disabled={loading}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                minLength={8}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
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
                disabled={loading}
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
            disabled={loading}
            className="group w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_rgba(16,185,129,0.32)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in →"}
          </button>

          <div className="flex items-center gap-3">
            <span className="h-px w-full bg-slate-200" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">or</span>
            <span className="h-px w-full bg-slate-200" />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => setError("Google Sign-in is not yet implemented")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50 disabled:opacity-70"
          >
            <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white font-black text-red-500">
              G
            </span>
            Continue with Google
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => setError("Facebook Sign-in is not yet implemented")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50 disabled:opacity-70"
          >
            <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white font-black text-blue-600">
              f
            </span>
            Continue with Facebook
          </button>

          <p className="pt-1 text-center text-sm font-semibold text-slate-600">
            Don’t have an account?{" "}
            <button
              type="button"
              onClick={onGoSignup}
              className="font-extrabold text-sky-700 transition hover:underline hover:underline-offset-4"
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}