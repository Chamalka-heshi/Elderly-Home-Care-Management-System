// src/api/contact.api.ts
// Admin-side contact-message API functions.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleApiError = async (response: Response): Promise<never> => {
  const body = await response.json().catch(() => ({}));
  throw new Error(body?.message ?? `HTTP ${response.status}`);
};

// ── Types ──────────────────────────────────────────────────────────────────

export type MessageStatus = 'pending' | 'replied';

export interface ContactInfo {
  phonePrimary: string;
  phoneEmergency: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  openHours?: string;
  mapUrl?: string;       // Google Maps share link  — used for "Open Maps" button
  mapEmbedUrl?: string;  // Google Maps embed URL   — used for the inline <iframe>
}

export interface SubmitMessagePayload {
  fullName: string;
  email: string;
  phone?: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  reply?: string;
  repliedAt?: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Public API calls (no auth) ─────────────────────────────────────────────

/** GET /api/contact/info */
export const getContactInfo = async (): Promise<ContactInfo> => {
  const res = await fetch(`${API_BASE_URL}/contact/info`);
  if (!res.ok) await handleApiError(res);
  return res.json();
};

/** POST /api/contact/message — public form submission */
export const submitContactMessage = async (
  payload: SubmitMessagePayload,
): Promise<{ message: string }> => {
  const res = await fetch(`${API_BASE_URL}/contact/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
};

// ── Admin API calls (auth required) ───────────────────────────────────────

/** GET /api/contact/messages */
export const getAllMessages = async (): Promise<{
  messages: ContactMessage[];
  total: number;
  pending: number;
}> => {
  const res = await fetch(`${API_BASE_URL}/contact/messages`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
};

/** GET /api/contact/messages/:id */
export const getMessage = async (id: string): Promise<ContactMessage> => {
  const res = await fetch(`${API_BASE_URL}/contact/messages/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
};

/** POST /api/contact/messages/:id/reply */
export const replyToMessage = async (
  id: string,
  reply: string,
): Promise<{ message: string; data: ContactMessage }> => {
  const res = await fetch(`${API_BASE_URL}/contact/messages/${id}/reply`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reply }),
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
};

/** PUT /api/contact/info — admin updates clinic contact details */
export const updateContactInfo = async (
  payload: Partial<ContactInfo>,
): Promise<{ message: string; data: ContactInfo }> => {
  const res = await fetch(`${API_BASE_URL}/contact/info`, {
    method: 'PUT',          // ← was PATCH, now PUT to match the backend controller
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
};

/** DELETE /api/contact/messages/:id */
export const deleteMessage = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`${API_BASE_URL}/contact/messages/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
};