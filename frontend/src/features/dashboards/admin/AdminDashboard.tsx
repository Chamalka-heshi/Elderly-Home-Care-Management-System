import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";

// API services to manage system-wide data and administrative users, ensuring all core modules have access to persistent data
import { getDashboardStats } from "../../../api/users/admin-dashboard.api";
import {
  getAllAdmins, createAdmin, deleteAdmin,
  getAllDoctors, createDoctor, deactivateDoctor, activateDoctor,
  getAllCaregivers, createCaregiver, deactivateCaregiver, activateCaregiver,
  getAllFamilies, toggleFamilyStatus
} from "../../../api/users/admin-users.api";
import { getAllPatientsAdmin, deletePatientAdmin } from "../../../api/patients/admin-patient.api";

// Types
import type { BaseUser as Admin, Doctor, Caregiver, Family } from "../../../api/users/user.types";
import type { Patient } from "../../../api/patients/patient.types";

export interface DashboardStats {
  totalFamilies: number;
  totalPatients: number;
  totalDoctors: number;
  totalCaregivers: number;
  totalAdmins: number;
  activePatients: number;
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

// Layout components
import Sidebar, { type MenuLabel, type MenuItem } from "./components/Sidebar";
import DashboardTopbar from "../common/DashboardTopbar";

// Shared widgets
import FormModal, { type FieldConfig } from "../common/widgets/FormModal";

// Icons
import {
  IconLayoutDashboard, IconShield, IconUsers,
  IconHeart, IconStethoscope, IconUserPlus, IconSettings,
  IconCheckCircle, IconAlertCircle, IconCalendar, IconInbox, IconCurrency,
  IconSpinner, type IconProps,
} from "../common/icons";

// Local database icon for backup menu item
const IconDatabase: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth={2} />
    <path strokeWidth={2} strokeLinecap="round" d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    <path strokeWidth={2} strokeLinecap="round" d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
  </svg>
);

// Admin-specific pages to handle various module workflows
import DashboardHome from "./pages/DashboardHome";
import AdminManagement from "./pages/AdminManagement";
import DoctorManagement from "./pages/DoctorManagement";
import CaregiverManagement from "./pages/CaregiverManagement";
import FamilyManagement from "./pages/FamilyManagement";
import PatientManagement from "./pages/PatientManagement";
import ChannelingSlotManagement from "./pages/ChannelingSlotManagement";
import AppointmentRequests from "./pages/AppointmentRequests";
import ContactMessages from "./pages/ContactMessages";
import Settings from "./pages/Settings";
import PaymentsApproval from "./pages/PaymentsApproval";
import CarePlanManagement from "./pages/CarePlanManagement";
import PatientCarePlans from "./pages/PatientCarePlans";
import BackupRestore from "./pages/BackupRestore";

// Dynamic form configurations for adding new system users with localized validation hints to reduce data entry errors
// Shared validation patterns used across all staff account creation forms
const NIC_PATTERN     = "^([0-9]{9}[VvXx]|[0-9]{12})$";
const NIC_MESSAGE     = "Enter a valid Sri Lankan NIC (e.g. 123456789V or 200012345678).";
const PHONE_PATTERN   = "^0[0-9]{9}$";
const PHONE_MESSAGE   = "Enter a valid 10-digit Sri Lankan number starting with 0 (e.g. 0771234567).";

const ADMIN_FIELDS: FieldConfig[] = [
  { name: "fullName",      label: "Full Name",      required: true,  placeholder: "Enter full name",         minLength: 2 },
  { name: "email",         label: "Email",           required: true,  type: "email", placeholder: "admin@carehome.com" },
  { name: "contactNumber", label: "Contact Number",  required: true,  placeholder: "0771234567",
    pattern: PHONE_PATTERN, patternMessage: PHONE_MESSAGE },
  { name: "nic",           label: "NIC Number",      required: true,  placeholder: "e.g. 123456789V or 200012345678",
    pattern: NIC_PATTERN,   patternMessage: NIC_MESSAGE,
    hint: "Sri Lankan NIC: 9 digits + V/X, or 12 digits." },
];

