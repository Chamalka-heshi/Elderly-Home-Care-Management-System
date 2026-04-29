// Standardized gender options to maintain consistent demographic data across patient records
export type Gender = 'male' | 'female' | 'other';

// Core patient profile to track clinical identity, contact details, and basic medical background
export interface Patient {
  id: string;
  fullName: string;
  nic: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string;
  address?: string;
  contactNumber?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string;
  drugAllergies?: string;
  foodAllergies?: string;
  environmentalAllergies?: string;
  currentMedications?: string;
  chronicConditions?: string;
  familyMemberId: string;
  isActive: boolean;
  createdAt: string;
  paymentPlan?: string;
}