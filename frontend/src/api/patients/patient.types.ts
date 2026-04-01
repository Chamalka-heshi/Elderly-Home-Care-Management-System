export type Gender = 'male' | 'female' | 'other';

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
  currentMedications?: string; 
  chronicConditions?: string;
  familyMemberId: string; 
  isActive: boolean; 
  createdAt: string;
}