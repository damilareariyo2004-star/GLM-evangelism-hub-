import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDashboardStats } from './recordService';
import { EvangelismRecord } from '../types';

test('calculateDashboardStats computes correct totals and program breakdowns for a worker', () => {
  const records: EvangelismRecord[] = [
    {
      id: '1',
      workerUid: 'worker_uid_abc',
      workerEmail: 'worker1@gospellabor.org',
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
      workerUid: 'worker_uid_abc',
      workerEmail: 'worker1@gospellabor.org',
      fullName: 'Jane Smith',
      phone: '0987654321',
      programs: ['Auxano', 'Sunday Service'],
      isNewConvert: false,
      respondedWell: true,
      evangelistName: 'Worker 1',
      date: '2026-10-21',
      followedUp: false
    },
    {
      id: '3',
      workerUid: 'worker_uid_abc',
      workerEmail: 'worker1@gospellabor.org',
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

test('Records are correctly assigned workerUid and separated', () => {
  const worker1Record: EvangelismRecord = {
    id: 'rec_1',
    workerUid: 'user_111',
    fullName: 'David Mark',
    phone: '08081234567',
    programs: ['Sunday Service'],
    isNewConvert: true,
    respondedWell: true,
    evangelistName: 'Worker David',
    date: '22/10/2026',
    followedUp: false
  };

  const worker2Record: EvangelismRecord = {
    id: 'rec_2',
    workerUid: 'user_222',
    fullName: 'Sarah Benson',
    phone: '08099887766',
    programs: ['Auxano'],
    isNewConvert: false,
    respondedWell: true,
    evangelistName: 'Worker Sarah',
    date: '22/10/2026',
    followedUp: false
  };

  const allRecords = [worker1Record, worker2Record];
  const worker1View = allRecords.filter((r) => r.workerUid === 'user_111');
  const worker2View = allRecords.filter((r) => r.workerUid === 'user_222');

  assert.equal(worker1View.length, 1);
  assert.equal(worker1View[0].fullName, 'David Mark');
  assert.equal(worker2View.length, 1);
  assert.equal(worker2View[0].fullName, 'Sarah Benson');
});
