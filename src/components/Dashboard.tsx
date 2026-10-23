import React, { useState } from 'react';
import {
  Users,
  Sparkles,
  HeartHandshake,
  UserPlus,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Church,
  Clock,
  ChevronDown,
  ChevronUp,
  Radio
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DashboardStats, EvangelismRecord, ChurchProgram } from '../types';
import { downloadRecordsCsv } from '../utils/csvExport';
import { formatDateDisplay } from '../utils/dateUtils';

interface DashboardProps {
  stats: DashboardStats;
  recentRecords: EvangelismRecord[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onNavigateToAdd: () => void;
  onNavigateToRecords: () => void;
  onNavigateToSermons?: () => void;
  onOpenExportModal?: () => void;
  onSelectRecord: (record: EvangelismRecord) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentRecords,
  currentUser,
  onOpenAuth,
  onNavigateToAdd,
  onNavigateToRecords,
  onNavigateToSermons,
  onOpenExportModal,
  onSelectRecord
}) => {
  // State to track expanded note IDs
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const toggleNoteExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const programsConfig: {
    name: ChurchProgram;
    border: string;
    bg: string;
    badgeColor: string;
    description: string;
  }[] = [
    {
      name: 'Sunday Service',
      border: 'border-blue-200',
      bg: 'bg-blue-50/60',
      badgeColor: 'text-[#1E5AA8]',
      description: 'Glorious Worship & Word Service'
    },
    {
      name: 'Wednesday Program/Joint Auxano',
      border: 'border-blue-200',
      bg: 'bg-blue-50/60',
      badgeColor: 'text-[#1E5AA8]',
      description: 'Mid-week Word & Prayer Intensive'
    },
    {
      name: 'Friday Program/Something New',
      border: 'border-red-200',
      bg: 'bg-red-50/50',
      badgeColor: 'text-[#E02020]',
      description: 'Revival, Prayer & Breakthrough Night'
    },
    {
      name: 'School Auxano',
      border: 'border-orange-300',
      bg: 'bg-orange-50/70',
      badgeColor: 'text-[#F7931E]',
      description: 'Campus Discipleship & Training'
    }
  ];

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#15427D] via-[#1E5AA8] to-[#15427D] rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden border-l-4 border-[#E02020]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <img
                src="/assets/aistudio/IMG-20261015-WA0010_bc047986.jpg"
                alt="GLM Logo"
                className="w-8 h-8 rounded-full bg-white p-0.5 object-contain"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-200">
                Gospel Labor Ministry
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              GLM Evangelism Hub
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl italic">
              "The harvest truly is great, but the laborers are few: pray ye therefore the Lord of the harvest..." — Luke 10:2
            </p>
          </div>

          <button
            onClick={onNavigateToAdd}
            className="flex items-center gap-2 bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 font-extrabold text-sm px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex-shrink-0 cursor-pointer border border-orange-300"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>+ Record New Soul Met</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total People Recorded */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Souls Met
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E5AA8] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1E5AA8]">
              {stats.totalRecords}
            </span>
            <span className="text-xs text-slate-500 font-medium">contacts</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Recorded during evangelism</p>
        </div>

        {/* Total New Converts */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-red-200 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E02020] uppercase tracking-wider">
              New Converts
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#E02020] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#E02020]">
              {stats.totalNewConverts}
            </span>
            <span className="text-xs text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded-full">
              Salvation
            </span>
          </div>
          <p className="mt-1 text-xs text-red-700/80 font-medium">Gave life to Christ Jesus</p>
        </div>

        {/* Total Responded Well */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-orange-200 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E07F0E] uppercase tracking-wider">
              Responded Well
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F7931E] flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#E07F0E]">
              {stats.totalRespondedWell}
            </span>
            <span className="text-xs text-slate-500 font-medium">receptive</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Warm & open to the gospel</p>
        </div>

        {/* Followed Up Completed */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Follow-Up Completed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              {stats.totalFollowedUp}
            </span>
            <span className="text-xs text-slate-500 font-medium">followed up</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Worker follow-up contacts</p>
        </div>
      </div>

      {/* Program Invitations Breakdown (COUNTS ONLY, NO PERCENTAGES) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1E5AA8] flex items-center gap-2">
              <Church className="w-5 h-5 text-[#E02020]" />
              Church Program Invitations
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Total number of people invited to Gospel Labor Ministry services and programs
            </p>
          </div>
          <button
            onClick={onNavigateToRecords}
            className="text-xs sm:text-sm font-bold text-[#1E5AA8] hover:text-[#15427D] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View in records</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#E02020]" />
          </button>
        </div>

        {/* 4 Program cards - counts only, full program names without truncation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {programsConfig.map((prog) => {
            const count = stats.programCounts[prog.name] || 0;

            return (
              <div
                key={prog.name}
                className={`${prog.bg} border ${prog.border} rounded-xl p-4 transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                      {prog.name}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {prog.description}
                    </p>
                  </div>
                  <span className={`text-2xl font-black ${prog.badgeColor} flex-shrink-0`}>
                    {count}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Total Invited:</span>
                  <span className={`font-bold ${prog.badgeColor}`}>{count} {count === 1 ? 'person' : 'people'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Outreach Encounters & Tools Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Outreach Encounters */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#1E5AA8] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E02020]" />
                Recent Outreach Encounters
              </h3>
              <p className="text-xs text-slate-500">Latest people met during evangelism</p>
            </div>
            {recentRecords.length > 0 && (
              <button
                onClick={onNavigateToRecords}
                className="text-xs font-bold text-[#1E5AA8] hover:text-[#15427D] flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#E02020]" />
              </button>
            )}
          </div>

          {recentRecords.length === 0 ? (
            /* Friendly Empty State as requested: "No one added yet. Tap Add Person to begin." */
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 space-y-3">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-[#1E5AA8] flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  No one added yet.
                </p>
                <p className="text-xs text-slate-500">
                  Tap Add Person to begin recording contacts from outreach.
                </p>
              </div>
              <button
                onClick={onNavigateToAdd}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Person</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentRecords.slice(0, 4).map((rec) => {
                const recId = rec.id || rec.phone;
                const isExpanded = !!expandedNotes[recId];
                const hasLongNotes = (rec.notes?.length || 0) > 90;

                return (
                  <div
                    key={recId}
                    onClick={() => onSelectRecord(rec)}
                    className="py-3.5 flex flex-col gap-2 hover:bg-slate-50/80 -mx-2 px-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#1E5AA8]">
                            {rec.fullName}
                          </span>
                          {rec.isNewConvert && (
                            <span className="bg-red-100 text-[#E02020] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-[#E02020]" />
                              New Convert
                            </span>
                          )}
                          {rec.respondedWell && (
                            <span className="bg-orange-100 text-[#E07F0E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Responded Well
                            </span>
                          )}
                        </div>

                        {/* Requirement 5: Put "Recorded by" on its own line */}
                        <div className="text-xs text-slate-600 mt-1 font-medium">
                          Recorded by: <span className="font-bold text-slate-800">{rec.evangelistName}</span>
                        </div>

                        <div className="text-xs text-slate-500 mt-0.5">
                          Date: <span className="font-semibold text-slate-700">{formatDateDisplay(rec.date)}</span>
                          {rec.programs && rec.programs.length > 0 && (
                            <>
                              <span className="mx-1.5">•</span>
                              <span>Invited to: {rec.programs.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                            rec.followedUp
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-orange-50 text-[#E07F0E] border border-orange-200'
                          }`}
                        >
                          {rec.followedUp ? 'Followed Up' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Requirement 5: Let long notes expand with "Read more" */}
                    {rec.notes && (
                      <div className="mt-0.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <p className={!isExpanded && hasLongNotes ? 'line-clamp-2' : ''}>
                          "{rec.notes}"
                        </p>
                        {hasLongNotes && (
                          <button
                            type="button"
                            onClick={(e) => toggleNoteExpand(recId, e)}
                            className="mt-1 text-[11px] font-bold text-[#1E5AA8] hover:text-[#15427D] flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Show less' : 'Read more'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Worker Tools & Ministry Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#1E5AA8] uppercase tracking-wider">
              Outreach Tools
            </h3>

            <button
              onClick={onNavigateToAdd}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 font-extrabold text-sm shadow-xs transition-colors cursor-pointer border border-orange-300"
            >
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>Add Person Form</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateToRecords}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E5AA8] font-bold text-sm transition-colors cursor-pointer border border-blue-200"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#E02020]" />
                <span>Search & Follow Up</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onNavigateToSermons && (
              <button
                onClick={onNavigateToSermons}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-[#E02020] font-bold text-sm transition-colors cursor-pointer border border-red-200"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-[#E02020]" />
                  <span>Telegram Message Library</span>
                </div>
                <span className="text-xs bg-red-100 text-[#E02020] px-2 py-0.5 rounded-full font-bold">
                  t.me/glmchannel
                </span>
              </button>
            )}

            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth();
                } else if (onOpenExportModal) {
                  onOpenExportModal();
                } else {
                  downloadRecordsCsv(recentRecords);
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-sm transition-colors cursor-pointer bg-white"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Weekly Outreach Report</span>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                CSV Export
              </span>
            </button>
          </div>

          {/* Ministry Focus Card */}
          <div className="bg-gradient-to-br from-[#15427D] to-[#1E5AA8] text-white rounded-2xl p-5 border border-red-500/30">
            <div className="flex items-center gap-2 text-orange-300 text-xs font-bold uppercase tracking-wider mb-2">
              <img
                src="/assets/aistudio/IMG-20261015-WA0010_bc047986.jpg"
                alt="GLM Logo"
                className="w-5 h-5 rounded-full bg-white object-contain p-0.5"
              />
              <span>Gospel Labor Ministry</span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Equipping laborers for gospel evangelism, outreach discipleship, and continuous follow-up for every soul met.
            </p>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-orange-200 font-medium">
              <span>Cloud Firestore Synced</span>
              <span>Online Persistence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
