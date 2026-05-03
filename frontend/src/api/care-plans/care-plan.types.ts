// Care plan duration units
export type CarePlanDurationUnit = 'days' | 'months';

// Care plan data structure
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

// Payload for creating a care plan
export interface CreateCarePlanPayload {
  name: string;
  description: string;
  price: number;
  duration: number;
  durationUnit: CarePlanDurationUnit;
}

// Payload for updating a care plan
export type UpdateCarePlanPayload = Partial<CreateCarePlanPayload> & {
  isActive?: boolean;
};
