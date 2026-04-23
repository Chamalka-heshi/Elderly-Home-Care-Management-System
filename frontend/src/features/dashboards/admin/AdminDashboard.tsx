import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";

// ── NEW API IMPORTS ──────────────────────────────────────────────────────────
import { getDashboardStats } from "../../../api/users/admin-dashboard.api";
import {
  getAllAdmins, createAdmin, deleteAdmin,
  getAllDoctors, createDoctor, deactivateDoctor, activateDoctor,
  getAllCaregivers, createCaregiver, deactivateCaregiver, activateCaregiver,
  getAllFamilies, toggleFamilyStatus
} from "../../../api/users/admin-users.api";
import { getAllPatientsAdmin, deletePatientAdmin } from "../../../api/patients/admin-patient.api";

// ── TYPES ────────────────────────────────────────────────────────────────────
import type { BaseUser as Admin, Doctor, Caregiver, Family } from "../../../api/users/user.types";
import type { Patient } from "../../../api/patients/patient.types";

export interface DashboardStats {
  totalFamilies: number;
  totalPatients: number;
  totalDoctors: number;
  totalCaregivers: number;
  totalAdmins: number;
  activePatients: number;
  newPatientsThisMonth: number;
  upcomingAppointments: number;
  earnings: number;
}

export interface CreateAdminRequest {
  fullName: string;
  email: string;
  contactNumber: string;
  nic: string;
}

export interface CreateDoctorRequest {
  fullName: string;
  email: string;
  contactNumber: string;
  nic: string;
  specialization: string;
  licenseNumber: string;
  experienceYears: number;
}

export interface CreateCaregiverRequest {
  fullName: string;
  email: string;
  contactNumber: string;
  nic: string;
  shiftPreference: "day" | "night" | "flexible";
  certifications: string[];
  yearsOfExperience: number;
  availabilityStatus: "available" | "busy" | "off-duty";
}

// ── Layout components 
import Sidebar, { type MenuLabel, type MenuItem } from "./components/Sidebar";
import Topbar                                      from "./components/Topbar";

// ── Shared widgets from common 
import FormModal, { type FieldConfig } from "../common/widgets/FormModal";

// ── Shared icons from common 
import {
  IconLayoutDashboard, IconShield, IconUsers,
  IconHeart, IconStethoscope, IconUserPlus, IconSettings,
  IconCheckCircle, IconAlertCircle, IconCalendar, IconInbox,
  type IconProps,
} from "../common/icons";

// ── Shared UI from common 
import { DashboardAmbientBg } from "../common/ui";

// ── Pages (admin-specific) 
import DashboardHome      from "./pages/DashboardHome";
import AdminManagement    from "./pages/AdminManagement";
import DoctorManagement   from "./pages/DoctorManagement";
import CaregiverManagement from "./pages/CaregiverManagement";
import FamilyManagement   from "./pages/FamilyManagement";
import PatientManagement  from "./pages/PatientManagement";
import AppointmentManagement from "./pages/ChannelingSlotManagement";
import AppointmentRequests   from "./pages/AppointmentRequests";
import ContactMessages    from "./pages/ContactMessages";
import Settings           from "./pages/Settings";



// ── Form field configs 
const ADMIN_FIELDS: FieldConfig[] = [
  { name: "fullName",      label: "Full Name",      required: true, placeholder: "Enter full name" },
  { name: "email",         label: "Email",          required: true, type: "email", placeholder: "admin@carehome.com" },
  { name: "contactNumber", label: "Contact Number", required: true, placeholder: "0771234567",
    hint: "Used to generate a temporary password — sent to their email." },
  { name: "nic",           label: "NIC Number",     required: true, placeholder: "e.g. 123456789V or 200012345678",
    hint: "Sri Lankan NIC: 9 digits + V/X, or 12 digits." },
];

