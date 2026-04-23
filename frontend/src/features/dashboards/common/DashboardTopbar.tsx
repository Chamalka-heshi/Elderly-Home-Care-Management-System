/**
 * src/features/dashboards/common/DashboardTopbar.tsx
 * ────────────────────────────────────────────────────
 * Single shared top-bar used by ALL role dashboards.
 *
 * Differences between roles are handled internally:
 *   • Role display label  — derived from user.role
 *   • Badge               — admin/super_admin get a coloured role badge;
 *                           all other roles show a plain "Online" badge
 *   • Subtitle            — passed as a prop (each dashboard supplies its own)
 */

import React from "react";
import { useAuth } from "../../../auth/AuthContext";
import { IconMenu, IconBell, IconChevronDown } from "./icons";

interface Props {
  /** Current page name shown as the page heading */
  activeMenu: string;
  /** Short description shown below the heading */
  subtitle?: string;
  onToggleSidebar: () => void;
  onProfileClick: () => void;
}

// ── Role helpers ──────────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Administrator",
  admin:       "Administrator",
  doctor:      "Doctor",
  caregiver:   "Caregiver",
  family:      "Family Member",
};

const DEFAULT_SUBTITLE = "Monitor, manage, and keep everything running smoothly.";

// ── Component ─────────────────────────────────────────────────────────────────
const DashboardTopbar: React.FC<Props> = ({
  activeMenu,
  subtitle = DEFAULT_SUBTITLE,
  onToggleSidebar,
  onProfileClick,
}) => {
  const { user } = useAuth();

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : (user?.role?.[0] ?? "U").toUpperCase();

  const displayName = user?.fullName ?? "User";
  const displayRole = ROLE_LABEL[user?.role ?? ""] ?? "User";

  // Badge — admin roles get a distinct coloured pill; others get "Online"
  const isAdminRole = user?.role === "admin" || user?.role === "super_admin";
  const badgeLabel = user?.role === "super_admin" ? "Super Admin"
    : user?.role === "admin" ? "Admin"
    : "Online";
  const badgeClass = user?.role === "super_admin"
    ? "hidden sm:inline-flex items-center rounded-full bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-100"
    : isAdminRole
      ? "hidden sm:inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100"
      : "hidden sm:inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">

        {/* ── Left: hamburger + page title ── */}
        <div className="flex items-center gap-3">
          <button
            className="rounded-xl p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <IconMenu className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 md:text-xl">{activeMenu}</h1>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        {/* ── Right: bell + profile chip ── */}
        <div className="flex items-center gap-3">

          {/* Notification bell */}
          <button
            className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100"
            aria-label="Notifications"
          >
            <IconBell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Profile chip */}
          <button
            onClick={onProfileClick}
            title="View / edit profile"
            className={[
              "group flex items-center gap-3 rounded-2xl border border-slate-200",
              "bg-white/80 px-4 py-2.5 shadow-sm",
              "transition hover:border-emerald-200 hover:bg-white hover:shadow-md",
            ].join(" ")}
          >
            {/* Avatar — photo if set, otherwise initials */}
            <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition group-hover:scale-105">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                : initials}
            </span>

            {/* Name + role */}
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold text-slate-900">{displayName}</span>
              <span className="block text-xs text-slate-500">{displayRole}</span>
            </span>

            {/* Role / status badge */}
            <span className={badgeClass}>{badgeLabel}</span>

            {/* Chevron */}
            <span className="hidden text-slate-400 transition group-hover:text-emerald-500 sm:block">
              <IconChevronDown className="h-4 w-4" />
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default DashboardTopbar;