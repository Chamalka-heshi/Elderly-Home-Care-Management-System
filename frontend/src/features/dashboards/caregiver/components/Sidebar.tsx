import React, { useState, useMemo } from "react";
import SignOutButton from "../../../../components/signoutbtn";

// ── Icons ──
const SparkleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.2 4.2L17.4 8l-4.2 1.2L12 13.4l-1.2-4.2L6.6 8l4.2-1.8L12 2zm7 7l.8 2.8 2.8.8-2.8.8L19 16.6l-.8-2.8-2.8-.8 2.8-1.2L19 9zM4 14l1 3.3L8.3 18 5 19l-1 3-1-3-3-.7 3-.7L4 14z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2-4.35-4.35" />
  </svg>
);

const XIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Types ─
export type MenuLabel =
  | "Dashboard"
  | "Assigned Patients"
  | "Care Notes"
  | "Vital Records"
  | "Medication Updates"
  | "Care Schedule"
  | "Settings";

export interface MenuItem {
  icon: React.FC<{ className?: string }>;
  label: MenuLabel;
}

interface Props {
  items: MenuItem[];
  activeMenu: MenuLabel;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (label: MenuLabel) => void;
}

// ── Component ────
const Sidebar: React.FC<Props> = ({ items, activeMenu, isOpen, onClose, onNavigate }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((m) => m.label.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const subtitleMap: Record<MenuLabel, string> = {
    "Dashboard":          "View daily care overview",
    "Assigned Patients":  "View assigned patients",
    "Care Notes":         "Update daily care notes",
    "Vital Records":      "Record patient vital signs",
    "Medication Updates": "Track medication status",
    "Care Schedule":      "View assigned care schedule",
    "Settings":           "Manage settings",
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col",
          "border-r border-white/10 bg-white/70 backdrop-blur-xl",
          "shadow-[0_20px_60px_rgba(2,6,23,0.10)]",
          "lg:static lg:z-auto lg:translate-x-0",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex flex-1 flex-col overflow-y-auto p-5">

          {/* Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
                <SparkleIcon />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Care Home</p>
                <p className="text-xs text-slate-500">Caregiver Panel</p>
              </div>
            </div>
            <button
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={onClose}
            >
              <XIcon />
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-5">
            <input
              placeholder="Search menu…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
          </div>

          {/* Nav */}
          <nav className="mt-5 flex-1 space-y-1">
            {filtered.map((item) => {
              const Icon = item.icon;
              const active = activeMenu === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => { onNavigate(item.label); onClose(); }}
                  className={[
                    "group w-full rounded-2xl px-4 py-3 text-left transition-all duration-200",
                    active
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                      : "text-slate-700 hover:bg-slate-100/80",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={[
                        "grid h-9 w-9 place-items-center rounded-xl border transition",
                        active
                          ? "border-white/10 bg-white/15"
                          : "border-slate-200/50 bg-white group-hover:border-emerald-200",
                      ].join(" ")}
                    >
                      <Icon className={active ? "h-5 w-5 text-white" : "h-5 w-5 text-emerald-700"} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className={["mt-0.5 block text-xs", active ? "text-white/70" : "text-slate-500"].join(" ")}>
                        {subtitleMap[item.label]}
                      </span>
                    </span>
                    <span className={["h-2.5 w-2.5 rounded-full transition", active ? "bg-white" : "bg-transparent group-hover:bg-emerald-300"].join(" ")} />
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Sign out */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold text-slate-700">Account</p>
            <p className="mt-1 text-xs text-slate-500">Securely sign out when you're done.</p>
            <div className="mt-3">
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
