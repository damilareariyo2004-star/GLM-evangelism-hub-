import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateDisplay, ddmmyyyyToYmd, ymdToDdmmyyyy, getTodayFormatted, compareDatesDesc } from './dateUtils';

test('getTodayFormatted returns DD/MM/YYYY format', () => {
  const today = getTodayFormatted();
  assert.match(today, /^\d{2}\/\d{2}\/\d{4}$/);
});

test('formatDateDisplay converts YYYY-MM-DD to DD/MM/YYYY', () => {
  assert.equal(formatDateDisplay('2026-10-21'), '21/10/2026');
  assert.equal(formatDateDisplay('2026-05-09'), '09/05/2026');
});

test('formatDateDisplay preserves existing DD/MM/YYYY', () => {
  assert.equal(formatDateDisplay('21/10/2026'), '21/10/2026');
});

test('ddmmyyyyToYmd and ymdToDdmmyyyy convert back and forth correctly', () => {
  assert.equal(ddmmyyyyToYmd('21/10/2026'), '2026-10-21');
  assert.equal(ymdToDdmmyyyy('2026-10-21'), '21/10/2026');
});

test('compareDatesDesc accurately sorts across different months and years', () => {
  const dates = [
    '05/01/2026', // Jan 5, 2026
    '20/12/2025', // Dec 20, 2025
    '15/10/2026', // Oct 15, 2026
    '01/05/2026', // May 1, 2026
    '28/02/2026'  // Feb 28, 2026
  ];

  const sorted = [...dates].sort((a, b) => compareDatesDesc(a, b));

  assert.deepEqual(sorted, [
    '15/10/2026',
    '01/05/2026',
    '28/02/2026',
    '05/01/2026',
    '20/12/2025'
  ]);
});
