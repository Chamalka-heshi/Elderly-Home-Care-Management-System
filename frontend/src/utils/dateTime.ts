export const LOCALE   = 'en-US';
export const TIMEZONE = 'Asia/Colombo';

// Sri Lanka Standard Time is UTC + 5 hours 30 minutes (19,800,000 milliseconds)
const COLOMBO_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/**
 * Parses any date/ISO representation and converts it into a Date object
 * shifted to Sri Lanka (Asia/Colombo) wall-clock time (+05:30).
 */
const toColomboDate = (iso: string | Date | null | undefined): Date | null => {
  if (!iso) return null;

  let utcMs: number;
  if (iso instanceof Date) {
    utcMs = iso.getTime();
  } else {
    let str = String(iso).trim();
    if (!str) return null;

    // Convert custom backend filenames like "backup_manual_2026-07-29_14-24-26" if passed
    if (str.includes('_') && !str.includes('T')) {
      const parts = str.split('_');
      const datePart = parts[parts.length - 2];
      const timePart = parts[parts.length - 1]?.replace(/-/g, ':');
      if (datePart && timePart) {
        str = `${datePart}T${timePart}Z`;
      }
    }

    // Ensure non-offset strings are treated as UTC by appending Z
    if (!/[Zz]$|[+-]\d{2}:?\d{2}$/.test(str)) {
      str += 'Z';
    }
    utcMs = new Date(str).getTime();
  }

  if (isNaN(utcMs)) return null;

  // Add +5:30h offset to align UTC getters with Sri Lanka local wall clock
  return new Date(utcMs + COLOMBO_OFFSET_MS);
};

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_LONG    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/** "Jul 29, 2026" */
export const fmtDate = (iso: string | Date | null | undefined): string => {
  const cd = toColomboDate(iso);
  if (!cd) return '—';
  return `${MONTHS_SHORT[cd.getUTCMonth()]} ${cd.getUTCDate()}, ${cd.getUTCFullYear()}`;
};

/** "02:24 PM" */
export const fmtTime = (iso: string | Date | null | undefined): string => {
  const cd = toColomboDate(iso);
  if (!cd) return '—';
  let h = cd.getUTCHours();
  const m = String(cd.getUTCMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const hourStr = String(h).padStart(2, '0');
  return `${hourStr}:${m} ${ampm}`;
};

/** "Jul 29, 2026, 02:24 PM" */
export const fmtDateTime = (iso: string | Date | null | undefined): string => {
  const d = fmtDate(iso);
  const t = fmtTime(iso);
  if (d === '—') return '—';
  return `${d}, ${t}`;
};

/** "Tuesday, July 29" */
export const fmtDayLabel = (date?: Date): string => {
  const cd = toColomboDate(date ?? new Date());
  if (!cd) return '—';
  return `${DAYS_LONG[cd.getUTCDay()]}, ${MONTHS_LONG[cd.getUTCMonth()]} ${cd.getUTCDate()}`;
};

/** "Tuesday" */
export const fmtWeekday = (date?: Date): string => {
  const cd = toColomboDate(date ?? new Date());
  if (!cd) return '—';
  return DAYS_LONG[cd.getUTCDay()];
};

/** "29 Jul 2026" */
export const fmtDateShort = (iso: string | Date | null | undefined): string => {
  const cd = toColomboDate(iso);
  if (!cd) return '—';
  return `${String(cd.getUTCDate()).padStart(2, '0')} ${MONTHS_SHORT[cd.getUTCMonth()]} ${cd.getUTCFullYear()}`;
};

/** "Jul" */
export const fmtMonthShort = (iso: string | Date | null | undefined): string => {
  const cd = toColomboDate(iso);
  if (!cd) return '—';
  return MONTHS_SHORT[cd.getUTCMonth()];
};

/** Returns today's date in YYYY-MM-DD in local Colombo time (+05:30) */
export const todayLocal = (): string => {
  const cd = toColomboDate(new Date());
  if (!cd) return new Date().toISOString().split('T')[0];
  const y = cd.getUTCFullYear();
  const m = String(cd.getUTCMonth() + 1).padStart(2, '0');
  const d = String(cd.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