const DOCTOR_FIELDS: FieldConfig[] = [
  { name: "fullName",        label: "Full Name",            required: true,  placeholder: "Dr. Jane Smith",          minLength: 2 },
  { name: "email",           label: "Email",                required: true,  type: "email", placeholder: "doctor@carehome.com" },
  { name: "contactNumber",   label: "Contact Number",       required: true,  placeholder: "0771234567",
    pattern: PHONE_PATTERN,  patternMessage: PHONE_MESSAGE },
  { name: "nic",             label: "NIC Number",           required: true,  placeholder: "e.g. 123456789V or 200012345678",
    pattern: NIC_PATTERN,    patternMessage: NIC_MESSAGE,
    hint: "Sri Lankan NIC: 9 digits + V/X, or 12 digits." },
  { name: "specialization",  label: "Specialization",       required: true,  placeholder: "e.g. Cardiologist",       minLength: 2 },
  { name: "licenseNumber",   label: "License Number",       required: true,  placeholder: "MD-XXXXX",                minLength: 3 },
  { name: "experienceYears", label: "Years of Experience",  required: true,  type: "number", placeholder: "0", min: 0, max: 60 },
];

const CAREGIVER_FIELDS: FieldConfig[] = [
  { name: "fullName",          label: "Full Name",                   required: true,  placeholder: "Enter full name",    minLength: 2 },
  { name: "email",             label: "Email",                       required: true,  type: "email", placeholder: "caregiver@carehome.com" },
  { name: "contactNumber",     label: "Contact Number",              required: true,  placeholder: "0771234567",
    pattern: PHONE_PATTERN,    patternMessage: PHONE_MESSAGE },
  { name: "nic",               label: "NIC Number",                  required: true,  placeholder: "e.g. 123456789V or 200012345678",
    pattern: NIC_PATTERN,      patternMessage: NIC_MESSAGE,
    hint: "Sri Lankan NIC: 9 digits + V/X, or 12 digits." },
  { name: "certifications",    label: "Certifications (comma-separated)", placeholder: "CPR, First Aid, BLS" },
  { name: "yearsOfExperience", label: "Years of Experience",         type: "number",  placeholder: "0", min: 0, max: 60 },
];

interface Toast { id: number; kind: "success" | "error"; message: string; }

