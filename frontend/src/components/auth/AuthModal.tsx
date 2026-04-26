import { useEffect } from "react";

// Supported authentication views within the modal
export type AuthMode = "login" | "signup" | "forgot";

// Parameter types for AuthModal
type Props = {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
  children: React.ReactNode;
};

// Reusable modal shell for authentication workflows
export default function AuthModal({
  open,
  mode,
  onClose,
  onSwitchMode,
  children,
}: Props) {
  // Handle escape key and body scroll lock when modal is active
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  // Header content configuration based on current mode
  const topLabel =
    mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset Password";

  const switchLabel =
    mode === "signup" ? "Go to Login" : "Go to Sign up";

  const switchTarget: AuthMode =
    mode === "signup" ? "login" : "signup";

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Darkened backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Centered modal container */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          className="
            relative w-full max-w-5xl overflow-hidden rounded-3xl
            border border-white/25 bg-white/70
            shadow-[0_40px_120px_-55px_rgba(2,6,23,0.60)]
            backdrop-blur-xl
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar: Status and Navigation actions */}
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-white/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm font-extrabold text-slate-800">{topLabel}</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick toggle between Login/Signup */}
              <button
                type="button"
                onClick={() => onSwitchMode(switchTarget)}
                className="
                  rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700
                  transition hover:bg-slate-50
                "
              >
                {switchLabel}
              </button>

              {/* Close Action */}
              <button
                type="button"
                onClick={onClose}
                className="
                  rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700
                  transition hover:bg-slate-50
                "
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Content: Injected Auth Card */}
          {children}
        </div>
      </div>
    </div>
  );
}
