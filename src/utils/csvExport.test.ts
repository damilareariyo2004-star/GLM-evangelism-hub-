import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeCsvField, generateRecordsCsv } from './csvExport';
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
      fullName: 'Brother David',
      phone: '+2348081122233',
      programs: ['Wednesday Program', 'Sunday Service'],
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
