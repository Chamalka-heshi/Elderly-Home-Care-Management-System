import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth/AuthContext";

import Sidebar, { type MenuLabel, type MenuItem } from "./components/Sidebar";
import DashboardTopbar from "../common/DashboardTopbar";

import {
  IconLayoutDashboard,
  IconUsers,
  IconHeart,
  IconCalendar,
  IconActivity,
  IconCurrency,
} from "../common/icons";

import DashboardHome from "./pages/DashboardHome";
import PatientMgmt from "./pages/PatientManagement";
import Prescription from "./pages/Prescription";
import ChannelingSlots from "./pages/ChannelingSlots";
import Appointments from "./pages/Appointments";
import DoctorPayments from "./pages/DoctorPayments";

// Navigation Configuration

// Defines the primary navigation structure for the doctor's clinical workspace, providing quick access to patient records and scheduling tools.
const MENU_ITEMS: MenuItem[] = [
  { icon: IconLayoutDashboard, label: "Dashboard" },
  { icon: IconUsers, label: "Patient Management" },
  { icon: IconActivity, label: "Appointments" },
  { icon: IconCalendar, label: "Channeling Slots" },
  { icon: IconHeart, label: "Prescription" },
  { icon: IconCurrency, label: "Payments" },
];

// Doctor Dashboard Root

// Orchestrates the clinical management interface, handling navigation state and providing a unified layout for all professional workflows.
const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeMenu, setActiveMenu] = useState<MenuLabel>("Dashboard");
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
          {/* Dashboard Header — Displays the current context and provides access to user profile settings and responsive navigation controls. */}
          <DashboardTopbar
            activeMenu={activeMenu}
            onToggleSidebar={() => setIsSidebarOpen((s) => !s)}
            onProfileClick={() => navigate(`/${user!.role}/profile`)}
          />

          {/* View Rendering Logic — Dynamically mounts the appropriate clinical or administrative view based on the current navigation selection. */}
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
            {activeMenu === "Dashboard" && <DashboardHome onNavigate={setActiveMenu} />}
            {activeMenu === "Patient Management" && <PatientMgmt />}
            {activeMenu === "Prescription" && <Prescription />}
            {activeMenu === "Channeling Slots" && <ChannelingSlots />}
            {activeMenu === "Appointments" && <Appointments />}
            {activeMenu === "Payments" && <DoctorPayments />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;