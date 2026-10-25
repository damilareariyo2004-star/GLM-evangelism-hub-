import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeCsvField,
  generateRecordsCsv,
  normalizeDateToYmd,
  filterRecordsByDateRange,
  getPresetDateBounds
} from './csvExport';
import { EvangelismRecord } from '../types';

test('escapeCsvField escapes strings and quotes properly', () => {
  assert.equal(escapeCsvField('Simple Text'), '"Simple Text"');
  assert.equal(escapeCsvField('Text with "quotes"'), '"Text with ""quotes"""');
  assert.equal(escapeCsvField('Text, with comma'), '"Text, with comma"');
  assert.equal(escapeCsvField(null), '""');
});

test('generateRecordsCsv outputs valid CSV with DD/MM/YYYY date formatting', () => {
  const records: EvangelismRecord[] = [
    {
      id: 'rec-1',
      workerUid: 'worker-123',
      fullName: 'Brother David',
      phone: '+2348081122233',
      programs: ['Wednesday Program / Joint Auxano', 'Sunday Service'],
      isNewConvert: true,
      respondedWell: true,
      notes: 'Asked about youth fellowship',
      evangelistName: 'Sister Grace',
      date: '2026-10-21',
      followedUp: false,
      followUpNotes: ''
    }
  ];

  const csv = generateRecordsCsv(records);
  assert.ok(csv.startsWith('"Full Name","Phone / Contact"'));
  assert.ok(csv.includes('"Brother David"'));
  assert.ok(csv.includes('"21/10/2026"')); // DD/MM/YYYY
  assert.ok(csv.includes('"Yes"')); // isNewConvert
});

test('normalizeDateToYmd correctly handles DD/MM/YYYY and YYYY-MM-DD', () => {
  assert.equal(normalizeDateToYmd('22/10/2026'), '2026-10-22');
  assert.equal(normalizeDateToYmd('2026-10-22'), '2026-10-22');
  assert.equal(normalizeDateToYmd(''), '');
  assert.equal(normalizeDateToYmd(null), '');
});

test('filterRecordsByDateRange correctly filters records within preset or custom range', () => {
  const records: EvangelismRecord[] = [
    {
      id: 'r1',
      workerUid: 'w1',
      fullName: 'John Oct 20',
      phone: '080111',
      programs: ['Sunday Service'],
      isNewConvert: true,
      respondedWell: true,
      evangelistName: 'Worker 1',
      date: '2026-10-20',
      followedUp: true
    },
    {
      id: 'r2',
      workerUid: 'w1',
      fullName: 'Mary Oct 22',
      phone: '080222',
      programs: ['Wednesday Program / Joint Auxano'],
      isNewConvert: false,
      respondedWell: true,
      evangelistName: 'Worker 1',
      date: '22/10/2026', // DD/MM/YYYY format
      followedUp: false
    },
    {
      id: 'r3',
      workerUid: 'w1',
      fullName: 'Paul Sep 15',
      phone: '080333',
      programs: ['Friday Program / Something New'],
      isNewConvert: false,
      respondedWell: false,
      evangelistName: 'Worker 1',
      date: '2026-09-15',
      followedUp: false
    }
  ];

  // Reference date: Thursday, 2026-10-22
  const refDate = new Date('2026-10-22T12:00:00Z');

  // All preset returns all 3 records
  const allRes = filterRecordsByDateRange(records, { preset: 'all' }, refDate);
  assert.equal(allRes.length, 3);

  // Last 7 days includes Oct 20 and Oct 22, excludes Sep 15
  const last7 = filterRecordsByDateRange(records, { preset: 'last_7_days' }, refDate);
  assert.equal(last7.length, 2);
  assert.ok(last7.some((r: EvangelismRecord) => r.id === 'r1'));
  assert.ok(last7.some((r: EvangelismRecord) => r.id === 'r2'));

  // Custom range
  const custom = filterRecordsByDateRange(records, { preset: 'custom', startDate: '2026-10-21', endDate: '2026-10-23' }, refDate);
  assert.equal(custom.length, 1);
  assert.equal(custom[0].id, 'r2');
});

test('generateRecordsCsv includes Established column and optional Worker column', () => {
  const records: EvangelismRecord[] = [
    {
      id: 'rec-test-1',
      workerUid: 'uid_grace',
      workerEmail: 'grace@glm.org',
      fullName: 'Brother Barnabas',
      phone: '08012345678',
      programs: ['Sunday Service'],
      isNewConvert: false,
      respondedWell: true,
      evangelistName: 'Sister Grace',
      date: '2026-10-22',
      followedUp: true,
      isEstablished: true
    }
  ];

  // Standard worker export: has Established column
  const standardCsv = generateRecordsCsv(records);
  assert.ok(standardCsv.includes('"Established"'));
  assert.ok(standardCsv.includes('"Yes"'));

  // Admin export: has Worker column
  const adminCsv = generateRecordsCsv(records, { includeWorker: true });
  assert.ok(adminCsv.startsWith('"Worker","Full Name"'));
  assert.ok(adminCsv.includes('"grace@glm.org"'));
});

