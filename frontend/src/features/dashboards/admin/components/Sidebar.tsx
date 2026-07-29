import React, { useState, useMemo } from "react";
import SignOutButton from "../../../../components/signoutbtn";
import { IconSearch, IconX } from "../../common/icons";
import iconImg from "../../../../assets/landing/icon.png";
import { useAuth } from "../../../../auth/AuthContext";

// ── Types ──
export type MenuLabel =
  | "Dashboard"
  | "Admin Management"
  | "Doctor Management"
  | "Family Management"
  | "Patient Management"
  | "Caregiver Management"
  | "Patient Care Plans"
  | "Care Plan Management"
  | "Payments Management"
  | "Contact Messages"
  | "Channeling Slot Management"
  | "Appointment Management"
  | "Settings"
  | "Backup & Restore";

export interface MenuItem {
  icon: React.FC<{ className?: string }>;
  label: MenuLabel;
  section?: string;
}

interface Props {
  items: MenuItem[];
  activeMenu: MenuLabel;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (label: MenuLabel) => void;
}

// Provides a navigational backbone for the admin dashboard
const Sidebar: React.FC<Props> = ({ items, activeMenu, isOpen, onClose, onNavigate }) => {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  // Filters navigation items in real-time
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((m) => m.label.toLowerCase().includes(q)) : items;
  }, [items, search]);

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
          "fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col",
          "border-r border-slate-200/80 bg-white/70 backdrop-blur-xl",
          "shadow-[0_20px_60px_rgba(2,6,23,0.10)]",
          "lg:sticky lg:top-0 lg:z-30 lg:translate-x-0",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-full flex-col p-5 overflow-hidden">
          {/* Header & Brand identity */}
          <div className="flex shrink-0 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={iconImg} alt="Care Home Logo" className="h-10 w-10 object-contain" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Care Home</p>
                <p className="text-xs text-slate-500">{isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}</p>
              </div>
            </div>
            <button
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={onClose}
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mt-5 shrink-0">
            <input
              placeholder="Search menu…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-8 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch className="h-4 w-4" />
            </span>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Nav List — Independent scroll container */}
          <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No menu items found.
              </div>
            ) : (
              filtered.map((item, index) => {
                const Icon = item.icon;
                const active = activeMenu === item.label;
                const prevItem = filtered[index - 1];
                const showSectionHeader = item.section && (!prevItem || prevItem.section !== item.section);

                return (
                  <React.Fragment key={item.label}>
                    {/* Section Header */}
                    {showSectionHeader && (
                      <div className="flex items-center gap-2 px-2 pt-4 pb-1.5">
                        <div className="h-px flex-1 bg-slate-200/80" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.section}
                        </span>
                        <div className="h-px flex-1 bg-slate-200/80" />
                      </div>
                    )}

                    <button
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
                            "grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition",
                            active
                              ? "border-white/10 bg-white/15"
                              : "border-slate-200/50 bg-white group-hover:border-emerald-200",
                          ].join(" ")}
                        >
                          <Icon className={active ? "h-4 w-4 text-white" : "h-4 w-4 text-emerald-700"} />
                        </span>
                        <span className="flex-1 truncate">
                          <span className="block text-sm font-semibold">{item.label}</span>
                          <span className={["mt-0.5 block text-xs truncate", active ? "text-white/70" : "text-slate-500"].join(" ")}>
                            Manage {item.label.toLowerCase()}
                          </span>
                        </span>
                        <span className={["h-2.5 w-2.5 rounded-full transition shrink-0", active ? "bg-white" : "bg-transparent group-hover:bg-emerald-300"].join(" ")} />
                      </span>
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </nav>

          {/* User Account / Sign Out Footer */}
          <div className="mt-4 shrink-0 rounded-2xl border border-slate-200 bg-white/70 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {user?.fullName || 'Administrator'}
                </p>
                <p className="truncate text-[11px] text-slate-500">{user?.email || 'admin@carehome.lk'}</p>
              </div>
            </div>
            <div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;