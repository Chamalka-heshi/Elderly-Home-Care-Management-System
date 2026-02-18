import type React from "react";

export type SidebarIcon = React.FC<{ className?: string }>;

export type DashboardMenuItem = {
  to: string;
  label: string;
  icon: SidebarIcon;
};

export type Role = "family" | "doctor" | "caregiver" | "admin";

export const roleLabel = (role: string) => {
  const map: Record<string, string> = {
    family: "Family Member",
    doctor: "Doctor",
    caregiver: "Caregiver",
    admin: "Administrator",
  };
  return map[role] || role;
};