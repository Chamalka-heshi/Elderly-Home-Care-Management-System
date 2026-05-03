import { apiFetch } from '../core/apiClient';
import type { ContactInfo, ContactMessage } from './contact.types';

// Get all contact messages
export const getAllMessages = () =>
  apiFetch<{ messages: ContactMessage[] }>('/contact/messages');

// Get a specific contact message
export const getMessage = (id: string) =>
  apiFetch<ContactMessage>(`/contact/messages/${id}`);

// Reply to a contact message
export const replyToMessage = (id: string, reply: string) =>
  apiFetch<{ data: ContactMessage }>(`/contact/messages/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ reply }),
  });

// Update facility contact information
export const updateContactInfo = (data: Partial<ContactInfo>) =>
  apiFetch<{ data: ContactInfo }>('/contact/info', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// Delete a contact message
export const deleteMessage = (id: string) =>
  apiFetch<{ message: string }>(`/contact/messages/${id}`, {
    method: 'DELETE',
  });