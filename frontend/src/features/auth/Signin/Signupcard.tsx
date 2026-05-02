import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import sideImg from "../../../assets/landing/auth-side-art.png";
import iconImg from "../../../assets/landing/icon.png";
import { IconGoogle } from "../../dashboards/common/icons";

// Auth services
import { googleAuth } from "../../../api/auth/auth.api";
import { signupFamily } from "../../../api/auth/family-auth.api";
import { useAuth } from "../../../auth/AuthContext";

// Configuration constants
const MIN_PASSWORD_LENGTH = 8;
const CONTACT_NUMBER_LENGTH = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Parameter types for SignupRequest
export interface SignupRequest {
  fullName: string;
  email: string;
  contactNumber: string;
  password?: string;
}

// User-friendly mapping for technical Firebase errors
const FRIENDLY_FIREBASE_ERRORS: Record<string, string> = {
  "auth/popup-closed-by-user": "Sign-up popup was closed. Please try again.",
  "auth/popup-blocked": "Popup was blocked by your browser. Please allow popups for this site.",
  "auth/cancelled-popup-request": "Sign-up cancelled.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",
  "auth/network-request-failed": "Network error. Please check your connection.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/operation-not-allowed": "Google sign-in is not enabled. Contact support.",
};

const getFriendlyFirebaseError = (code: string): string =>
  FRIENDLY_FIREBASE_ERRORS[code] ?? "Sign-up failed. Please try again.";

// Centralized error state — one field per input + a top-level banner for non-field errors
type ErrorState = {
  banner: string;
  fullName: string;
  email: string;
  contactNumber: string;
  password: string;
  confirmPassword: string;
};

const NO_ERRORS: ErrorState = {
  banner: "",
  fullName: "",
  email: "",
  contactNumber: "",
  password: "",
  confirmPassword: "",
};

// Parameter types for SignupCard
type Props = {
  onSuccessClose: () => void;
  onGoLogin: () => void;
};

