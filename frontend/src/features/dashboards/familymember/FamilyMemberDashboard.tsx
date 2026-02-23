/**
 * src/features/dashboards/familymember/FamilyMemberDashboard.tsx
 * ────────────────────────────────────────────────────────────────
 * Main family-member dashboard shell.
 * Mirrors DoctorDashboard exactly — same layout, same patterns,
 * family-member–specific menu items and pages.
 */

import React, { useState, useCallback } from "react";

// ── Layout components (family-member-specific) ────────────────────────────────
import Sidebar, { type MenuLabel, type MenuItem } from "./components/Sidebar";
import Topbar                                      from "./components/Topbar";

// ── Shared widgets from common ────────────────────────────────────────────────
import FormModal, { type FieldConfig } from "../common/widgets/FormModal";

// ── Shared icons from common ──────────────────────────────────────────────────
import {
  IconLayoutDashboard, IconUsers, IconClipboard,
  IconHeart, IconCalendar, IconSettings,
  IconCheckCircle, IconAlertCircle,
  type IconProps,
} from "../common/icons";

// ── Shared UI from common ─────────────────────────────────────────────────────
import { DashboardAmbientBg } from "../common/ui";

// ── Pages (family-member-specific) ────────────────────────────────────────────
import FamilyMemberProfile from "./pages/FamilyMemberProfile";
import DashboardHome       from "./pages/DashboardHome";
import ElderlyProfile      from "./pages/ElderlyProfile";
import MedicalReports      from "./pages/MedicalReports";
import Prescription        from "./pages/Prescription";
import CareUpdates         from "./pages/CareUpdates";
import Payments            from "./pages/Payments";
import Settings            from "./pages/Settings";

// ── Menu items ────────────────────────────────────────────────────────────────

const MENU_ITEMS: MenuItem[] = [
  { icon: IconLayoutDashboard, label: "Dashboard"       },
  { icon: IconUsers,           label: "Elderly Profile" },
  { icon: IconClipboard,       label: "Medical Reports" },
  { icon: IconHeart,           label: "Prescription"    },
  { icon: IconCalendar,        label: "Care Updates"    },
  { icon: (p: IconProps) => <IconCalendar {...p} />, label: "Payments"  },
  { icon: (p: IconProps) => <IconSettings {...p} />, label: "Settings"  },
];

// ── Contact Support modal fields ──────────────────────────────────────────────

const CONTACT_FIELDS: FieldConfig[] = [
  { name: "subject", label: "Subject",  required: true, placeholder: "e.g. Care update query" },
  { name: "message", label: "Message",  required: true, placeholder: "Describe your query…", textarea: true },
];

// ── Toast type ────────────────────────────────────────────────────────────────

interface Toast { id: number; kind: "success" | "error"; message: string; }

// ── Component ─────────────────────────────────────────────────────────────────

const FamilyMemberDashboard: React.FC = () => {
  const [activeMenu,    setActiveMenu]    = useState<MenuLabel>("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfile,   setShowProfile]   = useState(false);
  const [toasts,        setToasts]        = useState<Toast[]>([]);

  const [showContact,  setShowContact]  = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const handleContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      setModalLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      addToast("success", `Message "${fd.get("subject")}" sent successfully.`);
      setShowContact(false);
    } catch {
      addToast("error", "Failed to send message.");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      <DashboardAmbientBg />

      {/* Toasts */}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-xl",
              t.kind === "success" ? "bg-emerald-600" : "bg-red-600",
            ].join(" ")}
          >
            {t.kind === "success" ? <IconCheckCircle /> : <IconAlertCircle />}
            {t.message}
          </div>
        ))}
      </div>

      <div className="flex min-h-screen">
        <Sidebar
          items={MENU_ITEMS}
          activeMenu={activeMenu}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={(label) => setActiveMenu(label)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar
            activeMenu={activeMenu}
            onToggleSidebar={() => setIsSidebarOpen((s) => !s)}
            onProfileClick={() => setShowProfile(true)}
          />

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
            {activeMenu === "Dashboard"       && <DashboardHome onNavigate={setActiveMenu} onContact={() => setShowContact(true)} />}
            {activeMenu === "Elderly Profile" && <ElderlyProfile />}
            {activeMenu === "Medical Reports" && <MedicalReports />}
            {activeMenu === "Prescription"    && <Prescription />}
            {activeMenu === "Care Updates"    && <CareUpdates />}
            {activeMenu === "Payments"        && <Payments />}
            {activeMenu === "Settings"        && <Settings />}
          </main>
        </div>
      </div>

      {/* Full-screen profile overlay */}
      {showProfile && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-50">
          <FamilyMemberProfile onBack={() => setShowProfile(false)} />
        </div>
      )}

      {/* Contact support modal */}
      <FormModal
        title="Contact Support"
        open={showContact}
        loading={modalLoading}
        onClose={() => setShowContact(false)}
        onSubmit={handleContact}
        fields={CONTACT_FIELDS}
      />
    </div>
  );
};

export default FamilyMemberDashboard;
