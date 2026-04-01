export type SlotStatus = 'pending' | 'active' | 'rejected' | 'cancelled' | 'completed';

export interface ChannelingSlot {
  id: string; doctorId: string; date: string; startTime: string; endTime: string;
  bookingCutoffMinutes: number; maxPatients: number; status: SlotStatus; notes: string | null;
  doctor: { id: string; specialization: string; user: { fullName: string; isActive: boolean; }; };
}

export function bookingCutoffDate(date: string, startTime: string, cutoffMinutes: number): Date {
  const [h, m] = startTime.split(':').map(Number);
  const slotStart = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  return new Date(slotStart.getTime() - cutoffMinutes * 60_000);
}

export const isBookingOpen = (slot: ChannelingSlot): boolean => new Date() < bookingCutoffDate(slot.date, slot.startTime, slot.bookingCutoffMinutes);
export const fmt12 = (hhmm: string): string => { const [h, m] = hhmm.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
export const fmtDate = (dateStr: string): string => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });