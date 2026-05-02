// Operational states for channeling slots to manage the booking window and practitioner availability
export type SlotStatus = 'pending' | 'active' | 'rejected' | 'cancelled' | 'completed';

// Structure for channeling slots to define the clinical window for patient-doctor consultations.
// The nested doctor object reflects what the API actually returns from the Doctor entity relation —
// it does NOT include user sub-object since the doctor-user relation is not eagerly loaded here.
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
  };
}

// Helpers
// Calculate the exact date and time when bookings must close to allow clinical preparation
export function bookingCutoffDate(date: string, startTime: string, cutoffMinutes: number): Date {
  const [h, m] = startTime.split(':').map(Number);
  const slotStart = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  return new Date(slotStart.getTime() - cutoffMinutes * 60_000);
}

// Determine if a slot is still available for booking based on the current time and cutoff window
export const isBookingOpen = (slot: ChannelingSlot): boolean =>
  new Date() < bookingCutoffDate(slot.date, slot.startTime, slot.bookingCutoffMinutes);

// Convert 24-hour time to a user-friendly 12-hour format for display in channeling schedules
export const fmt12 = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// Format ISO date strings into a readable localized format for consistent schedule presentation
export const fmtDate = (dateStr: string): string =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
