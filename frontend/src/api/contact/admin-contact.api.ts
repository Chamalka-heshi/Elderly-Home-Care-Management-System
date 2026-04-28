import { apiFetch } from '../core/apiClient';
import type { ContactInfo, ContactMessage } from './contact.types';

// Retrieve all inquiry messages to ensure timely responses to user and public concerns
export const getAllMessages = () =>
  apiFetch<{ messages: ContactMessage[] }>('/contact/messages');

// Get specific message details to support thorough investigation of user inquiries
export const getMessage = (id: string) =>
  apiFetch<ContactMessage>(`/contact/messages/${id}`);

// Submit replies to user messages to maintain active communication and support
export const replyToMessage = (id: string, reply: string) =>
  apiFetch<{ data: ContactMessage }>(`/contact/messages/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ reply }),
  });

// Update the facility's public contact information to ensure users can reach the correct departments
export const updateContactInfo = (data: Partial<ContactInfo>) =>
  apiFetch<{ data: ContactInfo }>('/contact/info', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// Remove old messages to keep the communication dashboard focused on active inquiries
export const deleteMessage = (id: string) =>
  apiFetch<{ message: string }>(`/contact/messages/${id}`, {
    method: 'DELETE',
  });