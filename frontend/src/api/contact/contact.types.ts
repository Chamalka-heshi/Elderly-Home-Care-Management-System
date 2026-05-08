// Facility contact information
export interface ContactInfo {
  phonePrimary: string;
  phoneEmergency: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  openHours?: string;
  mapUrl?: string;
  mapEmbedUrl?: string;
}

// Contact message data structure
export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  reply?: string;
  status: 'pending' | 'replied';
  createdAt: string;
  repliedAt?: string;
}

// Paginated response returned by GET /contact/messages
export interface PaginatedMessagesResponse {
  messages:   ContactMessage[];
  total:      number;
  pending:    number;
  page:       number;
  totalPages: number;
}