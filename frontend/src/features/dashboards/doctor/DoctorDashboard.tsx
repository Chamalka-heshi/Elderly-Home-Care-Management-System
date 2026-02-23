import React, { useState, useCallback } from "react";

// ── Layout components  
import Sidebar, { type MenuLabel, type MenuItem } from "./components/Sidebar";
import Topbar                                      from "./components/Topbar";

// ── Shared widgets from common 
import FormModal, { type FieldConfig } from "../common/widgets/FormModal";

// ── Shared icons from common 
import {
  IconLayoutDashboard, IconUsers, IconClipboard,
  IconHeart, IconStethoscope, IconCalendar, IconSettings,
  IconCheckCircle, IconAlertCircle,
  type IconProps,
} from "../common/icons";

// ── Shared UI from common 
import { DashboardAmbientBg } from "../common/ui";

// Pages 
import DoctorProfile  from "./pages/DoctorProfile";   
import DashboardHome  from "./pages/DashboardHome";
import PatientMgmt    from "./pages/PatientManagement";
import MedicalReports from "./pages/MedicalReports";
import Prescription   from "./pages/Prescription";
import TreatmentPlans from "./pages/TreatmentPlans";
import Appointments   from "./pages/Appointments";
import Settings       from "./pages/Settings";

//  Menu items — mirrors AdminDashboard MENU_ITEMS pattern 

const MENU_ITEMS: MenuItem[] = [
  { icon: IconLayoutDashboard, label: "Dashboard"          },
  { icon: IconUsers,           label: "Patient Management" },
  { icon: IconClipboard,       label: "Medical Reports"    },
  { icon: IconHeart,           label: "Prescription"       },
  { icon: IconStethoscope,     label: "Treatment Plans"    },
  { icon: IconCalendar,        label: "Appointments"       },
  { icon: (p: IconProps) => <IconSettings {...p} />, label: "Settings" },
];

const ADD_REPORT_FIELDS: FieldConfig[] = [
  { name: "patient",    label: "Patient Name", required: true, placeholder: "Select patient" },
  { name: "reportType", label: "Report Type",  required: true, placeholder: "e.g. Monthly Check" },
  { name: "summary",    label: "Summary",      required: true, placeholder: "Brief clinical summary…", textarea: true },
];

// ── Toast type — same shape as AdminDashboard 

interface Toast { id: number; kind: "success" | "error"; message: string; }

// ── Component 

const DoctorDashboard: React.FC = () => {
  // ── UI state — mirrors AdminDashboard exactly 
  const [activeMenu,    setActiveMenu]    = useState<MenuLabel>("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfile,   setShowProfile]   = useState(false); 
  const [toasts,        setToasts]        = useState<Toast[]>([]);

  // ── Modal state 
  const [showAddReport, setShowAddReport] = useState(false);
  const [modalLoading,  setModalLoading]  = useState(false);

  // ── Toast helper 

  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  // ── Form submit handler 

  const handleAddReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      setModalLoading(true);
     
      await new Promise((r) => setTimeout(r, 600)); 
      addToast("success", `Report for "${fd.get("patient")}" created successfully.`);
      setShowAddReport(false);
    } catch {
      addToast("error", "Failed to create report.");
    } finally {
      setModalLoading(false);
    }
  };

   return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

       <DashboardAmbientBg />
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
            {activeMenu === "Dashboard"          && <DashboardHome onNavigate={setActiveMenu} onAddReport={() => setShowAddReport(true)} />}
            {activeMenu === "Patient Management" && <PatientMgmt />}
            {activeMenu === "Medical Reports"    && <MedicalReports />}
            {activeMenu === "Prescription"       && <Prescription />}
            {activeMenu === "Treatment Plans"    && <TreatmentPlans />}
            {activeMenu === "Appointments"       && <Appointments />}
            {activeMenu === "Settings"           && <Settings />}
          </main>
        </div>
      </div>

      
      {showProfile && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-50">
          <DoctorProfile onBack={() => setShowProfile(false)} />
        </div>
      )}

      
      <FormModal
        title="Add New Report"
        open={showAddReport}
        loading={modalLoading}
        onClose={() => setShowAddReport(false)}
        onSubmit={handleAddReport}
        fields={ADD_REPORT_FIELDS}
      />
    </div>
  );
};

export default DoctorDashboard;
