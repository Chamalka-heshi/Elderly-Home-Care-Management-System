/**
 * src/features/dashboards/admin/AdminDashboard.tsx
 * ──────────────────────────────────────────────────
 * Main admin dashboard shell.
 *
 * Key design decisions
 * ────────────────────
 *  • Sidebar / Topbar remain in admin/components/ (role-specific theming)
 *  • Widgets (FormModal, Badge, StatCard, TableShell) are now imported from
 *    the shared common/widgets/ folder — single source of truth.
 *  • AdminProfile is rendered as a full-screen fixed overlay (not a separate
 *    route), activated by clicking the profile avatar in the Topbar.
 *  • DoctorDashboard mirrors this exact pattern for consistency.
 */

import React, { useEffect, useState, useCallback } from "react";
import * as adminApi from "../../../api/admin.api";
import type {
  Admin, Doctor, Caregiver, Family, Patient, DashboardStats,
  CreateAdminRequest, CreateDoctorRequest, CreateCaregiverRequest,
} from "../../../api/admin.api";

// ── Layout components (admin-specific) ───────────────────────────────────────
import Sidebar, { type MenuLabel, type MenuItem } from "./components/Sidebar";
import Topbar                                      from "./components/Topbar";

// ── Shared widgets from common ────────────────────────────────────────────────
import FormModal, { type FieldConfig } from "../common/widgets/FormModal";

// ── Shared icons from common ──────────────────────────────────────────────────
import {
  IconLayoutDashboard, IconShield, IconUsers,
  IconHeart, IconStethoscope, IconUserPlus, IconSettings,
  IconCheckCircle, IconAlertCircle,
  type IconProps,
} from "../common/icons";

// ── Shared UI from common ─────────────────────────────────────────────────────
import { DashboardAmbientBg } from "../common/ui";

// ── Pages (admin-specific) ────────────────────────────────────────────────────
import AdminProfile       from "./pages/AdminProfile";
import DashboardHome      from "./pages/DashboardHome";
import AdminManagement    from "./pages/AdminManagement";
import DoctorManagement   from "./pages/DoctorManagement";
import CaregiverManagement from "./pages/CaregiverManagement";
import FamilyManagement   from "./pages/FamilyManagement";
import PatientManagement  from "./pages/PatientManagement";
import Settings           from "./pages/Settings";

// ── Menu items ────────────────────────────────────────────────────────────────

const MENU_ITEMS: MenuItem[] = [
  { icon: IconLayoutDashboard, label: "Dashboard"           },
  { icon: IconShield,          label: "Admin Management"    },
  { icon: IconUsers,           label: "Family Management"   },
  { icon: IconHeart,           label: "Patient Management"  },
  { icon: IconStethoscope,     label: "Doctor Management"   },
  { icon: IconUserPlus,        label: "Caregiver Management"},
  { icon: (p: IconProps) => <IconSettings {...p} />, label: "Settings" },
];

// ── Form field configs ─────────────────────────────────────────────────────────

const ADMIN_FIELDS: FieldConfig[] = [
  { name: "fullName",      label: "Full Name",      required: true, placeholder: "Enter full name" },
  { name: "email",         label: "Email",          required: true, type: "email",    placeholder: "admin@carehome.com" },
  { name: "password",      label: "Password",       required: true, type: "password", placeholder: "••••••••" },
  { name: "contactNumber", label: "Contact Number", placeholder: "+94 77 123 4567" },
];

const DOCTOR_FIELDS: FieldConfig[] = [
  { name: "fullName",          label: "Full Name",           required: true, placeholder: "Dr. Jane Smith" },
  { name: "email",             label: "Email",               required: true, type: "email",    placeholder: "doctor@carehome.com" },
  { name: "password",          label: "Password",            required: true, type: "password", placeholder: "••••••••" },
  { name: "contactNumber",     label: "Contact Number",      placeholder: "+94 77 123 4567" },
  { name: "specialization",    label: "Specialization",      required: true, placeholder: "e.g. Cardiologist" },
  { name: "licenseNumber",     label: "License Number",      required: true, placeholder: "MD-XXXXX" },
  { name: "yearsOfExperience", label: "Years of Experience", required: true, type: "number", placeholder: "0" },
];

