

import React from "react";
import { useAuth } from "../../../../auth/AuthContext";
import type { MenuLabel } from "./Sidebar";

const MenuIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const BellIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

interface Props {
  activeMenu: MenuLabel;
  onToggleSidebar: () => void;
  onProfileClick: () => void;   
}

const Topbar: React.FC<Props> = ({ activeMenu, onToggleSidebar, onProfileClick }) => {
  const { user } = useAuth();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  const displayName = user?.full_name ?? "Admin User";
  const displayRole =
    user?.role === "admin"     ? "Administrator" :
    user?.role === "doctor"    ? "Doctor"        :
    user?.role === "caregiver" ? "Caregiver"     : "Family Member";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">

        {}
        <div className="flex items-center gap-3">
          <button
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 transition lg:hidden"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <MenuIcon />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 md:text-xl">{activeMenu}</h1>
            <p className="text-xs text-slate-500">
              Monitor, manage, and keep everything running smoothly.
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button
            className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 transition"
            aria-label="Notifications"
          >
            <BellIcon />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* ── Profile chip */}
          <button
            onClick={onProfileClick}
            title="View / edit profile"
            className={[
              "group flex items-center gap-3 rounded-2xl border border-slate-200",
              "bg-white/80 px-4 py-2.5 shadow-sm",
              "transition hover:border-emerald-200 hover:bg-white hover:shadow-md",
            ].join(" ")}
          >
            {/* Avatar circle */}
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition group-hover:scale-105">
              {initials}
            </span>

            {/* Name */}
            <span className="hidden sm:block text-left">
              <span className="block text-sm font-semibold text-slate-900">{displayName}</span>
              <span className="block text-xs text-slate-500">{displayRole}</span>
            </span>

            {/* Role badge */}
            <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
              Admin
            </span>

            {/* Chevron */}
            <span className="hidden sm:block text-slate-400 transition group-hover:text-emerald-500">
              <ChevronDownIcon />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
