import { apiFetch } from '../core/apiClient';
import type { CarePlan } from './care-plan.types';

// Get all active care plans
export const getActiveCarePlans = () =>
  apiFetch<CarePlan[]>('/care-plans');
