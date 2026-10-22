export type ChurchProgram = 
  | 'Wednesday Program'
  | 'Friday Program'
  | 'Auxano'
  | 'Sunday Service';

export const CHURCH_PROGRAMS: ChurchProgram[] = [
  'Wednesday Program',
  'Friday Program',
  'Auxano',
  'Sunday Service'
];

export interface EvangelismRecord {
  id?: string;
  fullName: string;
  phone: string;
  programs: ChurchProgram[];
  isNewConvert: boolean;
  respondedWell: boolean;
  notes?: string;
  evangelistName: string;
  date: string; // YYYY-MM-DD
  followedUp: boolean;
  followUpNotes?: string;
  createdAt?: string; // ISO string or timestamp
  updatedAt?: string;
}

export type ProgramFilter = 'all' | ChurchProgram;
export type FollowUpFilter = 'all' | 'followed_up' | 'not_followed_up';
export type ConvertFilter = 'all' | 'new_converts';
export type RespondedFilter = 'all' | 'responded_well';

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
  programCounts: Record<ChurchProgram, number>;
}
