// Patient gender options
export type Gender = 'male' | 'female' | 'other';

// Patient data structure
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