// Main dashboard orchestration component to handle navigation, global state, and modal management for the administrative module
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  // Menu items categorized into sections for clear navigation
  const MENU_ITEMS: MenuItem[] = [
    // Main Overview
    { icon: IconLayoutDashboard, label: "Dashboard" },

    // User Management
    ...(isSuperAdmin ? [{ icon: IconShield, label: "Admin Management" as MenuLabel, section: "User Management" }] : []),
    { icon: IconStethoscope, label: "Doctor Management", section: "User Management" },
    { icon: IconUserPlus, label: "Caregiver Management", section: "User Management" },
    { icon: IconUsers, label: "Family Management", section: "User Management" },
    { icon: IconHeart, label: "Patient Management", section: "User Management" },

    // Care & Appointments
    { icon: IconCalendar, label: "Channeling Slot Management", section: "Care & Appointments" },
    { icon: IconCalendar, label: "Appointment Management", section: "Care & Appointments" },
    { icon: IconHeart, label: "Patient Care Plans", section: "Care & Appointments" },
    { icon: IconHeart, label: "Care Plan Management", section: "Care & Appointments" },

    // Operations & Finance
    { icon: IconCurrency, label: "Payments Management", section: "Operations & Finance" },
    { icon: IconInbox, label: "Contact Messages", section: "Operations & Finance" },

    // System Management
    { icon: (p: IconProps) => <IconSettings {...p} />, label: "Settings", section: "System Management" },
    { icon: IconDatabase, label: "Backup & Restore" as MenuLabel, section: "System Management" },
  ];

  // UI state
  const [activeMenu, setActiveMenu] = useState<MenuLabel>("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modal state
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showAddCaregiver, setShowAddCaregiver] = useState(false);

  // Data state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Loading flags
  const [pageLoading, setPageLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  /** Server-side error to display inside the active creation modal */
  const [modalError, setModalError] = useState<string | null>(null);

  const menuToPath: Record<MenuLabel, string> = {
    Dashboard: '/admin',
    'Admin Management': '/admin/admin-management',
    'Family Management': '/admin/family-management',
    'Patient Management': '/admin/patient-management',
    'Doctor Management': '/admin/doctor-management',
    'Caregiver Management': '/admin/caregiver-management',
    'Channeling Slot Management': '/admin/channeling-slots',
    'Appointment Management': '/admin/appointments',
    'Patient Care Plans': '/admin/patient-care-plans',
    'Care Plan Management': '/admin/care-plans',
    'Payments Management': '/admin/payments',
    'Contact Messages': '/admin/contact-messages',
    Settings: '/admin/settings',
    'Backup & Restore': '/admin/backup-restore',
  };

  const pathToMenu = useCallback((path: string): MenuLabel => {
    if (path.includes('/payments')) return 'Payments Management';
    if (path.includes('/care-plans')) return 'Care Plan Management';
    if (path.includes('/patient-care-plans')) return 'Patient Care Plans';
    if (path.includes('/appointments')) return 'Appointment Management';
    if (path.includes('/channeling-slots')) return 'Channeling Slot Management';
    if (path.includes('/contact-messages')) return 'Contact Messages';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/backup-restore')) return 'Backup & Restore';
    if (path.includes('/caregiver-management')) return 'Caregiver Management';
    if (path.includes('/doctor-management')) return 'Doctor Management';
    if (path.includes('/patient-management')) return 'Patient Management';
    if (path.includes('/family-management')) return 'Family Management';
    if (path.includes('/admin-management')) return 'Admin Management';
    return 'Dashboard';
  }, []);

  const handleAdminMenuNavigation = useCallback((label: MenuLabel) => {
    setActiveMenu(label);
    const base = user?.role === 'super_admin' ? '/super_admin' : '/admin';
    const target = menuToPath[label].replace('/admin', base);
    navigate(target);
  }, [navigate, user?.role]);

  // Toast notification helper to provide immediate user feedback on async operations and maintain system transparency
  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  // Centralized data loaders to refresh specific module data upon activation or state change, ensuring data accuracy
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
    if (activeMenu === "Dashboard") loadDashboard();
    else if (activeMenu === "Admin Management" && isSuperAdmin) loadAdmins();
    else if (activeMenu === "Doctor Management") loadDoctors();
    else if (activeMenu === "Caregiver Management") loadCaregivers();
    else if (activeMenu === "Family Management") loadFamilies();
    else if (activeMenu === "Patient Management") loadPatients();
  }, [activeMenu]);

  useEffect(() => {
    setActiveMenu(pathToMenu(location.pathname));
  }, [location.pathname, pathToMenu]);

  // User management handlers to perform CRUD operations across different system roles while maintaining referential integrity
  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: CreateAdminRequest = {
      fullName: fd.get("fullName") as string,
      email: fd.get("email") as string,
      contactNumber: fd.get("contactNumber") as string,
      nic: fd.get("nic") as string,
    };
    try {
      setModalLoading(true);
      setModalError(null);
      const res = await createAdmin(data);
      addToast("success", (res as any).message || "Admin created successfully");
      setShowAddAdmin(false);
      setModalError(null);
      loadAdmins();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create admin";
      setModalError(msg);
      addToast("error", msg);
    } finally { setModalLoading(false); }
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
      fullName: fd.get("fullName") as string,
      email: fd.get("email") as string,
      contactNumber: fd.get("contactNumber") as string,
      nic: fd.get("nic") as string,
      specialization: fd.get("specialization") as string,
      licenseNumber: fd.get("licenseNumber") as string,
      experienceYears: parseInt(fd.get("experienceYears") as string, 10),
    };
    try {
      setModalLoading(true);
      setModalError(null);
      const res = await createDoctor(data);
      addToast("success", (res as any).message || "Doctor created successfully");
      setShowAddDoctor(false);
      setModalError(null);
      loadDoctors();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create doctor";
      setModalError(msg);
      addToast("error", msg);
    } finally { setModalLoading(false); }
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
      fullName: fd.get("fullName") as string,
      email: fd.get("email") as string,
      contactNumber: fd.get("contactNumber") as string,
      nic: fd.get("nic") as string,
      shiftPreference: "flexible",
      certifications: certsRaw ? certsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
      yearsOfExperience: parseInt(fd.get("yearsOfExperience") as string, 10) || 0,
      availabilityStatus: "available",
    };
    try {
      setModalLoading(true);
      setModalError(null);
      const res = await createCaregiver(data);
      addToast("success", (res as any).message || "Caregiver created successfully");
      setShowAddCaregiver(false);
      setModalError(null);
      loadCaregivers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create caregiver";
      setModalError(msg);
      addToast("error", msg);
    } finally { setModalLoading(false); }
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">

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
        onNavigate={handleAdminMenuNavigation}
      />

      <div className="flex flex-1 flex-col h-screen overflow-y-auto min-w-0">
        <DashboardTopbar
          activeMenu={activeMenu}
          onToggleSidebar={() => setIsSidebarOpen((s) => !s)}
          onProfileClick={() => navigate(`/${user!.role}/profile`)}
        />

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
            {pageLoading && (
              <div className="flex items-center justify-center py-24">
                <IconSpinner className="h-12 w-12 text-emerald-500" />
              </div>
            )}

            {!pageLoading && activeMenu === "Dashboard" && dashboardStats && (
              <DashboardHome
                stats={dashboardStats}
                patients={patients}
                onNavigate={setActiveMenu}
                onAddAdmin={isSuperAdmin ? () => { setModalError(null); setShowAddAdmin(true); } : undefined}
                onAddDoctor={() => { setModalError(null); setShowAddDoctor(true); }}
              />
            )}
            {!pageLoading && isSuperAdmin && activeMenu === "Admin Management" && (
              <AdminManagement admins={admins as any} loading={false} canAddAdmin={isSuperAdmin} onAddAdmin={() => { setModalError(null); setShowAddAdmin(true); }} onDeleteAdmin={isSuperAdmin ? handleDeleteAdmin : undefined} />
            )}
            {!pageLoading && activeMenu === "Doctor Management" && (
              <DoctorManagement doctors={doctors} loading={false} onAddDoctor={() => { setModalError(null); setShowAddDoctor(true); }} onToggleStatus={handleToggleDoctorStatus} />
            )}
            {!pageLoading && activeMenu === "Caregiver Management" && (
              <CaregiverManagement caregivers={caregivers} loading={false} onAddCaregiver={() => { setModalError(null); setShowAddCaregiver(true); }} onToggleStatus={handleToggleCaregiverStatus} />
            )}
            {!pageLoading && activeMenu === "Family Management" && (
              <FamilyManagement families={families} loading={false} onToggleStatus={handleToggleFamilyStatus} />
            )}
            {!pageLoading && activeMenu === "Patient Management" && (
              <PatientManagement patients={patients} loading={false} onDelete={handleDeletePatient} />
            )}
            {activeMenu === "Channeling Slot Management" && (
              <ChannelingSlotManagement addToast={addToast} />
            )}
            {activeMenu === "Appointment Management" && (
              <AppointmentRequests addToast={addToast} />
            )}
            {!pageLoading && activeMenu === "Care Plan Management" && (
              <CarePlanManagement addToast={addToast} />
            )}
            {activeMenu === "Patient Care Plans" && (
              <PatientCarePlans addToast={addToast} />
            )}
            {activeMenu === "Contact Messages" && (
              <ContactMessages addToast={addToast} />
            )}
            {!pageLoading && activeMenu === "Payments Management" && (
              <PaymentsApproval addToast={addToast} />
            )}
            {!pageLoading && activeMenu === "Settings" && <Settings />}
            {activeMenu === "Backup & Restore" && <BackupRestore />}
          </main>
        </div>

      {isSuperAdmin && <FormModal title="Add New Admin — Password auto-generated & emailed" open={showAddAdmin} loading={modalLoading} error={modalError} onErrorClear={() => setModalError(null)} onClose={() => { setShowAddAdmin(false); setModalError(null); }} onSubmit={handleCreateAdmin} fields={ADMIN_FIELDS} />}
      <FormModal title="Add New Doctor — Password auto-generated & emailed" open={showAddDoctor} loading={modalLoading} error={modalError} onErrorClear={() => setModalError(null)} onClose={() => { setShowAddDoctor(false); setModalError(null); }} onSubmit={handleCreateDoctor} fields={DOCTOR_FIELDS} />
      <FormModal title="Add New Caregiver — Password auto-generated & emailed" open={showAddCaregiver} loading={modalLoading} error={modalError} onErrorClear={() => setModalError(null)} onClose={() => { setShowAddCaregiver(false); setModalError(null); }} onSubmit={handleCreateCaregiver} fields={CAREGIVER_FIELDS} />
    </div>
  );
};

export default AdminDashboard;