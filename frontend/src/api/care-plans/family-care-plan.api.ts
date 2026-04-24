import { apiFetch } from '../core/apiClient';
import type { CarePlan } from './care-plan.types';

export const getActiveCarePlans = () => apiFetch<CarePlan[]>('/care-plans');
