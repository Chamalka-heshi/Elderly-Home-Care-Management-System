import { useState } from "react";
import type { FormEvent } from "react";

import sideImg from "../../../assets/Home/Login Art.png";

type Props = {
  onGoLogin: () => void;
};

const ROLES = ["Admin", "Doctor", "Caregiver", "Family Member"];

export default function ForgotPasswordCard({ onGoLogin }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Admin");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    // No backend — just show a success message
    setSubmitted(true);
  };

  return (
    <div className="grid items-stretch lg:grid-cols-2">
      {/* LEFT IMAGE */}
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

        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
          Forgot Password
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to manage elderly care, appointments and monitoring.
        </p>

        {/* Success state */}
        {submitted ? (
          <div className="mt-6 space-y-4">
            <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
              <span>✅</span>
              <span>
                If <strong>{email}</strong> is registered as a <strong>{role}</strong>, you'll
                receive a password reset link shortly.
              </span>
            </div>
            <button
              type="button"
              onClick={onGoLogin}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50"
            >
              ← Back to Sign in
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
              {/* Email */}
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
                  type="email"
                  placeholder="example@email.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60"
                />
              </div>

              {/* Role */}
              <div className="relative">
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                  Role
                </label>
                <button
                  type="button"
                  onClick={() => setShowRoleDropdown((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60"
                >
                  <span className="font-medium">{role}</span>
                  {/* Search/filter icon matching design */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                    />
                  </svg>
                </button>

                {showRoleDropdown && (
                  <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {ROLES.map((r) => (
                      <li key={r}>
                        <button
                          type="button"
                          onClick={() => {
                            setRole(r);
                            setShowRoleDropdown(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-medium transition hover:bg-emerald-50 hover:text-emerald-700 ${
                            role === r
                              ? "bg-emerald-50 font-extrabold text-emerald-700"
                              : "text-slate-700"
                          }`}
                        >
                          {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="group w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_rgba(16,185,129,0.32)] active:translate-y-0"
              >
                Reset Password
              </button>

              {/* Back to login */}
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
      </div>
    </div>
  );
}