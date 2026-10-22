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
