import { apiFetch } from '../core/apiClient';
import type { ChannelingSlot } from './channeling.types';

export const getMySlots = () => apiFetch<ChannelingSlot[]>('/channeling-slots/my-slots');
export const acceptChannelingSlot = (id: string) => apiFetch<ChannelingSlot>(`/channeling-slots/my-slots/${id}/accept`, { method: 'PATCH' });
export const rejectChannelingSlot = (id: string) => apiFetch<ChannelingSlot>(`/channeling-slots/my-slots/${id}/reject`, { method: 'PATCH' });