import { EvangelismRecord } from '../types';
import { formatDateDisplay } from './dateUtils';

/**
 * Escapes a field for CSV according to RFC 4180
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates CSV content from an array of EvangelismRecord
 */
export function generateRecordsCsv(records: EvangelismRecord[]): string {
  const headers = [
    'Full Name',
    'Phone / Contact',
    'Invited Programs',
    'New Convert',
    'Responded Well',
    'Notes / Details',
    'Evangelist',
    'Date Recorded (DD/MM/YYYY)',
    'Followed Up',
    'Follow-up Notes'
  ];

  const headerRow = headers.map(escapeCsvField).join(',');

  const dataRows = records.map((rec) => {
    const row = [
      rec.fullName,
      rec.phone,
      Array.isArray(rec.programs) ? rec.programs.join('; ') : '',
      rec.isNewConvert ? 'Yes' : 'No',
      rec.respondedWell ? 'Yes' : 'No',
      rec.notes || '',
      rec.evangelistName,
      formatDateDisplay(rec.date),
      rec.followedUp ? 'Yes' : 'No',
      rec.followUpNotes || ''
    ];
    return row.map(escapeCsvField).join(',');
  });

  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Normalizes any supported date string (DD/MM/YYYY, YYYY-MM-DD, ISO) into YYYY-MM-DD for reliable comparison
 */
export function normalizeDateToYmd(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  // Check DD/MM/YYYY
  const ddmmyyyy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month}-${day}`;
  }

  // Check YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return ymdMatch[0];
  }

  // Parse as Date object
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
 * Calculates start and end YYYY-MM-DD dates for a preset
 */
export function getPresetDateBounds(
  preset: 'all' | 'this_week' | 'last_7_days' | 'this_month' | 'custom',
  referenceDate: Date = new Date()
): { startDate: string; endDate: string } {
  const ref = new Date(referenceDate.getTime());
  const formatYmd = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYmd(ref);

  if (preset === 'all') {
    return { startDate: '', endDate: '' };
  }

  if (preset === 'last_7_days') {
    const past = new Date(ref.getTime());
    past.setDate(past.getDate() - 6);
    return { startDate: formatYmd(past), endDate: todayStr };
  }

  if (preset === 'this_week') {
    // Current week: Monday to Sunday
    const curr = new Date(ref.getTime());
    const dayOfWeek = curr.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (dayOfWeek + 6) % 7; // Monday = 0, Tuesday = 1, ... Sunday = 6
    const monday = new Date(curr.getTime());
    monday.setDate(curr.getDate() - distanceToMonday);

    const sunday = new Date(monday.getTime());
    sunday.setDate(monday.getDate() + 6);

    return { startDate: formatYmd(monday), endDate: formatYmd(sunday) };
  }

  if (preset === 'this_month') {
    const firstDay = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return { startDate: formatYmd(firstDay), endDate: formatYmd(lastDay) };
  }

  return { startDate: '', endDate: '' };
}

/**
 * Filters an array of EvangelismRecord by date range filter
 */
export function filterRecordsByDateRange(
  records: EvangelismRecord[],
  filter: { preset: 'all' | 'this_week' | 'last_7_days' | 'this_month' | 'custom'; startDate?: string; endDate?: string },
  referenceDate: Date = new Date()
): EvangelismRecord[] {
  if (filter.preset === 'all') {
    return [...records];
  }

  let startYmd = '';
  let endYmd = '';

  if (filter.preset === 'custom') {
    startYmd = filter.startDate ? normalizeDateToYmd(filter.startDate) : '';
    endYmd = filter.endDate ? normalizeDateToYmd(filter.endDate) : '';
  } else {
    const bounds = getPresetDateBounds(filter.preset, referenceDate);
    startYmd = bounds.startDate;
    endYmd = bounds.endDate;
  }

  return records.filter((rec) => {
    const recYmd = normalizeDateToYmd(rec.date);
    if (!recYmd) return false;

    if (startYmd && recYmd < startYmd) {
      return false;
    }
    if (endYmd && recYmd > endYmd) {
      return false;
    }
    return true;
  });
}

/**
 * Initiates browser download of CSV file
 */
export function downloadRecordsCsv(records: EvangelismRecord[], filename = 'glm-evangelism-records.csv'): void {
  const csvContent = generateRecordsCsv(records);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

