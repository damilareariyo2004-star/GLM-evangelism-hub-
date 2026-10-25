/**
 * Date formatting utilities for GLM Evangelism Hub
 * Enforces DD/MM/YYYY format across the application
 */

/**
 * Returns today's date in DD/MM/YYYY format
 */
export function getTodayFormatted(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Converts any date representation (YYYY-MM-DD, ISO string, or timestamp) to DD/MM/YYYY
 */
export function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  // Already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // If in YYYY-MM-DD format (standard ISO date part)
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${day}/${month}/${year}`;
  }

  // Attempt standard Date parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return trimmed;
}

/**
 * Converts DD/MM/YYYY to YYYY-MM-DD for native HTML date inputs if needed, or parses it
 */
export function ddmmyyyyToYmd(ddmmyyyy: string): string {
  if (!ddmmyyyy) return '';
  const match = ddmmyyyy.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  return ddmmyyyy;
}

/**
 * Normalizes any supported date string (DD/MM/YYYY, YYYY-MM-DD, ISO string) into YYYY-MM-DD
 * Ensures comparisons and sorting across different months/years are mathematically correct.
 */
export function normalizeDateToYmd(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  // Check DD/MM/YYYY
  const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Check YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return ymdMatch[0];
  }

  // Attempt standard Date parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

/**
 * Compares two date strings in descending order (newest first).
 * Uses normalized YYYY-MM-DD values so ordering across months is accurate.
 * Fallbacks to createdAt if date is identical.
 */
export function compareDatesDesc(
  dateA?: string | null,
  dateB?: string | null,
  createdAtA?: string | null,
  createdAtB?: string | null
): number {
  const ymdA = normalizeDateToYmd(dateA);
  const ymdB = normalizeDateToYmd(dateB);

  if (ymdA && ymdB && ymdA !== ymdB) {
    return ymdB.localeCompare(ymdA); // newest first
  }
  if (ymdA && !ymdB) return -1;
  if (!ymdA && ymdB) return 1;

  // Secondary tie-breaker: createdAt timestamp
  const createdA = createdAtA || '';
  const createdB = createdAtB || '';
  return createdB.localeCompare(createdA);
}

/**
 * Checks if a given date falls within the last N days (inclusive of today)
 */
export function isDateInLastDays(dateStr?: string | null, days = 7, refDate = new Date()): boolean {
  const ymd = normalizeDateToYmd(dateStr);
  if (!ymd) return false;

  const targetDate = new Date(ymd + 'T00:00:00');
  if (isNaN(targetDate.getTime())) return false;

  const endOfToday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999);
  const startWindow = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - (days - 1), 0, 0, 0, 0);

  return targetDate >= startWindow && targetDate <= endOfToday;
}

/**
 * Checks if a given date falls within the current calendar week (Monday to Sunday)
 */
export function isDateInThisWeek(dateStr?: string | null, refDate = new Date()): boolean {
  const ymd = normalizeDateToYmd(dateStr);
  if (!ymd) return false;

  const target = new Date(ymd + 'T00:00:00');
  if (isNaN(target.getTime())) return false;

  const dayOfWeek = refDate.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - distanceToMonday, 0, 0, 0, 0);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  sunday.setHours(23, 59, 59, 999);

  return target >= monday && target <= sunday;
}

/**
 * Checks if a given date falls within the previous calendar week (Monday to Sunday of last week)
 */
export function isDateInLastWeek(dateStr?: string | null, refDate = new Date()): boolean {
  const ymd = normalizeDateToYmd(dateStr);
  if (!ymd) return false;

  const target = new Date(ymd + 'T00:00:00');
  if (isNaN(target.getTime())) return false;

  const dayOfWeek = refDate.getDay();
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const prevMonday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - distanceToMonday - 7, 0, 0, 0, 0);
  const prevSunday = new Date(prevMonday.getTime() + 6 * 24 * 60 * 60 * 1000);
  prevSunday.setHours(23, 59, 59, 999);

  return target >= prevMonday && target <= prevSunday;
}

/**
 * Converts YYYY-MM-DD (e.g. from HTML date input) to DD/MM/YYYY
 */
export function ymdToDdmmyyyy(ymd: string): string {
  if (!ymd) return '';
  const match = ymd.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  return ymd;
}
