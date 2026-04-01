import { apiFetch } from '../core/apiClient';
import type { ChannelingSlot } from './channeling.types';

export const getAvailableSlots = () => apiFetch<ChannelingSlot[]>('/channeling-slots/available');