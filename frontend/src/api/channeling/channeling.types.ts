// Channeling slot status
export type SlotStatus = 'pending' | 'active' | 'rejected' | 'cancelled' | 'completed';

// Channeling slot data structure
export interface ChannelingSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  bookingCutoffMinutes: number;
  maxPatients: number;
  status: SlotStatus;
  notes: string | null;
  consultationFee: number | null;
  careHomeFee: number | null;
  doctor: {
    id: string;
    specialization: string;
    licenseNumber: string;
    qualification: string;
    experienceYears: number;
    hospitalAffiliation: string | null;
    consultationFee: number | null;
    availableDays: string[] | null;
    availableTimeStart: string | null;
    availableTimeEnd: string | null;
    /** Populated when the doctor.user relation is eager-loaded (public slot listings, family views) */
    user?: {
      fullName: string;
      isActive: boolean;
    };
  };
}

// Helpers for channeling slots
// Calculate booking cutoff time
export function bookingCutoffDate(date: string, startTime: string, cutoffMinutes: number): Date {
  const [h, m] = startTime.split(':').map(Number);
  const slotStart = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  return new Date(slotStart.getTime() - cutoffMinutes * 60_000);
}

// Get exact slot start Date
export function slotStartDate(date: string, startTime: string): Date {
  const [h, m] = startTime.split(':').map(Number);
  return new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
}

// Check if a slot is open for booking (now < cutoffDate and now < slotStartDate)
export const isBookingOpen = (slot: ChannelingSlot): boolean => {
  if (slot.status !== 'active') return false;
  const now = new Date();
  const cutoff = bookingCutoffDate(slot.date, slot.startTime, slot.bookingCutoffMinutes);
  const start = slotStartDate(slot.date, slot.startTime);
  return now < cutoff && now < start;
};

// Check if a slot's start time has arrived/passed
export const isSlotPassed = (slot: ChannelingSlot): boolean => {
  if (slot.status === 'completed') return true;
  if (slot.status === 'cancelled' || slot.status === 'rejected') return false;
  const now = new Date();
  const start = slotStartDate(slot.date, slot.startTime);
  return now >= start;
};

// Convert to 12-hour time
export const fmt12 = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// Format date string
export const fmtDate = (dateStr: string): string =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-LK', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Colombo',
  });
