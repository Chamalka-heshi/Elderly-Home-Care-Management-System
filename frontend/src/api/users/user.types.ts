// Core user properties shared across all roles to maintain consistent identity and contact records
export interface BaseUser {
  id: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  isActive: boolean;
  createdAt: string;
}

// Administrator role for system-wide oversight and management of facility operations
export interface Admin extends BaseUser {
  nic?: string | null;
}

// Medical practitioner role to define specialization, licensing, and session availability
export interface Doctor extends BaseUser {
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  hospitalAffiliation?: string;
  availableDays?: string[];
  availableTimeStart?: string | null;
  availableTimeEnd?: string | null;
}

// Staff role for providing direct patient care and managing shift preferences
export interface Caregiver extends BaseUser {
  specializations: string[];
  availableShifts: string[];
  yearsOfExperience: number;
}

// User role for family members to manage their registered patients and billing
export interface Family extends BaseUser {
  relationship?: string;
  emergencyContact?: string;
  address?: string;
  patientsCount: number;
}