const CAREGIVER_FIELDS: FieldConfig[] = [
  { name: "fullName",           label: "Full Name",     required: true, placeholder: "Enter full name" },
  { name: "email",              label: "Email",         required: true, type: "email",    placeholder: "caregiver@carehome.com" },
  { name: "password",           label: "Password",      required: true, type: "password", placeholder: "••••••••" },
  { name: "contactNumber",      label: "Contact Number", placeholder: "+94 77 123 4567" },
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

// ── Toast type ─────────────────────────────────────────────────────────────────

interface Toast { id: number; kind: "success" | "error"; message: string; }

// ── Component ─────────────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeMenu,    setActiveMenu]    = useState<MenuLabel>("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfile,   setShowProfile]   = useState(false); // full-screen AdminProfile overlay
  const [toasts,        setToasts]        = useState<Toast[]>([]);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showAddAdmin,     setShowAddAdmin]     = useState(false);
  const [showAddDoctor,    setShowAddDoctor]    = useState(false);
  const [showAddCaregiver, setShowAddCaregiver] = useState(false);

  // ── Data state ────────────────────────────────────────────────────────────
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [admins,         setAdmins]         = useState<Admin[]>([]);
  const [doctors,        setDoctors]        = useState<Doctor[]>([]);
  const [caregivers,     setCaregivers]     = useState<Caregiver[]>([]);
  const [families,       setFamilies]       = useState<Family[]>([]);
  const [patients,       setPatients]       = useState<Patient[]>([]);

  // ── Loading flags ─────────────────────────────────────────────────────────
  const [pageLoading,  setPageLoading]  = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const addToast = useCallback((kind: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    try {
      setPageLoading(true);
      const [stats, patientsData] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getAllPatients(),
      ]);
      setDashboardStats(stats);
      setPatients(patientsData.patients);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to load dashboard");
    } finally { setPageLoading(false); }
  }, [addToast]);

  const loadAdmins = useCallback(async () => {
    try { setPageLoading(true); const d = await adminApi.getAllAdmins(); setAdmins(d.admins); }
    catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to load admins"); }
    finally { setPageLoading(false); }
  }, [addToast]);

  const loadDoctors = useCallback(async () => {
    try { setPageLoading(true); const d = await adminApi.getAllDoctors(); setDoctors(d.doctors); }
    catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to load doctors"); }
    finally { setPageLoading(false); }
  }, [addToast]);

  const loadCaregivers = useCallback(async () => {
    try { setPageLoading(true); const d = await adminApi.getAllCaregivers(); setCaregivers(d.caregivers); }
    catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to load caregivers"); }
    finally { setPageLoading(false); }
  }, [addToast]);

  const loadFamilies = useCallback(async () => {
    try { setPageLoading(true); const d = await adminApi.getAllFamilies(); setFamilies(d.families); }
    catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to load families"); }
    finally { setPageLoading(false); }
  }, [addToast]);

  const loadPatients = useCallback(async () => {
    try { setPageLoading(true); const d = await adminApi.getAllPatients(); setPatients(d.patients); }
    catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to load patients"); }
    finally { setPageLoading(false); }
  }, [addToast]);

  // Trigger the right loader whenever the active menu item changes
  useEffect(() => {
    if      (activeMenu === "Dashboard")            loadDashboard();
    else if (activeMenu === "Admin Management")     loadAdmins();
    else if (activeMenu === "Doctor Management")    loadDoctors();
    else if (activeMenu === "Caregiver Management") loadCaregivers();
    else if (activeMenu === "Family Management")    loadFamilies();
    else if (activeMenu === "Patient Management")   loadPatients();
  }, [activeMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Form submit handlers ──────────────────────────────────────────────────

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: CreateAdminRequest = {
      fullName:      fd.get("fullName") as string,
      email:         fd.get("email") as string,
      password:      fd.get("password") as string,
      contactNumber: (fd.get("contactNumber") as string) || undefined,
    };
    try {
      setModalLoading(true);
      const res = await adminApi.createAdmin(data);
      addToast("success", res.message);
      setShowAddAdmin(false); loadAdmins();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to create admin"); }
    finally { setModalLoading(false); }
  };

  const handleCreateDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: CreateDoctorRequest = {
      fullName:          fd.get("fullName") as string,
      email:             fd.get("email") as string,
      password:          fd.get("password") as string,
      contactNumber:     (fd.get("contactNumber") as string) || undefined,
      specialization:    fd.get("specialization") as string,
      licenseNumber:     fd.get("licenseNumber") as string,
      yearsOfExperience: parseInt(fd.get("yearsOfExperience") as string, 10),
    };
    try {
      setModalLoading(true);
      const res = await adminApi.createDoctor(data);
      addToast("success", res.message);
      setShowAddDoctor(false); loadDoctors();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to create doctor"); }
    finally { setModalLoading(false); }
  };

  const handleToggleDoctorStatus = async (id: string, isActive: boolean) => {
    try {
      const res = isActive
        ? await adminApi.deactivateDoctor(id)
        : await adminApi.activateDoctor(id);
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
      password:           fd.get("password") as string,
      contactNumber:      (fd.get("contactNumber") as string) || undefined,
      shiftPreference:    fd.get("shiftPreference") as "day" | "night" | "flexible",
      certifications:     certsRaw ? certsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
      yearsOfExperience:  parseInt(fd.get("yearsOfExperience") as string, 10) || 0,
      availabilityStatus: fd.get("availabilityStatus") as "available" | "busy" | "off-duty",
    };
    try {
      setModalLoading(true);
      const res = await adminApi.createCaregiver(data);
      addToast("success", res.message);
      setShowAddCaregiver(false); loadCaregivers();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to create caregiver"); }
    finally { setModalLoading(false); }
  };

  const handleToggleCaregiverStatus = async (id: string, isActive: boolean) => {
    try {
      const res = isActive
        ? await adminApi.deactivateCaregiver(id)
        : await adminApi.activateCaregiver(id);
      addToast("success", res.message); loadCaregivers();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to update caregiver"); }
  };

  const handleToggleFamilyStatus = async (id: string, isActive: boolean) => {
    try {
      const res = await adminApi.toggleFamilyStatus(id, !isActive);
      addToast("success", res.message); loadFamilies();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to update family"); }
  };

  const handleDeletePatient = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    try {
      const res = await adminApi.deletePatient(id);
      addToast("success", res.message); loadPatients();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed to delete patient"); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* Fixed ambient gradient blobs (dashboard variant) */}
      <DashboardAmbientBg />

      {/* Toast notifications */}
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

      {/* ── Main layout: sidebar + content ── */}
      <div className="flex min-h-screen">
        <Sidebar
          items={MENU_ITEMS}
          activeMenu={activeMenu}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={(label) => setActiveMenu(label)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar — onProfileClick opens the full-screen AdminProfile overlay */}
          <Topbar
            activeMenu={activeMenu}
            onToggleSidebar={() => setIsSidebarOpen((s) => !s)}
            onProfileClick={() => setShowProfile(true)}
          />

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">

            {/* Page-level loading spinner */}
            {pageLoading && (
              <div className="flex items-center justify-center py-24">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
              </div>
            )}

            {/* Page content — rendered based on the active sidebar item */}
            {!pageLoading && activeMenu === "Dashboard" && dashboardStats && (
              <DashboardHome
                stats={dashboardStats}
                patients={patients}
                onNavigate={setActiveMenu}
                onAddAdmin={() => setShowAddAdmin(true)}
                onAddDoctor={() => setShowAddDoctor(true)}
              />
            )}
            {!pageLoading && activeMenu === "Admin Management" && (
              <AdminManagement admins={admins} loading={false} onAddAdmin={() => setShowAddAdmin(true)} />
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
            {!pageLoading && activeMenu === "Settings" && <Settings />}
          </main>
        </div>
      </div>

      {/* ── Full-screen AdminProfile overlay ──────────────────────────────────
           Activated by clicking the profile avatar in the Topbar.
           DoctorDashboard uses the exact same pattern with DoctorProfile.    */}
      {showProfile && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-50">
          <AdminProfile onBack={() => setShowProfile(false)} />
        </div>
      )}

      {/* ── Create-user modals ── */}
      <FormModal title="Add New Admin"     open={showAddAdmin}     loading={modalLoading} onClose={() => setShowAddAdmin(false)}     onSubmit={handleCreateAdmin}    fields={ADMIN_FIELDS} />
      <FormModal title="Add New Doctor"    open={showAddDoctor}    loading={modalLoading} onClose={() => setShowAddDoctor(false)}    onSubmit={handleCreateDoctor}   fields={DOCTOR_FIELDS} />
      <FormModal title="Add New Caregiver" open={showAddCaregiver} loading={modalLoading} onClose={() => setShowAddCaregiver(false)} onSubmit={handleCreateCaregiver} fields={CAREGIVER_FIELDS} />
    </div>
  );
};

export default AdminDashboard;
