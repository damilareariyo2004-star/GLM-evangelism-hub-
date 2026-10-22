import React, { useState, useMemo } from 'react';
import {
  Search,
  FileSpreadsheet,
  Phone,
  MessageCircle,
  Sparkles,
  HeartHandshake,
  UserPlus,
  Lock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  EvangelismRecord,
  ChurchProgram,
  CHURCH_PROGRAMS,
  ProgramFilter,
  FollowUpFilter
} from '../types';
import { downloadRecordsCsv } from '../utils/csvExport';
import { getTelLink, getWhatsAppLink } from '../utils/phoneUtils';
import { formatDateDisplay } from '../utils/dateUtils';

interface RecordsListProps {
  records: EvangelismRecord[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onSelectRecord: (record: EvangelismRecord) => void;
  onNavigateToAdd: () => void;
  onUpdateRecord: (id: string, updates: Partial<Omit<EvangelismRecord, 'id' | 'workerUid'>>) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
}

export const RecordsList: React.FC<RecordsListProps> = ({
  records,
  currentUser,
  onOpenAuth,
  onSelectRecord,
  onNavigateToAdd,
  onDeleteRecord
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<ProgramFilter>('all');
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>('all');
  const [onlyNewConverts, setOnlyNewConverts] = useState(false);
  const [onlyRespondedWell, setOnlyRespondedWell] = useState(false);

  // Expanded notes state (for "Read more" / "Show less")
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Delete confirmation state
  const [pendingDeleteRecord, setPendingDeleteRecord] = useState<EvangelismRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleNoteExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteRecord || !pendingDeleteRecord.id) return;
    setIsDeleting(true);
    try {
      await onDeleteRecord(pendingDeleteRecord.id);
      setPendingDeleteRecord(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Records (sorted newest first)
  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.evangelistName.toLowerCase().includes(q)
      );
    }

    if (selectedProgram !== 'all') {
      result = result.filter((r) => Array.isArray(r.programs) && r.programs.includes(selectedProgram));
    }

    if (followUpFilter === 'followed_up') {
      result = result.filter((r) => r.followedUp);
    } else if (followUpFilter === 'not_followed_up') {
      result = result.filter((r) => !r.followedUp);
    }

    if (onlyNewConverts) {
      result = result.filter((r) => r.isNewConvert);
    }

    if (onlyRespondedWell) {
      result = result.filter((r) => r.respondedWell);
    }

    return result.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [records, searchQuery, selectedProgram, followUpFilter, onlyNewConverts, onlyRespondedWell]);

  const activeFiltersCount =
    (selectedProgram !== 'all' ? 1 : 0) +
    (followUpFilter !== 'all' ? 1 : 0) +
    (onlyNewConverts ? 1 : 0) +
    (onlyRespondedWell ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedProgram('all');
    setFollowUpFilter('all');
    setOnlyNewConverts(false);
    setOnlyRespondedWell(false);
  };

  // If worker access is not signed in, show church worker login screen
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-8 px-4 text-center pb-24">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5">
          <div className="inline-block p-1 rounded-full bg-white shadow-md border-2 border-red-500 mx-auto">
            <img
              src="/assets/aistudio/IMG-20261015-WA0010_bc047986.jpg"
              alt="Gospel Labor Ministry"
              className="w-16 h-16 rounded-full object-contain"
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#1E5AA8]">
              Church Worker Sign In Required
            </h2>
            <p className="text-xs font-bold text-[#E02020] uppercase tracking-wider">
              Gospel Labor Ministry
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
              To keep outreach contacts and follow-ups confidential, each evangelism worker has a private account. Sign in to view and manage your souls recorded.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              onClick={onOpenAuth}
              className="w-full py-3.5 px-4 rounded-xl bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer border border-orange-300 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-slate-950" />
              <span>Sign In as Church Worker</span>
            </button>

