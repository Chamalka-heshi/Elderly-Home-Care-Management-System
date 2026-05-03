// Base user properties
export interface BaseUser {
  id: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  isActive: boolean;
  createdAt: string;
}

// Admin user properties
export interface Admin extends BaseUser {
  nic?: string | null;
}

// Doctor user properties
export interface Doctor extends BaseUser {
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  hospitalAffiliation?: string;
  availableDays?: string[];
  availableTimeStart?: string | null;
  availableTimeEnd?: string | null;
}

// Caregiver user properties
export interface Caregiver extends BaseUser {
  specializations: string[];
  availableShifts: string[];
  yearsOfExperience: number;
}

// Family member user properties
export interface Family extends BaseUser {
  relationship?: string;
  emergencyContact?: string;
  address?: string;
  patientsCount: number;
}