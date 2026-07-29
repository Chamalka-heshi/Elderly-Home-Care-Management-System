/**
 * src/features/dashboards/familymember/FamilyMemberDashboard.tsx
 * ────────────────────────────────────────────────────────────────
 * Main family-member dashboard shell.
 * Mirrors DoctorDashboard exactly — same layout, same patterns,
 * family-member–specific menu items and pages.
 */

import React, { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth }     from "../../../auth/AuthContext";

// ── Layout components (family-member-specific) ────────────────────────────────
import Sidebar, { type MenuLabel, type MenuItem } from "./components/Sidebar";
import DashboardTopbar from "../common/DashboardTopbar";

// ── Shared widgets from common ────────────────────────────────────────────────

// ── Shared icons from common ──────────────────────────────────────────────────
import {
  IconLayoutDashboard, IconUsers,
  IconHeart, IconCalendar,
  IconCheckCircle, IconAlertCircle,
  type IconProps,
} from "../common/icons";

// ── Shared UI from common ─────────────────────────────────────────────────────
import { DashboardAmbientBg } from "../common/ui";

// ── Pages (family-member-specific) ────────────────────────────────────────────
import DashboardHome       from "./pages/DashboardHome";
import ElderlyProfile      from "./pages/ElderlyProfile";
import Prescription        from "./pages/Prescription";
import Appointments        from "./pages/Appointments";
import Payments            from "./pages/Payments";
import CarePlans           from "./pages/CarePlans";

// ── Menu items ────────────────────────────────────────────────────────────────

const MENU_ITEMS: MenuItem[] = [
  { icon: IconLayoutDashboard, label: "Dashboard"       },
  { icon: IconUsers,           label: "Elderly Profile", section: "Care Directory" },
  { icon: IconHeart,           label: "Prescription",    section: "Care & Appointments"    },
  { icon: IconHeart,           label: "Care Plans",      section: "Care & Appointments"      },
  { icon: (p: IconProps) => <IconCalendar {...p} />, label: "Appointments", section: "Care & Appointments" },
  { icon: (p: IconProps) => <IconCalendar {...p} />, label: "Payments", section: "Finance"  },
];

// ── Toast type ────────────────────────────────────────────────────────────────

interface Toast { id: number; kind: "success" | "error"; message: string; }

// ── Component ─────────────────────────────────────────────────────────────────

const FamilyMemberDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user }  = useAuth();

  const [activeMenu,    setActiveMenu]    = useState<MenuLabel>("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts,        setToasts]        = useState<Toast[]>([]);

  const menuToPath: Record<MenuLabel, string> = {
    Dashboard: '/family',
    'Elderly Profile': '/family/elderly-profile',
    Prescription: '/family/prescription',
    'Care Plans': '/family/care-plans',
    Appointments: '/family/appointments',
    Payments: '/family/payments',
  };

  const pathToMenu = useCallback((path: string): MenuLabel => {
    if (path.includes('/care-plans')) return 'Care Plans';
    if (path.includes('/appointments')) return 'Appointments';
    if (path.includes('/payments')) return 'Payments';
    if (path.includes('/prescription')) return 'Prescription';
    if (path.includes('/elderly-profile')) return 'Elderly Profile';
    return 'Dashboard';
  }, []);

  const handleFamilyMenuNavigation = useCallback(
    (label: MenuLabel) => {
      setActiveMenu(label);
      navigate(menuToPath[label]);
    },
    [navigate],
  );

  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  useEffect(() => {
    setActiveMenu(pathToMenu(location.pathname));
  }, [location.pathname, pathToMenu]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">

      <DashboardAmbientBg />

      {/* Toasts */}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-xl",
              t.kind === "success" ? "bg-emerald-600" : "bg-red-600",
            ].join(" ")}
          >
            {t.kind === "success" ? <IconCheckCircle /> : <IconAlertCircle />}
            {t.message}
          </div>
        ))}
      </div>

      <Sidebar
        items={MENU_ITEMS}
        activeMenu={activeMenu}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleFamilyMenuNavigation}
      />

      <div className="flex flex-1 flex-col h-screen overflow-y-auto min-w-0">
        <DashboardTopbar
          activeMenu={activeMenu}
          onToggleSidebar={() => setIsSidebarOpen((s) => !s)}
          onProfileClick={() => navigate(`/${user!.role}/profile`)}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
          {activeMenu === "Dashboard"       && <DashboardHome onNavigate={handleFamilyMenuNavigation} />}
          {activeMenu === "Elderly Profile" && <ElderlyProfile />}
          {activeMenu === "Prescription"    && <Prescription />}
          {activeMenu === "Care Plans"      && <CarePlans addToast={addToast} />}
          {activeMenu === "Appointments"    && <Appointments />}
          {activeMenu === "Payments"        && <Payments addToast={addToast} />}
        </main>
      </div>

    </div>
  );
};

export default FamilyMemberDashboard;