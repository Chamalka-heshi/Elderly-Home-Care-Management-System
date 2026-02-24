import React, { useState, useCallback } from "react";

// ── Layout components (caregiver-specific) ──
import Sidebar, { type MenuLabel, type MenuItem } from "./components/Sidebar";
import Topbar                                      from "./components/Topbar";

// ── Shared widgets from common ───
import FormModal, { type FieldConfig } from "../common/widgets/FormModal";

// ── Shared icons from common ──
import {
  IconLayoutDashboard, IconUsers, IconClipboard,
  IconHeart, IconCalendar, IconSettings,
  IconCheckCircle, IconAlertCircle,
  type IconProps,
} from "../common/icons";

// ── Shared UI from common ───
import { DashboardAmbientBg } from "../common/ui";

// ── Pages (caregiver-specific) ──
import CaregiverProfile   from "./pages/CaregiverProfile";
import DashboardHome      from "./pages/DashboardHome";
import AssignedPatients   from "./pages/AssignedPatients";
import CareNotes          from "./pages/CareNotes";
import VitalRecords       from "./pages/VitalRecords";
import MedicationUpdates  from "./pages/MedicationUpdates";
import CareSchedule       from "./pages/CareSchedule";
import Settings           from "./pages/Settings";

// ── Menu items ──

const MENU_ITEMS: MenuItem[] = [
  { icon: IconLayoutDashboard,                         label: "Dashboard"          },
  { icon: IconUsers,                                   label: "Assigned Patients"  },
  { icon: IconClipboard,                               label: "Care Notes"         },
  { icon: IconHeart,                                   label: "Vital Records"      },
  { icon: (p: IconProps) => <IconCalendar {...p} />,   label: "Medication Updates" },
  { icon: (p: IconProps) => <IconCalendar {...p} />,   label: "Care Schedule"      },
  { icon: (p: IconProps) => <IconSettings {...p} />,   label: "Settings"           },
];

// ── Log Shift modal fields ───

const LOG_SHIFT_FIELDS: FieldConfig[] = [
  { name: "patient",   label: "Patient Name",  required: true,  placeholder: "e.g. John Silva" },
  { name: "shiftType", label: "Shift Type",    required: true,  placeholder: "e.g. Morning, Evening, Night" },
  { name: "notes",     label: "Shift Notes",   required: false, placeholder: "Any observations during this shift…", textarea: true },
];

// ── Toast type ──

interface Toast { id: number; kind: "success" | "error"; message: string; }

// ── Component ─

const CaregiverDashboard: React.FC = () => {
  const [activeMenu,    setActiveMenu]    = useState<MenuLabel>("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfile,   setShowProfile]   = useState(false);
  const [toasts,        setToasts]        = useState<Toast[]>([]);

  const [showLogShift,  setShowLogShift]  = useState(false);
  const [modalLoading,  setModalLoading]  = useState(false);

  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const handleLogShift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      setModalLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      addToast("success", `Shift for "${fd.get("patient")}" logged successfully.`);
      setShowLogShift(false);
    } catch {
      addToast("error", "Failed to log shift.");
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
            {activeMenu === "Dashboard"          && <DashboardHome onNavigate={setActiveMenu} onLogShift={() => setShowLogShift(true)} />}
            {activeMenu === "Assigned Patients"  && <AssignedPatients />}
            {activeMenu === "Care Notes"         && <CareNotes />}
            {activeMenu === "Vital Records"      && <VitalRecords />}
            {activeMenu === "Medication Updates" && <MedicationUpdates />}
            {activeMenu === "Care Schedule"      && <CareSchedule />}
            {activeMenu === "Settings"           && <Settings />}
          </main>
        </div>
      </div>

      {/* Full-screen profile overlay */}
      {showProfile && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-50">
          <CaregiverProfile onBack={() => setShowProfile(false)} />
        </div>
      )}

      {/* Log Shift modal */}
      <FormModal
        title="Log Shift"
        open={showLogShift}
        loading={modalLoading}
        onClose={() => setShowLogShift(false)}
        onSubmit={handleLogShift}
        fields={LOG_SHIFT_FIELDS}
      />
    </div>
  );
};

export default CaregiverDashboard;
