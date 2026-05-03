import { apiFetch } from '../core/apiClient';
import type { ContactInfo } from './contact.types';

// Get public contact information
export const getContactInfo = () =>
  apiFetch<ContactInfo>('/contact/info');

// Submit a contact message
export const submitContactMessage = (data: any) =>
  apiFetch<{ message: string }>('/contact/message', {
    method: 'POST',
    body: JSON.stringify(data),
  });