            <button
              onClick={onNavigateToAdd}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Go to Add Person Form
            </button>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Records are strictly isolated per worker — you will only ever see contacts that you recorded.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:pb-12 max-w-5xl mx-auto">
      {/* Delete Confirmation Dialog Modal */}
      {pendingDeleteRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-red-300 space-y-4">
            <div className="flex items-center gap-2.5 text-[#E02020] font-black text-base">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Confirm Delete Record</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Are you sure you want to permanently delete <strong>{pendingDeleteRecord.fullName}</strong> ({pendingDeleteRecord.phone}) from the database? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingDeleteRecord(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-black bg-[#E02020] hover:bg-[#C51616] text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E5AA8] flex items-center gap-2">
            <span>Evangelism Records</span>
            <span className="text-xs font-bold bg-blue-100 text-[#1E5AA8] px-2 py-0.5 rounded-full">
              {filteredRecords.length} {filteredRecords.length === 1 ? 'person' : 'people'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Browse contacts, make follow-up calls, send WhatsApp greetings, or update notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              onClick={() => downloadRecordsCsv(filteredRecords)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
              title="Download CSV for Excel or Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={onNavigateToAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 text-xs sm:text-sm font-black shadow-xs transition-all active:scale-98 cursor-pointer border border-orange-300"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>+ Add Person</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        {/* Search Bar - Requirement 5: placeholder "Search name or phone" */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or phone"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-[#1E5AA8] focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm text-slate-900 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Program Select - Full text, never truncated */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-semibold">Program:</span>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value as ProgramFilter)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold outline-none cursor-pointer focus:border-[#1E5AA8]"
            >
              <option value="all">All Programs</option>
              {CHURCH_PROGRAMS.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          </div>

          {/* Follow Up Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-semibold">Status:</span>
            <select
              value={followUpFilter}
              onChange={(e) => setFollowUpFilter(e.target.value as FollowUpFilter)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold outline-none cursor-pointer focus:border-[#1E5AA8]"
            >
              <option value="all">All Status</option>
              <option value="followed_up">Followed Up</option>
              <option value="not_followed_up">Pending Follow-up</option>
            </select>
          </div>

          {/* New Convert Toggle Pill */}
          <button
            onClick={() => setOnlyNewConverts(!onlyNewConverts)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer border ${
              onlyNewConverts
                ? 'bg-red-100 border-[#E02020] text-[#E02020] shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E02020]" />
            <span>New Converts</span>
          </button>

          {/* Responded Well Toggle Pill */}
          <button
            onClick={() => setOnlyRespondedWell(!onlyRespondedWell)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer border ${
              onlyRespondedWell
                ? 'bg-orange-100 border-[#F7931E] text-[#E07F0E] shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-[#F7931E]" />
            <span>Responded Well</span>
          </button>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="ml-auto text-[#1E5AA8] hover:underline font-bold cursor-pointer"
            >
              Reset Filters ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* Empty State / Records List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
          {records.length === 0 ? (
            /* Requirement 1: "No one added yet. Tap Add Person to begin." */
            <>
              <div className="w-14 h-14 rounded-full bg-blue-50 text-[#1E5AA8] flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                <UserPlus className="w-7 h-7" />
              </div>
              <p className="text-base font-black text-slate-800">No one added yet.</p>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Tap Add Person to begin recording contacts from street evangelism.
              </p>
              <button
                onClick={onNavigateToAdd}
                className="mt-3 px-5 py-2.5 bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 font-black text-xs sm:text-sm rounded-xl cursor-pointer border border-orange-300 shadow-xs"
              >
                + Add Person
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-800">No records found matching your search.</p>
              <button
                onClick={clearAllFilters}
                className="mt-2 text-xs font-bold text-[#1E5AA8] hover:underline cursor-pointer"
              >
                Clear all active filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((rec) => {
            const recId = rec.id || rec.phone;
            const telLink = getTelLink(rec.phone);
            const waLink = getWhatsAppLink(rec.phone, rec.fullName);
            const isExpanded = !!expandedNotes[recId];
            const hasLongNotes = (rec.notes?.length || 0) > 100;

            return (
              <div
                key={recId}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#1E5AA8]/50 hover:shadow-sm transition-all p-4 sm:p-5 space-y-3"
              >
                {/* Header row with Name, phone, and quick actions */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div
                    onClick={() => onSelectRecord(rec)}
                    className="cursor-pointer group flex-1"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-base sm:text-lg text-[#1E5AA8] group-hover:text-[#15427D] transition-colors">
                        {rec.fullName}
                      </h3>
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
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          rec.followedUp
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rec.followedUp ? 'Followed Up' : 'Pending'}
                      </span>
                    </div>

                    <p className="text-xs font-extrabold text-slate-900 mt-1">
                      {rec.phone}
                    </p>
                  </div>

                  {/* Actions: Call, WhatsApp, Delete, Details */}
                  <div className="flex items-center gap-2 pt-1 sm:pt-0 flex-shrink-0">
                    <a
                      href={telLink}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E5AA8] border border-blue-200 text-xs font-bold transition-colors cursor-pointer"
                      title="Direct Phone Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                      title="Direct WhatsApp with 234 international number"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Delete button with confirmation */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteRecord(rec);
                      }}
                      className="p-1.5 text-slate-400 hover:text-[#E02020] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onSelectRecord(rec)}
                      className="p-1.5 text-slate-400 hover:text-[#1E5AA8] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="View full details and notes"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Programs, Recorded by (on its own line), and Date in DD/MM/YYYY */}
                <div
                  onClick={() => onSelectRecord(rec)}
                  className="cursor-pointer space-y-2 pt-1 border-t border-slate-100 text-xs"
                >
                  {/* Programs Invited - Full text, no truncation */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 font-semibold mr-1">Invited to:</span>
                    {rec.programs && rec.programs.length > 0 ? (
                      rec.programs.map((p) => (
                        <span
                          key={p}
                          className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px]"
                        >
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No program specified</span>
                    )}
                  </div>

                  {/* Notes with "Read more" / "Show less" */}
                  {rec.notes && (
                    <div className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
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

                  {/* Requirement 5: Put "Recorded by" on its own line */}
                  <div className="space-y-0.5 pt-1 text-slate-600">
                    <div>
                      Recorded by: <span className="font-bold text-slate-900">{rec.evangelistName}</span>
                    </div>
                    <div>
                      Date: <span className="font-semibold text-slate-800">{formatDateDisplay(rec.date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
