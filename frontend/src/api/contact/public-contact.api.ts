import { apiFetch } from '../core/apiClient';
import type { ContactInfo } from './contact.types';

export const getContactInfo = () => apiFetch<ContactInfo>('/contact/info');
export const submitContactMessage = (data: any) => apiFetch<{message: string}>('/contact/message', { method: 'POST', body: JSON.stringify(data) });