// Responsive multi-method signup interface
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorState>(NO_ERRORS);

  const clearErrors = () => setErrors(NO_ERRORS);

  // Clears only the error for the field being edited — leaves other errors intact
  const clearFieldError = (field: keyof ErrorState) =>
    setErrors((prev) => ({ ...prev, [field]: "" }));

  // Input change handler — strips non-digits for phone, clears that field's error
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    clearFieldError(name as keyof ErrorState);

    if (name === "contactNumber") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, CONTACT_NUMBER_LENGTH);
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSuccess = (role: string) => {
    onSuccessClose();
    navigate(`/${role}`, { replace: true });
  };

  // Maps a server/API error message to the correct field or the banner
  const applyServerError = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes("email") || lower.includes("account")) {
      setErrors({ ...NO_ERRORS, email: msg });
    } else if (lower.includes("name")) {
      setErrors({ ...NO_ERRORS, fullName: msg });
    } else if (lower.includes("contact") || lower.includes("phone")) {
      setErrors({ ...NO_ERRORS, contactNumber: msg });
    } else if (lower.includes("password")) {
      setErrors({ ...NO_ERRORS, password: msg });
    } else {
      setErrors({ ...NO_ERRORS, banner: msg });
    }
  };

  // Handle email/password registration
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearErrors();

    const trimmedName = formData.fullName.trim();
    const trimmedEmail = formData.email.trim();

    // Accumulate ALL field errors before bailing — user sees everything at once
    const nextErrors: ErrorState = { ...NO_ERRORS };

    if (!trimmedName) {
      nextErrors.fullName = "Full name is required.";
    } else if (trimmedName.length < 2) {
      nextErrors.fullName = "Full name must be at least 2 characters.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!formData.contactNumber) {
      nextErrors.contactNumber = "Contact number is required.";
    } else if (formData.contactNumber.length !== CONTACT_NUMBER_LENGTH) {
      nextErrors.contactNumber = `Contact number must be exactly ${CONTACT_NUMBER_LENGTH} digits.`;
    }

    if (!formData.password) {
      nextErrors.password = "Password is required.";
    } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      nextErrors.password =
        "Password must include uppercase, lowercase, number & special character.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password && confirmPassword !== formData.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    // If any field-level errors exist, show them all and bail
    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await signupFamily({
        ...formData,
        email: trimmedEmail.toLowerCase(),
        fullName: trimmedName,
      });
      setUser(response.user);
      handleSuccess(response.user.role);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign up failed. Please try again.";
      applyServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google signup flow
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    clearErrors();

    try {
      const res = await googleAuth();
      setUser(res.user);
      handleSuccess(res.user.role);
    } catch (err: any) {
      const code: string = err?.code ?? "";
      const msg = code
        ? getFriendlyFirebaseError(code)
        : (err?.message ?? "Google sign-up failed. Please try again.");
      setErrors({ ...NO_ERRORS, banner: msg });
    } finally {
      setGoogleLoading(false);
    }
  };

  const anyLoading = loading || googleLoading;

  // Reusable input border class based on whether that field has an error
  const inputClass = (field: keyof ErrorState) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition hover:border-slate-300 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
      errors[field]
        ? "border-red-400 focus:border-red-400 focus:ring-red-200/60"
        : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-200/60"
    }`;

  return (
    <div className="grid items-stretch lg:grid-cols-2">
      {/* Left side: Hero Image and Branding */}
      <div className="relative hidden lg:block">
        <Link to="/">
          <img
            src={sideImg}
            alt="Care Home"
            className="h-full w-full object-cover cursor-pointer"
          />
        </Link>
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

      {/* Right side: Signup Form */}
      <div className="overflow-y-auto p-5 sm:p-7" style={{ maxHeight: "90vh" }}>
        <div className="inline-flex items-center gap-2">
          <img src={iconImg} alt="Care Home Logo" className="h-6 w-6 object-contain" />
          <span className="text-sm font-extrabold tracking-tight text-slate-900">Care Home</span>
        </div>

        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Create account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Join us today to manage elderly care for your loved ones.
        </p>

        {/* Banner: non-field errors (network, Google, etc.) */}
        {errors.banner && (
          <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <span>⚠️</span>
            <span>{errors.banner}</span>
          </div>
        )}

        {/* Signup Credentials Form */}
        <form onSubmit={onSubmit} className="mt-5 space-y-3.5" noValidate>

          {/* Full Name */}
          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Full name
            </label>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={anyLoading}
              type="text"
              placeholder="John Doe"
              className={inputClass("fullName")}
            />
            {errors.fullName && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Email
            </label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={anyLoading}
              type="email"
              placeholder="example@email.com"
              className={inputClass("email")}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.email}</p>
            )}
          </div>

          {/* Contact Number */}
          <div>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Contact number
            </label>
            <input
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              disabled={anyLoading}
              type="tel"
              inputMode="numeric"
              placeholder="0771234567"
              className={inputClass("contactNumber")}
            />
            {errors.contactNumber ? (
              <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.contactNumber}</p>
            ) : (
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Must be {CONTACT_NUMBER_LENGTH} digits.
              </p>
            )}
          </div>

          {/* Password + Confirm side-by-side */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={anyLoading}
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 chars"
                  className={`${inputClass("password")} pr-12`}
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
              {errors.password && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                Confirm
              </label>
              <div className="relative">
                <input
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError("confirmPassword");
                  }}
                  disabled={anyLoading}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter"
                  className={`${inputClass("confirmPassword")} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  disabled={anyLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition hover:bg-slate-50 disabled:opacity-70"
                >
                  {showConfirm ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">
                  ⚠ {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <p className="-mt-1 text-xs font-semibold text-slate-500">
            Min {MIN_PASSWORD_LENGTH} chars with uppercase, lowercase, number &amp; special char.
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={anyLoading}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_rgba(16,185,129,0.32)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating account…" : "Sign up →"}
          </button>

          {/* Sign in link */}
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

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <span className="h-px w-full bg-slate-200" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            or continue with
          </span>
          <span className="h-px w-full bg-slate-200" />
        </div>

        {/* Google Signup */}
        <button
          type="button"
          disabled={anyLoading}
          onClick={handleGoogleSignup}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleLoading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-red-500" />
          ) : (
            <IconGoogle />
          )}
          <span>{googleLoading ? "Connecting…" : "Continue with Google"}</span>
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          Signing up with Google creates a family member account instantly.
        </p>
      </div>
    </div>
  );
}