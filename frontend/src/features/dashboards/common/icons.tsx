import React from "react";

export type IconProps = { className?: string };

// Profile / Auth
// Visual markers for user identity, security clearance, and professional medical roles
export const IconUser: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const IconShield: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconStethoscope: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 3v5a4 4 0 004 4h0a4 4 0 004-4V3M8 21v-3a4 4 0 018 0v3M20 14a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Communication
// Indicators for messaging, alerts, and administrative correspondence
export const IconMail: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 6.5h16c.83 0 1.5.67 1.5 1.5v8c0 .83-.67 1.5-1.5 1.5H4c-.83 0-1.5-.67-1.5-1.5V8c0-.83.67-1.5 1.5-1.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M4.5 8l6.9 4.6c.38.25.87.25 1.25 0L19.5 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconPhone: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8.7 3.5h-2A2.2 2.2 0 0 0 4.5 5.7c0 8.2 5.6 13.8 13.8 13.8a2.2 2.2 0 0 0 2.2-2.2v-2a1.8 1.8 0 0 0-1.2-1.7l-2.7-.9a1.8 1.8 0 0 0-2 .6l-.8 1.1a12.8 12.8 0 0 1-5.1-5.1l1.1-.8a1.8 1.8 0 0 0 .6-2l-.9-2.7A1.8 1.8 0 0 0 8.7 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

export const IconBell: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

export const IconReply: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6 6-6" />
  </svg>
);

export const IconInbox: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0-4 4H8l-4-4m16 0H4" />
  </svg>
);

// Navigation
// Wayfinding elements for lateral and hierarchical movement within the application
export const IconChevronLeft: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconChevronDown: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export const IconArrowRight: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export const IconBack: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

export const IconMenu: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const IconX: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2-4.35-4.35" />
  </svg>
);

export const IconEye: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

// Security / Status
// System states and data integrity indicators for critical user feedback
export const IconLock: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7.5 11V8.8A4.5 4.5 0 0 1 12 4.3a4.5 4.5 0 0 1 4.5 4.5V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M7.2 11h9.6c1 0 1.7.8 1.7 1.7v6.1c0 1-.8 1.7-1.7 1.7H7.2c-1 0-1.7-.8-1.7-1.7v-6.1c0-1 .8-1.7 1.7-1.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

export const IconAlert: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3.8 21 20H3L12 3.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12 9v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 17.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCheckCircle: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconAlertCircle: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <line x1="12" y1="8" x2="12" y2="12" strokeWidth={2} />
    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth={2} />
  </svg>
);

export const IconBan: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

export const IconInfo: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// Dashboard / Layout
// Structural elements used for organization and visual hierarchy in dashboard views
export const IconSettings: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M19.4 15a7.97 7.97 0 00.1-1 7.97 7.97 0 00-.1-1l2.02-1.57-2-3.46-2.45 1a7.8 7.8 0 00-1.73-1L14.9 2h-4l-.32 2.97a7.8 7.8 0 00-1.73 1l-2.45-1-2 3.46L6.6 12a7.97 7.97 0 00-.1 1c0 .34.03.67.1 1L4.58 16.57l2 3.46 2.45-1c.53.42 1.11.77 1.73 1L10.9 22h4l.32-2.97c.62-.23 1.2-.58 1.73-1l2.45 1 2-3.46L19.4 15z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconLayoutDashboard: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM13 10h8v11h-8V10zM3 13h8v8H3v-8z" />
  </svg>
);

export const IconSparkle: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l1.2 4.2L17.4 8l-4.2 1.2L12 13.4l-1.2-4.2L6.6 8l4.2-1.8L12 2zm7 7l.8 2.8 2.8.8-2.8.8L19 16.6l-.8-2.8-2.8-.8 2.8-1.2L19 9zM4 14l1 3.3L8.3 18 5 19l-1 3-1-3-3-.7 3-.7L4 14z" />
  </svg>
);

// People
// Icons representing individual and group entities within the care ecosystem
export const IconUsers: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M17 21v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1m14 0h4v-1a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M11 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export const IconHeart: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

export const IconUserPlus: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M10 7a4 4 0 11-8 0 4 4 0 018 0zm9 4v6m3-3h-6" />
  </svg>
);

