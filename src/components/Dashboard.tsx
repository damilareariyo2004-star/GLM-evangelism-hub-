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
  Radio,
  Calendar,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DashboardStats, EvangelismRecord, ChurchProgram } from '../types';
import { downloadRecordsCsv } from '../utils/csvExport';
import { formatDateDisplay } from '../utils/dateUtils';
import { getProgramBadgeStyle } from '../utils/programUtils';

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
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const toggleNoteExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const programsConfig: {
    name: ChurchProgram;
    badgeStyle: string;
  }[] = [
    {
      name: 'Sunday Service',
      badgeStyle: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
      name: 'Wednesday Program/Joint Auxano',
      badgeStyle: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    },
    {
      name: 'Friday Program/Something New',
      badgeStyle: 'text-rose-700 bg-rose-50 border-rose-200'
    },
    {
      name: 'School Auxano',
      badgeStyle: 'text-amber-800 bg-amber-50 border-amber-200'
    }
  ];

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Welcome Banner - Deep Confident Navy Identity */}
      <div className="bg-[#0B1E38] rounded-2xl p-5 sm:p-6 text-white shadow-xs border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
                Gospel Labour Ministry
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-[11px] text-blue-300 font-medium">
                Evangelism Field Hub
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              GLM Evangelism Overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl italic">
              "...the harvest truly is great, but the labourers are few: pray ye therefore the Lord of the harvest..." (Luke 10:2)
            </p>
          </div>

          <button
            onClick={onNavigateToAdd}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-98 flex-shrink-0 cursor-pointer min-h-[44px]"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>+ Record New Soul Met</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid (5 Clean SaaS Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total People Recorded */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Souls Met
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-[#0F2744] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {stats.totalRecords}
            </span>
          </div>
        </div>

        {/* Established Believers */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Established
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Church className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {stats.totalEstablished}
            </span>
          </div>
        </div>

        {/* Total New Converts */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              New Converts
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {stats.totalNewConverts}
            </span>
          </div>
        </div>

        {/* Total Responded Well */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Responded Well
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {stats.totalRespondedWell}
            </span>
          </div>
        </div>

        {/* Follow-Up Completed */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Follow-Up Completed
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {stats.totalFollowedUp}
            </span>
          </div>
        </div>
      </div>

      {/* Program Invitations Section */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Church className="w-5 h-5 text-[#0F2744]" />
            <span>Church Program Invitations</span>
          </h3>
          <button
            onClick={onNavigateToRecords}
            className="text-xs sm:text-sm font-semibold text-[#0F2744] hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View in records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Program cards in exact requested order: Sunday Service, Wednesday Program, Friday Program, School Auxano */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {programsConfig.map((prog) => {
            const count = stats.programCounts[prog.name] || 0;

            return (
              <div
                key={prog.name}
                className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <span className="text-2xl font-bold tracking-tight text-slate-900">
                    {count}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-900 mt-1 leading-snug">
                    {prog.name}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Outreach Encounters & Tools Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Outreach Encounters */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0F2744]" />
                <span>Recent Outreach Encounters</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest souls met during street evangelism</p>
            </div>
            {recentRecords.length > 0 && (
              <button
                onClick={onNavigateToRecords}
                className="text-xs font-semibold text-[#0F2744] hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentRecords.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  No one added yet.
                </p>
                <p className="text-xs text-slate-500">
                  Tap Add Person to begin recording contacts from street outreach.
                </p>
              </div>
              <button
                onClick={onNavigateToAdd}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F2744] hover:bg-[#163861] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer min-h-[40px]"
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
                          <span className="font-bold text-sm text-slate-900 hover:text-[#0F2744]">
                            {rec.fullName}
                          </span>
                          {rec.isNewConvert && (
                            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-rose-600" />
                              <span>New Convert</span>
                            </span>
                          )}
                          {rec.respondedWell && (
                            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                              Responded Well
                            </span>
                          )}
                        </div>

                        {/* Recorded by on its own line */}
                        <div className="text-xs text-slate-600 mt-1 font-medium">
                          Recorded by: <span className="text-slate-900 font-semibold">{rec.evangelistName}</span>
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                          <span>Date: <span className="font-medium text-slate-700">{formatDateDisplay(rec.date)}</span></span>
                          {rec.programs && rec.programs.length > 0 && (
                            <div className="flex flex-wrap gap-1 items-center">
                              {rec.programs.map((p) => (
                                <span
                                  key={p}
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getProgramBadgeStyle(String(p))}`}
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {rec.isEstablished ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                            <Church className="w-3 h-3 text-indigo-700" />
                            <span>Established</span>
                          </span>
                        ) : (
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                              rec.followedUp
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {rec.followedUp ? 'Followed Up' : 'Pending'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Long notes expand */}
                    {rec.notes && (
                      <div className="mt-0.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <p className={!isExpanded && hasLongNotes ? 'line-clamp-2' : ''}>
                          "{rec.notes}"
                        </p>
                        {hasLongNotes && (
                          <button
                            type="button"
                            onClick={(e) => toggleNoteExpand(recId, e)}
                            className="mt-1 text-[11px] font-semibold text-[#0F2744] hover:underline flex items-center gap-0.5 cursor-pointer"
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
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Outreach Tools
            </h3>

            <button
              onClick={onNavigateToAdd}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>Add Person Form</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateToRecords}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 transition-colors cursor-pointer min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#0F2744]" />
                <span>Search & Follow Up</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            {onNavigateToSermons && (
              <button
                onClick={onNavigateToSermons}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-[#0F2744]" />
                  <span>Messages (Telegram & WhatsApp)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
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
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 transition-colors cursor-pointer min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Weekly Outreach Report</span>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                CSV Export
              </span>
            </button>
          </div>

          {/* Ministry Focus Card */}
          <div className="bg-[#0B1E38] text-white rounded-2xl p-5 border border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-200 text-xs font-semibold tracking-wider uppercase">
              <img
                src="/assets/aistudio/IMG-20261015-WA0010_bc047986.jpg"
                alt="GLM Logo"
                className="w-5 h-5 rounded-md bg-white object-contain p-0.5"
              />
              <span>Gospel Labour Ministry</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Equipping labourers for gospel evangelism, outreach discipleship, and continuous follow-up for every soul met.
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Firestore Synced</span>
              </span>
              <span>Online Persistence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
