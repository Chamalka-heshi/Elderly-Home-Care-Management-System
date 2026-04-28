import { apiFetch } from '../core/apiClient';
import type { ChannelingSlot } from './channeling.types';

// Retrieve active channeling slots to allow the public to view upcoming doctor availability
export const getAvailableSlots = () =>
  apiFetch<ChannelingSlot[]>('/channeling-slots/available');