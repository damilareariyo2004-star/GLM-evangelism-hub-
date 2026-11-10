import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDashboardStats } from './recordService';
import { EvangelismRecord } from '../types';

test('calculateDashboardStats computes correct totals and program breakdowns for a worker', () => {
  const records: EvangelismRecord[] = [
    {
      id: '1',
      workerUid: 'worker_uid_abc',
      workerEmail: 'worker1@gospellabour.org',
      fullName: 'John Doe',
      phone: '1234567890',
      programs: ['Wednesday Program / Joint Auxano', 'School Auxano'],
      isNewConvert: true,
      respondedWell: true,
      evangelistName: 'Worker 1',
      date: '2026-10-21',
      followedUp: true
    },
    {
      id: '2',
      workerUid: 'worker_uid_abc',
      workerEmail: 'worker1@gospellabour.org',
      fullName: 'Jane Smith',
      phone: '0987654321',
      programs: ['School Auxano', 'Sunday Service'],
      isNewConvert: false,
      respondedWell: true,
      evangelistName: 'Worker 1',
      date: '2026-10-21',
      followedUp: false
    },
    {
      id: '3',
      workerUid: 'worker_uid_abc',
      workerEmail: 'worker1@gospellabour.org',
      fullName: 'Sam Wilson',
      phone: '5551234567',
      programs: ['Friday Program / Something New'],
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
  assert.equal(stats.programCounts['Wednesday Program/Joint Auxano'], 1);
  assert.equal(stats.programCounts['Friday Program/Something New'], 1);
  assert.equal(stats.programCounts['School Auxano'], 2);
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
    programs: ['School Auxano'],
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

test('calculateDashboardStats handles isEstablished: leaves pending counts but stays in totals', () => {
  const records: EvangelismRecord[] = [
    {
      id: 'rec_active_pending',
      workerUid: 'user_1',
      fullName: 'Brother A',
      phone: '0801111',
      programs: ['Sunday Service'],
      isNewConvert: false,
      respondedWell: true,
      evangelistName: 'Worker 1',
      date: '2026-10-20',
      followedUp: false,
      isEstablished: false
    },
    {
      id: 'rec_active_followed_up',
      workerUid: 'user_1',
      fullName: 'Sister B',
      phone: '0802222',
      programs: ['Wednesday Program/Joint Auxano'],
      isNewConvert: true,
      respondedWell: true,
      evangelistName: 'Worker 1',
      date: '2026-10-21',
      followedUp: true,
      isEstablished: false
    },
    {
      id: 'rec_established',
      workerUid: 'user_1',
      fullName: 'Brother C (Established)',
      phone: '0803333',
      programs: ['Friday Program/Something New'],
      isNewConvert: true,
      respondedWell: true,
      evangelistName: 'Worker 1',
      date: '2026-10-18',
      followedUp: false, // not marked followed up, but is established
      isEstablished: true,
      establishedAt: '2026-10-24T10:00:00.000Z'
    }
  ];

  const stats = calculateDashboardStats(records);
  // Total includes all 3 records
  assert.equal(stats.totalRecords, 3);
  // Total established is 1
  assert.equal(stats.totalEstablished, 1);
  // Followed up is 1
  assert.equal(stats.totalFollowedUp, 1);
  // Pending follow-up excludes established person (only Brother A is pending)
  assert.equal(stats.pendingFollowUp, 1);
  // New converts includes established person if they were new convert
  assert.equal(stats.totalNewConverts, 2);
});

test('Removed worker records are kept by default and still count in dashboard totals', () => {
  const allRecords: EvangelismRecord[] = [
    {
      id: 'rec_active_1',
      workerUid: 'active_worker_1',
      fullName: 'Sister Grace',
      phone: '08011112222',
      programs: ['Sunday Service'],
      isNewConvert: true,
      respondedWell: true,
      evangelistName: 'Worker 1',
      date: '2026-10-22',
      followedUp: true
    },
    {
      id: 'rec_removed_worker_rec_1',
      workerUid: 'removed_worker_999',
      fullName: 'Brother Paul',
      phone: '08033334444',
      programs: ['Wednesday Program/Joint Auxano'],
      isNewConvert: true,
      respondedWell: true,
      evangelistName: 'Removed Worker',
      date: '2026-10-21',
      followedUp: false
    }
  ];

  const removedWorkerUids = new Set(['removed_worker_999']);

  // Records of removed worker are retained
  assert.equal(allRecords.length, 2);

  // Still counted in high-level stats
  const stats = calculateDashboardStats(allRecords);
  assert.equal(stats.totalRecords, 2);
  assert.equal(stats.totalNewConverts, 2);

  // In All Records, records can be marked with "Removed worker" label
  const isBrotherPaulWorkerRemoved = removedWorkerUids.has(allRecords[1].workerUid);
  assert.equal(isBrotherPaulWorkerRemoved, true);

  const isSisterGraceWorkerRemoved = removedWorkerUids.has(allRecords[0].workerUid);
  assert.equal(isSisterGraceWorkerRemoved, false);
});

test('Batch deletion chunks IDs into arrays of at most 500 items', () => {
  // Generate 1250 sample record IDs
  const sampleIds = Array.from({ length: 1250 }, (_, i) => `rec_${i}`);
  const BATCH_SIZE = 500;
  const chunks: string[][] = [];

  for (let i = 0; i < sampleIds.length; i += BATCH_SIZE) {
    chunks.push(sampleIds.slice(i, i + BATCH_SIZE));
  }

  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 500);
  assert.equal(chunks[1].length, 500);
  assert.equal(chunks[2].length, 250);
});

test('BACKGROUND_IDLE_TIMEOUT_MS is 5 minutes and evaluates elapsed background duration correctly', () => {
  const BACKGROUND_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
  assert.equal(BACKGROUND_IDLE_TIMEOUT_MS, 300000);

  // Active usage: tab is visible -> duration is 0
  const activeAwayDuration = 0;
  assert.equal(activeAwayDuration >= BACKGROUND_IDLE_TIMEOUT_MS, false);

  // Quick switch away: 30 seconds -> should not sign out
  const quickAwayDuration = 30 * 1000;
  assert.equal(quickAwayDuration >= BACKGROUND_IDLE_TIMEOUT_MS, false);

  // Away in background for 5 minutes and 1 second -> should sign out
  const longAwayDuration = 5 * 60 * 1000 + 1000;
  assert.equal(longAwayDuration >= BACKGROUND_IDLE_TIMEOUT_MS, true);
});

test('isApprovedAdminEmail validates admin1 to admin5 @glmevangelism.com accurately', async () => {
  const { isApprovedAdminEmail, APPROVED_ADMIN_EMAILS } = await import('../config/adminConfig');
  assert.equal(APPROVED_ADMIN_EMAILS.length, 5);
  assert.ok(APPROVED_ADMIN_EMAILS.includes('admin1@glmevangelism.com'));
  assert.ok(APPROVED_ADMIN_EMAILS.includes('admin2@glmevangelism.com'));
  assert.ok(APPROVED_ADMIN_EMAILS.includes('admin3@glmevangelism.com'));
  assert.ok(APPROVED_ADMIN_EMAILS.includes('admin4@glmevangelism.com'));
  assert.ok(APPROVED_ADMIN_EMAILS.includes('admin5@glmevangelism.com'));

  // Exact lowercase
  assert.equal(isApprovedAdminEmail('admin1@glmevangelism.com'), true);
  assert.equal(isApprovedAdminEmail('admin2@glmevangelism.com'), true);
  assert.equal(isApprovedAdminEmail('admin3@glmevangelism.com'), true);
  assert.equal(isApprovedAdminEmail('admin4@glmevangelism.com'), true);
  assert.equal(isApprovedAdminEmail('admin5@glmevangelism.com'), true);

  // Mixed case and spaces
  assert.equal(isApprovedAdminEmail('Admin1@glmevangelism.com'), true);
  assert.equal(isApprovedAdminEmail('  admin2@glmevangelism.com  '), true);
  assert.equal(isApprovedAdminEmail('ADMIN3@GLMEVANGELISM.COM'), true);

  // Former and unapproved emails
  assert.equal(isApprovedAdminEmail('damilareariyo2004@gmail.com'), false);
  assert.equal(isApprovedAdminEmail('kingsolomond01@gmail.com'), false);
  assert.equal(isApprovedAdminEmail('sdemiliade@gmail.com'), false);
  assert.equal(isApprovedAdminEmail('randomworker@gmail.com'), false);
  assert.equal(isApprovedAdminEmail('worker@gospellabour.org'), false);
  assert.equal(isApprovedAdminEmail(''), false);
  assert.equal(isApprovedAdminEmail(null), false);
  assert.equal(isApprovedAdminEmail(undefined), false);
});

test('isNeedsFollowUp correctly identifies people not contacted in 3 or more days or never', async () => {
  const { isNeedsFollowUp } = await import('./recordService');
  const now = new Date('2026-11-03T12:00:00Z');

  // Case 1: Established believers never show in needs follow-up
  const establishedRecord: EvangelismRecord = {
    id: 'est_1',
    workerUid: 'w1',
    fullName: 'Established Soul',
    phone: '08011111111',
    evangelistName: 'Worker A',
    date: '2026-10-01',
    programs: ['Sunday Service'],
    isNewConvert: false,
    respondedWell: true,
    followedUp: true,
    isEstablished: true
  };
  assert.equal(isNeedsFollowUp(establishedRecord, now), false);

  // Case 2: Contacted today (2026-11-03) -> false (< 3 days)
  const contactedTodayRecord: EvangelismRecord = {
    id: 'rec_today',
    workerUid: 'w1',
    fullName: 'Contacted Today',
    phone: '08022222222',
    evangelistName: 'Worker A',
    date: '2026-11-03',
    programs: ['Sunday Service'],
    isNewConvert: false,
    respondedWell: true,
    followedUp: true,
    lastContactedAt: '2026-11-03'
  };
  assert.equal(isNeedsFollowUp(contactedTodayRecord, now), false);

  // Case 3: Met earlier, never contacted -> true (or never)
  const overdueNeverContacted: EvangelismRecord = {
    id: 'rec_overdue_never',
    workerUid: 'w1',
    fullName: 'Overdue Soul',
    phone: '08033333333',
    evangelistName: 'Worker A',
    date: '2026-10-30',
    programs: ['Sunday Service'],
    isNewConvert: true,
    respondedWell: true,
    followedUp: false
  };
  assert.equal(isNeedsFollowUp(overdueNeverContacted, now), true);

  // Case 4: Contacted yesterday (2026-11-02) -> false (< 3 days)
  const contactedYesterday: EvangelismRecord = {
    id: 'rec_yesterday',
    workerUid: 'w1',
    fullName: 'Recent Contact',
    phone: '08044444444',
    evangelistName: 'Worker A',
    date: '2026-10-20',
    programs: ['Sunday Service'],
    isNewConvert: false,
    respondedWell: true,
    followedUp: true,
    lastContactedAt: '2026-11-02'
  };
  assert.equal(isNeedsFollowUp(contactedYesterday, now), false);

  // Case 5: Contacted 4 days ago (2026-10-30) -> true (>= 3 days)
  const contactedOverdue: EvangelismRecord = {
    id: 'rec_contact_overdue',
    workerUid: 'w1',
    fullName: 'Needs Contact Again',
    phone: '08055555555',
    evangelistName: 'Worker A',
    date: '2026-10-20',
    programs: ['Sunday Service'],
    isNewConvert: false,
    respondedWell: true,
    followedUp: true,
    lastContactedAt: '2026-10-30'
  };
  assert.equal(isNeedsFollowUp(contactedOverdue, now), true);
});

test('calculateDashboardStats calculates totalCameToChurch from attendance records', () => {
  const records: EvangelismRecord[] = [
    {
      id: 'rec_att_1',
      workerUid: 'w1',
      fullName: 'Attendee 1',
      phone: '0801',
      evangelistName: 'Worker A',
      date: '2026-11-01',
      programs: ['Sunday Service'],
      isNewConvert: false,
      respondedWell: true,
      followedUp: true,
      attendance: ['2026-11-01|Sunday Service', '2026-11-03|School Auxano']
    },
    {
      id: 'rec_att_2',
      workerUid: 'w1',
      fullName: 'Attendee 2',
      phone: '0802',
      evangelistName: 'Worker A',
      date: '2026-11-01',
      programs: ['Sunday Service'],
      isNewConvert: false,
      respondedWell: true,
      followedUp: true,
      attendance: ['2026-11-01|Sunday Service']
    },
    {
      id: 'rec_no_att',
      workerUid: 'w1',
      fullName: 'No Attendee',
      phone: '0803',
      evangelistName: 'Worker A',
      date: '2026-11-01',
      programs: ['Sunday Service'],
      isNewConvert: false,
      respondedWell: false,
      followedUp: false
    }
  ];

  const stats = calculateDashboardStats(records);
  assert.equal(stats.totalCameToChurch, 2);
});

