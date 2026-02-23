/**
 * src/features/dashboards/common/ui.tsx
 * ──────────────────────────────────────
 * Reusable glassmorphism UI primitives shared across AdminProfile,
 * DoctorProfile, and any future role-based profile pages.
 *
 * Components exported:
 *  - FieldLabel      — styled <label> for form fields
 *  - GlassInput      — frosted-glass <input>
 *  - GlassSelect     — frosted-glass <select>
 *  - SectionCard     — rounded glass card with optional title / subtitle / right slot
 *  - PrimaryBtn      — action button in emerald / blue / red tone
 *  - Pill            — inline badge chip
 *  - AmbientBg       — fixed full-screen decorative blobs
 *  - ToastList       — renders the active toast stack
 *
 * Types exported:
 *  - Toast           — { id, kind, message }
 */

import React from "react";

// ── FieldLabel ────────────────────────────────────────────────────────────────

export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-600">
    {children}
  </label>
);

// ── GlassInput ────────────────────────────────────────────────────────────────

export const GlassInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = "", ...props
}) => (
  <input
    {...props}
    className={[
      "w-full rounded-xl border border-white/30 bg-white/70 px-4 py-3 text-sm text-slate-900",
      "shadow-[0_10px_25px_-20px_rgba(0,0,0,0.6)] backdrop-blur",
      "outline-none ring-0 transition",
      "focus:border-emerald-400/60 focus:bg-white focus:shadow-[0_20px_60px_-35px_rgba(16,185,129,0.8)]",
      "disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-slate-500",
      className,
    ].join(" ")}
  />
);

// ── GlassSelect ───────────────────────────────────────────────────────────────

export const GlassSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = "", children, ...props
}) => (
  <select
    {...props}
    className={[
      "w-full rounded-xl border border-white/30 bg-white/70 px-4 py-3 text-sm text-slate-900",
      "shadow-[0_10px_25px_-20px_rgba(0,0,0,0.6)] backdrop-blur",
      "outline-none ring-0 transition focus:border-emerald-400/60 focus:bg-white",
      className,
    ].join(" ")}
  >
    {children}
  </select>
);

// ── SectionCard ───────────────────────────────────────────────────────────────

export const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, rightSlot, children }) => (
  <section className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/60 p-6 shadow-[0_30px_80px_-55px_rgba(0,0,0,0.6)] backdrop-blur-xl md:p-8">
    {/* Decorative blobs inside the card */}
    <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-sky-500/12 blur-3xl" />

    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 md:text-xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {rightSlot}
    </div>
    {children}
  </section>
);

// ── PrimaryBtn ────────────────────────────────────────────────────────────────

type BtnTone = "emerald" | "blue" | "red";

const btnToneMap: Record<BtnTone, string> = {
  emerald: "bg-emerald-600 hover:bg-emerald-700 shadow-[0_20px_55px_-30px_rgba(16,185,129,0.95)]",
  blue:    "bg-blue-600 hover:bg-blue-700 shadow-[0_20px_55px_-30px_rgba(37,99,235,0.95)]",
  red:     "bg-red-600 hover:bg-red-700 shadow-[0_20px_55px_-30px_rgba(239,68,68,0.95)]",
};

export const PrimaryBtn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: BtnTone }
> = ({ className = "", tone = "emerald", ...props }) => (
  <button
    {...props}
    className={[
      "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white",
      "transition active:scale-[0.98]",
      btnToneMap[tone],
      className,
    ].join(" ")}
  />
);

// ── Pill ──────────────────────────────────────────────────────────────────────

type PillTone = "emerald" | "slate" | "purple";

const pillToneMap: Record<PillTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  slate:   "bg-slate-50 text-slate-700 ring-slate-200",
  purple:  "bg-purple-50 text-purple-700 ring-purple-200",
};

export const Pill: React.FC<{ children: React.ReactNode; tone?: PillTone }> = ({
  children, tone = "emerald",
}) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${pillToneMap[tone]}`}>
    {children}
  </span>
);

// ── AmbientBg ─────────────────────────────────────────────────────────────────
// Fixed full-screen decorative gradient blobs; place once per page.

export const AmbientBg: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
    <div className="absolute left-10 top-28 h-[420px] w-[420px] rounded-full bg-sky-500/15 blur-3xl" />
    <div className="absolute bottom-10 right-10 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-3xl" />
  </div>
);

// Alternate variant used by the dashboard shell (slightly different colours).
export const DashboardAmbientBg: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
    <div className="absolute -right-24 top-40 h-80 w-80 rounded-full bg-green-400/10 blur-3xl" />
    <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl" />
  </div>
);

// ── Toast ─────────────────────────────────────────────────────────────────────

export interface Toast { id: number; kind: "success" | "error"; message: string; }

export const ToastList: React.FC<{ toasts: Toast[] }> = ({ toasts }) => (
  <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={[
          "flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-xl",
          t.kind === "success" ? "bg-emerald-600" : "bg-red-600",
        ].join(" ")}
      >
        {/* Inline minimal icons to avoid circular imports */}
        {t.kind === "success" ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 3.8 21 20H3L12 3.8Z" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M12 9v5" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M12 17.5h.01" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}
        {t.message}
      </div>
    ))}
  </div>
);
