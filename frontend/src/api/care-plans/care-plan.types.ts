// Unit options for defining the duration of clinical care plans
export type CarePlanDurationUnit = 'days' | 'months';

// Structure for care plan service offerings to define the scope and cost of healthcare packages
export interface CarePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  durationUnit: CarePlanDurationUnit;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Data required to register a new care plan within the facility's service catalog
export interface CreateCarePlanPayload {
  name: string;
  description: string;
  price: number;
  duration: number;
  durationUnit: CarePlanDurationUnit;
}

// Flexible structure for updating existing care plan details to reflect service changes
export type UpdateCarePlanPayload = Partial<CreateCarePlanPayload> & {
  isActive?: boolean;
};