// Medical / Health
// Specialized indicators for medical record keeping and health tracking tasks
export const IconClipboard: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

export const IconClipboardList: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6 4h6" />
  </svg>
);

export const IconCalendar: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const IconClock: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconPill: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

// Actions
// Interactive cues for common administrative and user operations
export const IconPlus: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

export const IconTrash: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const IconEdit: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export const IconFilter: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
  </svg>
);

export const IconRefresh: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export const IconPrint: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-10 0h8v4H6v-4z" />
  </svg>
);

export const IconIdCard: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
  </svg>
);

// Finance
// Visual markers for monetary transactions, digital payments, and accounting records
export const IconCurrency: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconSparkles: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l1.2 4.2L17.4 8l-4.2 1.2L12 13.4l-1.2-4.2L6.6 8l4.2-1.8L12 2zm7 7l.8 2.8 2.8.8-2.8.8L19 16.6l-.8-2.8-2.8-.8 2.8-1.2L19 9zM4 14l1 3.3L8.3 18 5 19l-1 3-1-3-3-.7 3-.7L4 14z" />
  </svg>
);

export const IconCreditCard: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

export const IconBank: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 10v11m14-11v11m-7-11v11M2 10l10-7 10 7" />
  </svg>
);

// Doctor Appointments specific
// Contextual icons for clinical consultations and physiological data monitoring
export const IconFileText: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

export const IconActivity: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export const IconUserCheck: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM16 11l2 2 4-4" />
  </svg>
);

export const IconChevronRight: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
  </svg>
);

export const IconChevronUp: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M18 15l-6-6-6 6" />
  </svg>
);

// Branding
// Official assets for external authentication providers and session termination
export const IconGoogle: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M47.532 24.552c0-1.636-.132-3.202-.388-4.701H24.48v9.01h12.985c-.566 2.99-2.24 5.525-4.76 7.226v5.998h7.698c4.508-4.15 7.129-10.269 7.129-17.533z" fill="#4285F4"/>
    <path d="M24.48 48c6.504 0 11.955-2.152 15.94-5.852l-7.698-5.998c-2.156 1.444-4.912 2.295-8.242 2.295-6.34 0-11.706-4.278-13.624-10.026H3.026v6.19C6.998 42.618 15.147 48 24.48 48z" fill="#34A853"/>
    <path d="M10.856 28.42A14.368 14.368 0 0 1 10.01 24c0-1.53.264-3.017.846-4.42v-6.19H3.026A23.928 23.928 0 0 0 .48 24c0 3.86.928 7.512 2.546 10.61l7.83-6.19z" fill="#FBBC05"/>
    <path d="M24.48 9.554c3.57 0 6.762 1.226 9.282 3.634l6.946-6.946C36.428 2.384 30.984 0 24.48 0 15.147 0 6.998 5.382 3.026 13.39l7.83 6.19C12.774 13.832 18.14 9.554 24.48 9.554z" fill="#EA4335"/>
  </svg>
);

export const IconLogout: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

export const IconAlertTriangle: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeWidth="1.6" strokeLinejoin="round" d="M12 3.8 21 20H3L12 3.8Z" />
    <path strokeWidth="1.6" strokeLinecap="round" d="M12 9v5" />
    <path strokeWidth="2.2" strokeLinecap="round" d="M12 17.5h.01" />
  </svg>
);

// Misc
// Auxiliary icons for loading states and generic medical documentation
export const IconSpinner: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4 animate-spin"} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
  </svg>
);

export const IconPrescription: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const IconWave: React.FC<IconProps> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v4M11.5 10c-.83 0-1.5-.67-1.5-1.5v-4c0-.83-.67-1.5-1.5-1.5S7 3.67 7 4.5v5M8.5 10c-.83 0-1.5-.67-1.5-1.5v-3c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 11.5c-.83 0-1.5-.67-1.5-1.5v-2c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.5v2.21c0 1.93.93 3.74 2.5 4.82l.82.57c1.4.98 3.1 1.4 4.82 1.4h1.72c3.15 0 5.86-2.17 6.64-5.22l.5-1.96" />
  </svg>
);
