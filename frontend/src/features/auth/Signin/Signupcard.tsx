import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import sideImg from "../../../assets/Home/Login Art.png";
import { signup } from "../../../api/auth.api";
import type { SignupRequest } from "../../../api/auth.api";
import { useAuth } from "../../../auth/AuthContext";

type Props = {
  onSuccessClose: () => void;
  onGoLogin: () => void;
};

export default function SignupCard({ onSuccessClose, onGoLogin }: Props) {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState<SignupRequest>({
    fullName: "",
    email: "",
    contactNumber: "",
    password: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "contactNumber") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
      if (error) setError("");
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (formData.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.contactNumber)) {
      setError("Contact number must be exactly 10 digits.");
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must include uppercase, lowercase, number & special character.");
      return;
    }

    setLoading(true);

    try {
      const response = await signup({
        ...formData,
        email: formData.email.trim().toLowerCase(),
        fullName: formData.fullName.trim(),
      });

      setUser(response.user);
      onSuccessClose();
      navigate("/family", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
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
            <p className="text-base font-black tracking-tight">Care starts here.</p>
            <p className="mt-1 text-sm font-medium text-white/85">
              Create your account to manage care smoothly.
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

        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Create account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Join us today to manage elderly care for your loved ones.
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
              Full name
            </label>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading}
              type="text"
              placeholder="John Doe"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60 disabled:bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Email
            </label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              type="email"
              placeholder="example@email.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60 disabled:bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Contact number
            </label>
            <input
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              disabled={loading}
              type="tel"
              inputMode="numeric"
              placeholder="0771234567"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60 disabled:bg-slate-50"
              required
            />
            <p className="mt-1 text-xs font-semibold text-slate-500">Must be 10 digits.</p>
          </div>

          {/* password + confirm on one line */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 chars"
                  minLength={8}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60 disabled:bg-slate-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition hover:bg-slate-50 disabled:opacity-70"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                Confirm
              </label>
              <div className="relative">
                <input
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={loading}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter"
                  minLength={8}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/60 disabled:bg-slate-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition hover:bg-slate-50 disabled:opacity-70"
                >
                  {showConfirm ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
          </div>

          <p className="-mt-1 text-xs font-semibold text-slate-500">
            Min 8 chars with uppercase, lowercase, number & special char.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_rgba(16,185,129,0.32)] disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Sign up →"}
          </button>

          <p className="pt-1 text-center text-sm font-semibold text-slate-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onGoLogin}
              className="font-extrabold text-sky-700 transition hover:underline hover:underline-offset-4"
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}