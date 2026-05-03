import { apiFetch } from '../core/apiClient';
import type {
  CarePlan,
  CreateCarePlanPayload,
  UpdateCarePlanPayload,
} from './care-plan.types';

// Get all care plans
export const getAllCarePlans = () =>
  apiFetch<CarePlan[]>('/care-plans/all');

// Create a new care plan
export const createCarePlan = (data: CreateCarePlanPayload) =>
  apiFetch<CarePlan>('/care-plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Update an existing care plan
export const updateCarePlan = (id: string, data: UpdateCarePlanPayload) =>
  apiFetch<CarePlan>(`/care-plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Deactivate a care plan
export const deactivateCarePlan = (id: string) =>
  apiFetch<{ message: string }>(`/care-plans/${id}`, {
    method: 'DELETE',
  });
