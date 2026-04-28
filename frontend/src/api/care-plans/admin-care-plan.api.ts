import { apiFetch } from '../core/apiClient';
import type {
  CarePlan,
  CreateCarePlanPayload,
  UpdateCarePlanPayload,
} from './care-plan.types';

// Retrieve all care plans to oversee the clinical service offerings and patient management
export const getAllCarePlans = () =>
  apiFetch<CarePlan[]>('/care-plans/all');

// Define new care plans to expand the facility's specialized healthcare services
export const createCarePlan = (data: CreateCarePlanPayload) =>
  apiFetch<CarePlan>('/care-plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Modify care plan details to ensure service offerings remain up-to-date and compliant
export const updateCarePlan = (id: string, data: UpdateCarePlanPayload) =>
  apiFetch<CarePlan>(`/care-plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Retire care plans to stop offering specific services without losing historical data
export const deactivateCarePlan = (id: string) =>
  apiFetch<{ message: string }>(`/care-plans/${id}`, {
    method: 'DELETE',
  });
