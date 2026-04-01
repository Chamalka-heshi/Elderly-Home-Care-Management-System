import { apiFetch } from '../core/apiClient';
import type { ContactInfo, ContactMessage } from './contact.types';

export const getAllMessages = () => apiFetch<{messages: ContactMessage[]}>('/contact/messages');
export const getMessage = (id: string) => apiFetch<ContactMessage>(`/contact/messages/${id}`);
export const replyToMessage = (id: string, reply: string) => apiFetch<{data: ContactMessage}>(`/contact/messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply }) });
export const updateContactInfo = (data: Partial<ContactInfo>) => apiFetch<{data: ContactInfo}>('/contact/info', { method: 'PUT', body: JSON.stringify(data) });
export const deleteMessage = (id: string) => apiFetch<{message: string}>(`/contact/messages/${id}`, { method: 'DELETE' });