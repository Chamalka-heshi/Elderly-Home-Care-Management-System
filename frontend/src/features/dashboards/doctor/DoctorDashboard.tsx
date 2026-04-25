import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth }     from "../../../auth/AuthContext";

// ── Layout components  
import Sidebar, { type MenuLabel, type MenuItem } from "./components/Sidebar";
import DashboardTopbar from "../common/DashboardTopbar";

// ── Shared icons from common 
import {
  IconLayoutDashboard, IconUsers,
  IconHeart, IconStethoscope, IconCalendar, IconSettings,
  IconActivity, IconCurrency,
} from "../common/icons";


// Pages 
import DashboardHome  from "./pages/DashboardHome";
import PatientMgmt    from "./pages/PatientManagement";
import Prescription   from "./pages/Prescription";
import TreatmentPlans from "./pages/TreatmentPlans";
import ChannelingSlots from "./pages/ChannelingSlots";
import Appointments from "./pages/Appointments";
import Settings       from "./pages/Settings";
import DoctorPayments from "./pages/DoctorPayments";

//  Menu items — mirrors AdminDashboard MENU_ITEMS pattern 

const MENU_ITEMS: MenuItem[] = [
  { icon: IconLayoutDashboard, label: "Dashboard"          },
  { icon: IconUsers,           label: "Patient Management" },
  { icon: IconActivity,        label: "Appointments"        },
  { icon: IconCalendar,        label: "Channeling Slots"    },
  { icon: IconHeart,           label: "Prescription"       },
  { icon: IconCurrency,        label: "Payments"           },
  { icon: IconStethoscope,     label: "Treatment Plans"    },
  { icon: IconSettings,        label: "Settings"           },
];

// ── Component 

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const [activeMenu,    setActiveMenu]    = useState<MenuLabel>("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      <div className="flex min-h-screen">
        <Sidebar
          items={MENU_ITEMS}
          activeMenu={activeMenu}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={(label) => setActiveMenu(label)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardTopbar
            activeMenu={activeMenu}
            onToggleSidebar={() => setIsSidebarOpen((s) => !s)}
            onProfileClick={() => navigate(`/${user!.role}/profile`)}
          />

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
            {activeMenu === "Dashboard"          && <DashboardHome onNavigate={setActiveMenu} />}
            {activeMenu === "Patient Management" && <PatientMgmt />}
            {activeMenu === "Prescription"       && <Prescription />}
            {activeMenu === "Treatment Plans"    && <TreatmentPlans />}
            {activeMenu === "Channeling Slots"   && <ChannelingSlots />}
            {activeMenu === "Appointments"       && <Appointments />}
            {activeMenu === "Payments"           && <DoctorPayments />}
            {activeMenu === "Settings"           && <Settings />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;