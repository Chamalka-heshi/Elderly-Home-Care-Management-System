import { apiFetch } from '../core/apiClient';
import type {
  CarePlan,
  CreateCarePlanPayload,
  UpdateCarePlanPayload,
} from './care-plan.types';

export const getAllCarePlans = () => apiFetch<CarePlan[]>('/care-plans/all');

export const createCarePlan = (data: CreateCarePlanPayload) =>
  apiFetch<CarePlan>('/care-plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateCarePlan = (id: string, data: UpdateCarePlanPayload) =>
  apiFetch<CarePlan>(`/care-plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deactivateCarePlan = (id: string) =>
  apiFetch<{ message: string }>(`/care-plans/${id}`, {
    method: 'DELETE',
  });
