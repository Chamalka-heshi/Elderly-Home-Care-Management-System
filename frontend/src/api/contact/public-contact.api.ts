import { apiFetch } from '../core/apiClient';
import type { ContactInfo } from './contact.types';

// Fetch the facility's public contact details to guide user inquiries and location visits
export const getContactInfo = () =>
  apiFetch<ContactInfo>('/contact/info');

// Submit messages to the facility to facilitate public communication and support requests
export const submitContactMessage = (data: any) =>
  apiFetch<{ message: string }>('/contact/message', {
    method: 'POST',
    body: JSON.stringify(data),
  });