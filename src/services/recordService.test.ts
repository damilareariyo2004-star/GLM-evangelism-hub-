import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDashboardStats } from './recordService';
import { EvangelismRecord } from '../types';

test('calculateDashboardStats computes correct totals and program breakdowns', () => {
  const records: EvangelismRecord[] = [
    {
      id: '1',
      fullName: 'John Doe',
      phone: '1234567890',
      programs: ['Wednesday Program', 'Auxano'],
      isNewConvert: true,
      respondedWell: true,
      evangelistName: 'Worker 1',
      date: '2026-10-21',
      followedUp: true
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      phone: '0987654321',
      programs: ['Auxano', 'Sunday Service'],
      isNewConvert: false,
      respondedWell: true,
      evangelistName: 'Worker 2',
      date: '2026-10-21',
      followedUp: false
    },
    {
      id: '3',
      fullName: 'Sam Wilson',
      phone: '5551234567',
      programs: ['Friday Program'],
      isNewConvert: true,
      respondedWell: false,
      evangelistName: 'Worker 1',
      date: '2026-10-20',
      followedUp: false
    }
  ];

  const stats = calculateDashboardStats(records);
  assert.equal(stats.totalRecords, 3);
  assert.equal(stats.totalNewConverts, 2);
  assert.equal(stats.totalRespondedWell, 2);
  assert.equal(stats.totalFollowedUp, 1);
  assert.equal(stats.programCounts['Wednesday Program'], 1);
  assert.equal(stats.programCounts['Friday Program'], 1);
  assert.equal(stats.programCounts['Auxano'], 2);
  assert.equal(stats.programCounts['Sunday Service'], 1);
});
