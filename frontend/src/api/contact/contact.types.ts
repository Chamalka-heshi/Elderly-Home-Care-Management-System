// Publicly visible contact and location details for the facility to guide user inquiries
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

// Inquiry message structure to track communication between the public and the facility
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