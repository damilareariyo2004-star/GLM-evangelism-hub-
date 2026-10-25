export type ChurchProgram = 
  | 'Sunday Service'
  | 'Wednesday Program/Joint Auxano'
  | 'Friday Program/Something New'
  | 'School Auxano';

export const CHURCH_PROGRAMS: ChurchProgram[] = [
  'Sunday Service',
  'Wednesday Program/Joint Auxano',
  'Friday Program/Something New',
  'School Auxano'
];

export interface EvangelismRecord {
  id?: string;
  workerUid: string;
  workerEmail?: string;
  fullName: string;
  phone: string;
  programs: (ChurchProgram | string)[];
  isNewConvert: boolean;
  respondedWell: boolean;
  notes?: string;
  evangelistName: string;
  date: string; // DD/MM/YYYY or YYYY-MM-DD
  followedUp: boolean;
  isEstablished?: boolean;
  establishedAt?: string;
  followUpNotes?: string;
  createdAt?: string; // ISO string or timestamp
  updatedAt?: string;
}

export type ProgramFilter = 'all' | ChurchProgram;
export type FollowUpFilter = 'all' | 'followed_up' | 'not_followed_up';
export type ConvertFilter = 'all' | 'new_converts';
export type RespondedFilter = 'all' | 'responded_well';
export type RecordSegment = 'follow_up' | 'established';

export interface FilterState {
  searchQuery: string;
  program: ProgramFilter;
  followUp: FollowUpFilter;
  onlyNewConverts: boolean;
  onlyRespondedWell: boolean;
  evangelist: string;
}

export interface DashboardStats {
  totalRecords: number;
  totalNewConverts: number;
  totalRespondedWell: number;
  totalFollowedUp: number;
  totalEstablished: number;
  pendingFollowUp: number;
  programCounts: Record<ChurchProgram, number>;
}

export type AdminTab = 'overview' | 'workers' | 'all_records';

export interface WorkerSummary {
  workerUid: string;
  workerEmail: string;
  workerName: string;
  totalRecorded: number;
  recordedThisWeek: number;
  newConverts: number;
  followedUpCount: number;
  followedUpPercent: number;
  establishedCount: number;
  lastRecordedDate: string;
  lastRecordedYmd: string;
  isActive: boolean;
}

export type DateRangePreset = 'all' | 'this_week' | 'last_7_days' | 'this_month' | 'custom';

export interface DateRangeFilter {
  preset: DateRangePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface RemovedWorker {
  workerUid: string;
  workerEmail?: string;
  workerName?: string;
  removedAt: string; // ISO string
  removedBy?: string;
}

export interface Sermon {
  id: string;
  title: string;
  series?: string;
  minister: string;
  speaker?: string; // Backwards compatibility alias
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  scripture?: string;
  duration?: string; // e.g. "1:29:59"
  durationFormatted?: string; // e.g. "1:29:59"
  description: string;
  channelUrl: string; // e.g. https://t.me/glmchannel
  postUrl: string; // e.g. https://t.me/glmchannel/1331
  telegramPostUrl: string; // Backwards compatibility alias
  audioUrl?: string; // Direct audio download/streaming link
  audioFileName?: string; // Sanitized file name for download
  audioSizeFormatted?: string; // e.g. "35.8 MB"
  tags: string[];
}

