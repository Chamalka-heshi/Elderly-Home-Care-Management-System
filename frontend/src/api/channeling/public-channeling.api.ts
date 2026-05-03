import { apiFetch } from '../core/apiClient';
import type { ChannelingSlot } from './channeling.types';

// Get all available channeling slots
export const getAvailableSlots = () =>
  apiFetch<ChannelingSlot[]>('/channeling-slots/available');