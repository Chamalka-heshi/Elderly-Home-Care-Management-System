export type CarePlanDurationUnit = 'days' | 'months';

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

export interface CreateCarePlanPayload {
  name: string;
  description: string;
  price: number;
  duration: number;
  durationUnit: CarePlanDurationUnit;
}

export type UpdateCarePlanPayload = Partial<CreateCarePlanPayload> & {
  isActive?: boolean;
};
