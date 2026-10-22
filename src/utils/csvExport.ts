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