const DOCTOR_FIELDS: FieldConfig[] = [
  { name: "fullName",          label: "Full Name",           required: true, placeholder: "Dr. Jane Smith" },
  { name: "email",             label: "Email",               required: true, type: "email", placeholder: "doctor@carehome.com" },
  { name: "contactNumber",     label: "Contact Number",      required: true, placeholder: "0771234567",
    hint: "Used to generate a temporary password — sent to their email." },
  { name: "nic",               label: "NIC Number",          required: true, placeholder: "e.g. 123456789V or 200012345678",
    hint: "Sri Lankan NIC: 9 digits + V/X, or 12 digits." },
  { name: "specialization",    label: "Specialization",      required: true, placeholder: "e.g. Cardiologist" },
  { name: "licenseNumber",     label: "License Number",      required: true, placeholder: "MD-XXXXX" },
  { name: "experienceYears",   label: "Years of Experience", required: true, type: "number", placeholder: "0" },
];

const CAREGIVER_FIELDS: FieldConfig[] = [
  { name: "fullName",           label: "Full Name",      required: true, placeholder: "Enter full name" },
  { name: "email",              label: "Email",          required: true, type: "email", placeholder: "caregiver@carehome.com" },
  { name: "contactNumber",      label: "Contact Number", required: true, placeholder: "0771234567",
    hint: "Used to generate a temporary password — sent to their email." },
  { name: "nic",                label: "NIC Number",     required: true, placeholder: "e.g. 123456789V or 200012345678",
    hint: "Sri Lankan NIC: 9 digits + V/X, or 12 digits." },
  {
    name: "shiftPreference", label: "Shift Preference", required: true,
    options: [
      { value: "flexible", label: "Flexible" },
      { value: "day",      label: "Day Shift" },
      { value: "night",    label: "Night Shift" },
    ],
  },
  { name: "certifications",    label: "Certifications (comma-separated)", placeholder: "CPR, First Aid, BLS" },
  { name: "yearsOfExperience", label: "Years of Experience", type: "number", placeholder: "0" },
  {
    name: "availabilityStatus", label: "Availability Status",
    options: [
      { value: "available", label: "Available" },
      { value: "busy",      label: "Busy" },
      { value: "off-duty",  label: "Off Duty" },
    ],
  },
];

