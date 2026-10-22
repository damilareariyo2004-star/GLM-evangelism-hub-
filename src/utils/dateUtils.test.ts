import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateDisplay, ddmmyyyyToYmd, ymdToDdmmyyyy, getTodayFormatted } from './dateUtils';

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
