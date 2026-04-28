import { apiFetch } from '../core/apiClient';
import type { CarePlan } from './care-plan.types';

// Retrieve the list of available healthcare packages to allow users to select appropriate patient care
export const getActiveCarePlans = () =>
  apiFetch<CarePlan[]>('/care-plans');
