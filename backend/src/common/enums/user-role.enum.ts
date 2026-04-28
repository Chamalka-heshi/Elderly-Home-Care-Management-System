// User Role Enumeration

// Categorizes system participants into distinct permission tiers to ensure secure and appropriate access to clinical data.
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN       = 'admin',
  FAMILY      = 'family',
  DOCTOR      = 'doctor',
  CAREGIVER   = 'caregiver',
}