interface Toast { id: number; kind: "success" | "error"; message: string; }

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  // ── Menu items (built here so isSuperAdmin is in scope) ──
  const MENU_ITEMS: MenuItem[] = [
    { icon: IconLayoutDashboard, label: "Dashboard"                  },
    ...(isSuperAdmin ? [{ icon: IconShield, label: "Admin Management" as MenuLabel }] : []),
    { icon: IconUsers,           label: "Family Management"          },
    { icon: IconHeart,           label: "Patient Management"         },
    { icon: IconStethoscope,     label: "Doctor Management"          },
    { icon: IconUserPlus,        label: "Caregiver Management"       },
    { icon: IconCalendar,        label: "Channeling Slot Management" },
    { icon: IconCalendar,        label: "Appointment Requests"       },
    { icon: IconInbox,           label: "Contact Messages"           },
    { icon: (p: IconProps) => <IconSettings {...p} />, label: "Settings" },
  ];

  // ── UI state 
  const [activeMenu,    setActiveMenu]    = useState<MenuLabel>("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts,        setToasts]        = useState<Toast[]>([]);

  // ── Modal state 
  const [showAddAdmin,     setShowAddAdmin]     = useState(false);
  const [showAddDoctor,    setShowAddDoctor]    = useState(false);
  const [showAddCaregiver, setShowAddCaregiver] = useState(false);

  // ── Data state 
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [admins,         setAdmins]         = useState<Admin[]>([]);
  const [doctors,        setDoctors]        = useState<Doctor[]>([]);
  const [caregivers,     setCaregivers]     = useState<Caregiver[]>([]);
  const [families,       setFamilies]       = useState<Family[]>([]);
  const [patients,       setPatients]       = useState<Patient[]>([]);

  // ── Loading flags 
  const [pageLoading,  setPageLoading]  = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // ── Helpers 
  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  // ── Data loaders 
  const loadDashboard = useCallback(async () => {
    try {
      setPageLoading(true);
      const [stats, patientsData] = await Promise.all([
        getDashboardStats(),
        getAllPatientsAdmin(),
      ]);
      setDashboardStats(stats);
      setPatients(patientsData.patients);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to load dashboard");
    } finally { setPageLoading(false); }
  }, [addToast]);

  const loadAdmins = useCallback(async () => {
    try { setPageLoading(true); const d = await getAllAdmins(); setAdmins(d.admins); }
    catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to load admins"); }
    finally { setPageLoading(false); }
  }, [addToast]);

  const loadDoctors = useCallback(async () => {
    try { setPageLoading(true); const d = await getAllDoctors(); setDoctors(d.doctors); }
    catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to load doctors"); }
    finally { setPageLoading(false); }
  }, [addToast]);

  const loadCaregivers = useCallback(async () => {
    try { setPageLoading(true); const d = await getAllCaregivers(); setCaregivers(d.caregivers); }
    catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to load caregivers"); }
    finally { setPageLoading(false); }
  }, [addToast]);

  const loadFamilies = useCallback(async () => {
    try { setPageLoading(true); const d = await getAllFamilies(); setFamilies(d.families); }
    catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to load families"); }
    finally { setPageLoading(false); }
  }, [addToast]);

  const loadPatients = useCallback(async () => {
    try { setPageLoading(true); const d = await getAllPatientsAdmin(); setPatients(d.patients); }
    catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to load patients"); }
    finally { setPageLoading(false); }
  }, [addToast]);

  useEffect(() => {
    if      (activeMenu === "Dashboard")                        loadDashboard();
    else if (activeMenu === "Admin Management" && isSuperAdmin) loadAdmins();
    else if (activeMenu === "Doctor Management")                loadDoctors();
    else if (activeMenu === "Caregiver Management") loadCaregivers();
    else if (activeMenu === "Family Management")    loadFamilies();
    else if (activeMenu === "Patient Management")   loadPatients();
  }, [activeMenu]); 

  // ── Form submit handlers 
  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: CreateAdminRequest = {
      fullName:      fd.get("fullName") as string,
      email:         fd.get("email") as string,
      contactNumber: fd.get("contactNumber") as string,
      nic:           fd.get("nic") as string, 
    };
    try {
      setModalLoading(true);
      const res = await createAdmin(data);
      addToast("success", (res as any).message || "Admin created successfully");
      setShowAddAdmin(false); loadAdmins();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to create admin"); }
    finally { setModalLoading(false); }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      const res = await deleteAdmin(id);
      addToast("success", res.message); loadAdmins();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to delete admin"); }
  };

  const handleCreateDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: CreateDoctorRequest = {
      fullName:          fd.get("fullName") as string,
      email:             fd.get("email") as string,
      contactNumber:     fd.get("contactNumber") as string,
      nic:               fd.get("nic") as string,
      specialization:    fd.get("specialization") as string,
      licenseNumber:     fd.get("licenseNumber") as string,
      experienceYears:   parseInt(fd.get("experienceYears") as string, 10),
    };
    try {
      setModalLoading(true);
      const res = await createDoctor(data);
      addToast("success", (res as any).message || "Doctor created successfully");
      setShowAddDoctor(false); loadDoctors();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to create doctor"); }
    finally { setModalLoading(false); }
  };

  const handleToggleDoctorStatus = async (id: string, isActive: boolean) => {
    try {
      const res = isActive
        ? await deactivateDoctor(id)
        : await activateDoctor(id);
      addToast("success", res.message); loadDoctors();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to update doctor"); }
  };

  const handleCreateCaregiver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const certsRaw = fd.get("certifications") as string;
    const data: CreateCaregiverRequest = {
      fullName:           fd.get("fullName") as string,
      email:              fd.get("email") as string,
      contactNumber:      fd.get("contactNumber") as string,
      nic:                fd.get("nic") as string,
      shiftPreference:    fd.get("shiftPreference") as "day" | "night" | "flexible",
      certifications:     certsRaw ? certsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
      yearsOfExperience:  parseInt(fd.get("yearsOfExperience") as string, 10) || 0,
      availabilityStatus: fd.get("availabilityStatus") as "available" | "busy" | "off-duty",
    };
    try {
      setModalLoading(true);
      const res = await createCaregiver(data);
      addToast("success", (res as any).message || "Caregiver created successfully");
      setShowAddCaregiver(false); loadCaregivers();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to create caregiver"); }
    finally { setModalLoading(false); }
  };

  const handleToggleCaregiverStatus = async (id: string, isActive: boolean) => {
    try {
      const res = isActive
        ? await deactivateCaregiver(id)
        : await activateCaregiver(id);
      addToast("success", res.message); loadCaregivers();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to update caregiver"); }
  };

  const handleToggleFamilyStatus = async (id: string, isActive: boolean) => {
    try {
      const res = await toggleFamilyStatus(id, !isActive);
      addToast("success", (res as any).message || "Status updated successfully"); loadFamilies();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to update family"); }
  };

  const handleDeletePatient = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    try {
      const res = await deletePatientAdmin(id);
      addToast("success", res.message); loadPatients();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to delete patient"); }
  };

  // ── Render 
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
            onProfileClick={() => navigate(`/${user!.role}/profile`)}
          />

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
            {pageLoading && (
              <div className="flex items-center justify-center py-24">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
              </div>
            )}

            {!pageLoading && activeMenu === "Dashboard" && dashboardStats && (
              <DashboardHome
                stats={dashboardStats}
                patients={patients}
                onNavigate={setActiveMenu}
                onAddAdmin={isSuperAdmin ? () => setShowAddAdmin(true) : undefined}
                onAddDoctor={() => setShowAddDoctor(true)}
              />
            )}
            {!pageLoading && isSuperAdmin && activeMenu === "Admin Management" && (
              <AdminManagement admins={admins as any} loading={false} canAddAdmin={isSuperAdmin} onAddAdmin={() => setShowAddAdmin(true)} onDeleteAdmin={isSuperAdmin ? handleDeleteAdmin : undefined} />
            )}
            {!pageLoading && activeMenu === "Doctor Management" && (
              <DoctorManagement doctors={doctors} loading={false} onAddDoctor={() => setShowAddDoctor(true)} onToggleStatus={handleToggleDoctorStatus} />
            )}
            {!pageLoading && activeMenu === "Caregiver Management" && (
              <CaregiverManagement caregivers={caregivers} loading={false} onAddCaregiver={() => setShowAddCaregiver(true)} onToggleStatus={handleToggleCaregiverStatus} />
            )}
            {!pageLoading && activeMenu === "Family Management" && (
              <FamilyManagement families={families} loading={false} onToggleStatus={handleToggleFamilyStatus} />
            )}
            {!pageLoading && activeMenu === "Patient Management" && (
              <PatientManagement patients={patients} loading={false} onDelete={handleDeletePatient} />
            )}
            {activeMenu === "Channeling Slot Management" && (
              <AppointmentManagement addToast={addToast}/>
            )}
            {activeMenu === "Appointment Requests" && (
              <AppointmentRequests addToast={addToast} />
            )}
            {activeMenu === "Contact Messages" && (
              <ContactMessages addToast={addToast} />
            )}
            {!pageLoading && activeMenu === "Settings" && <Settings />}
          </main>
        </div>
      </div>

      {isSuperAdmin && <FormModal title="Add New Admin — Password auto-generated & emailed"     open={showAddAdmin}     loading={modalLoading} onClose={() => setShowAddAdmin(false)}     onSubmit={handleCreateAdmin}    fields={ADMIN_FIELDS} />}
      <FormModal title="Add New Doctor — Password auto-generated & emailed"    open={showAddDoctor}    loading={modalLoading} onClose={() => setShowAddDoctor(false)}    onSubmit={handleCreateDoctor}   fields={DOCTOR_FIELDS} />
      <FormModal title="Add New Caregiver — Password auto-generated & emailed" open={showAddCaregiver} loading={modalLoading} onClose={() => setShowAddCaregiver(false)} onSubmit={handleCreateCaregiver} fields={CAREGIVER_FIELDS} />
    </div>
  );
};

export default AdminDashboard;