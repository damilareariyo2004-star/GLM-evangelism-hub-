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
  AlertCircle,
  FileAudio,
  Download,
  ExternalLink,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  EvangelismRecord,
  ChurchProgram,
  CHURCH_PROGRAMS,
  ProgramFilter,
  FollowUpFilter,
  RecordSegment
} from '../types';
import { downloadRecordsCsv } from '../utils/csvExport';
import { getTelLink, getWhatsAppLink, getDirectWhatsAppDmUrl } from '../utils/phoneUtils';
import { formatDateDisplay, compareDatesDesc } from '../utils/dateUtils';
import { GLM_SERMONS } from '../services/sermonService';
import { ExportReportModal } from './ExportReportModal';
import { WhatsAppIcon } from './BrandIcons';
import { getProgramBadgeStyle } from '../utils/programUtils';

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
  // Segment state: Follow-up vs Established
  const [segment, setSegment] = useState<RecordSegment>('follow_up');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<ProgramFilter>('all');
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>('all');
  const [onlyNewConverts, setOnlyNewConverts] = useState(false);
  const [onlyRespondedWell, setOnlyRespondedWell] = useState(false);

  // Weekly Outreach Report Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Expanded notes state
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Delete confirmation state
  const [pendingDeleteRecord, setPendingDeleteRecord] = useState<EvangelismRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Manual WhatsApp Sermon File Sharing modal state (Action B)
  const [shareSermonRecord, setShareSermonRecord] = useState<EvangelismRecord | null>(null);

  const followUpCount = useMemo(() => records.filter((r) => !r.isEstablished).length, [records]);
  const establishedCount = useMemo(() => records.filter((r) => Boolean(r.isEstablished)).length, [records]);

  const toggleNoteExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteRecord || !pendingDeleteRecord.id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteRecord(pendingDeleteRecord.id);
      setPendingDeleteRecord(null);
    } catch (err) {
      console.error('Failed to delete record:', err);
      setDeleteError('Failed to delete record. Please check connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Records (sorted newest first)
  const filteredRecords = useMemo(() => {
    // Partition by segment: Established people leave the Follow-up list
    let result = records.filter((r) => (segment === 'established' ? Boolean(r.isEstablished) : !r.isEstablished));

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

    return result.sort((a, b) => compareDatesDesc(a.date, b.date, a.createdAt, b.createdAt));
  }, [records, segment, searchQuery, selectedProgram, followUpFilter, onlyNewConverts, onlyRespondedWell]);

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

  // Worker sign-in required screen
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center pb-24">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
          <div className="inline-block p-1 rounded-xl bg-white shadow-2xs border border-slate-200 mx-auto">
            <img
              src="/assets/aistudio/IMG-20261015-WA0010_bc047986.jpg"
              alt="Gospel Labor Ministry"
              className="w-14 h-14 rounded-lg object-contain"
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              Church Worker Sign In Required
            </h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Gospel Labor Ministry
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1.5">
              To keep outreach contacts and follow-ups confidential, each worker has a private account. Sign in to view and manage your souls recorded.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              onClick={onOpenAuth}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Lock className="w-4 h-4 text-slate-950" />
              <span>Sign In as Church Worker</span>
            </button>

            <button
              onClick={onNavigateToAdd}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer min-h-[40px]"
            >
              Go to Add Person Form
            </button>
          </div>

          <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100">
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-700 font-bold text-base">
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
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Evangelism Records</span>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
              {filteredRecords.length} {filteredRecords.length === 1 ? 'person' : 'people'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Browse outreach contacts, make follow-up calls, send WhatsApp greetings, or update notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer min-h-[40px]"
              title="Export saved records to CSV with weekly date filters"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Weekly Report</span>
            </button>
          )}

          <button
            onClick={onNavigateToAdd}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-98 cursor-pointer min-h-[40px]"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>+ Add Person</span>
          </button>
        </div>
      </div>

      {/* Segmented Control: Follow-up (n) and Established (n) */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full sm:w-auto self-start shadow-2xs">
        <button
          type="button"
          onClick={() => setSegment('follow_up')}
          className={`flex-1 sm:flex-initial px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
            segment === 'follow_up'
              ? 'bg-white text-[#0F2744] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Follow-up</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              segment === 'follow_up'
                ? 'bg-blue-100 text-[#0F2744]'
                : 'bg-slate-300 text-slate-700'
            }`}
          >
            {followUpCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSegment('established')}
          className={`flex-1 sm:flex-initial px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
            segment === 'established'
              ? 'bg-white text-purple-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Established</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              segment === 'established'
                ? 'bg-purple-100 text-purple-900'
                : 'bg-slate-300 text-slate-700'
            }`}
          >
            {establishedCount}
          </span>
        </button>
      </div>

      {/* Delete Error Alert */}
      {deleteError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span className="font-medium">{deleteError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="text-rose-700 font-bold hover:underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search and Filters Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or phone"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-[#0F2744] focus:ring-1 focus:ring-[#0F2744] text-xs sm:text-sm text-slate-900 outline-none bg-slate-50/50 focus:bg-white transition-all min-h-[42px]"
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
          {/* Program Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Program:</span>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value as ProgramFilter)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold outline-none cursor-pointer focus:border-[#0F2744]"
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
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={followUpFilter}
              onChange={(e) => setFollowUpFilter(e.target.value as FollowUpFilter)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold outline-none cursor-pointer focus:border-[#0F2744]"
            >
              <option value="all">All Status</option>
              <option value="followed_up">Followed Up</option>
              <option value="not_followed_up">Pending Follow-up</option>
            </select>
          </div>

          {/* New Convert Toggle Button */}
          <button
            onClick={() => setOnlyNewConverts(!onlyNewConverts)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer border ${
              onlyNewConverts
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>New Converts</span>
          </button>

          {/* Responded Well Toggle Button */}
          <button
            onClick={() => setOnlyRespondedWell(!onlyRespondedWell)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer border ${
              onlyRespondedWell
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
            <span>Responded Well</span>
          </button>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="ml-auto text-[#0F2744] hover:underline font-semibold cursor-pointer"
            >
              Reset Filters ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* Empty State / Records List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200/90 text-center space-y-3">
          {records.length === 0 ? (
            <>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#0F2744] flex items-center justify-center mx-auto">
                <UserPlus className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-slate-900">No one added yet.</p>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Tap Add Person to begin recording contacts from street evangelism.
              </p>
              <button
                onClick={onNavigateToAdd}
                className="mt-3 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs min-h-[44px]"
              >
                + Add Person
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-900">No records found matching your search.</p>
              <button
                onClick={clearAllFilters}
                className="mt-2 text-xs font-semibold text-[#0F2744] hover:underline cursor-pointer"
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
            const waLink = getWhatsAppLink(
              rec.phone,
              rec.fullName,
              rec.evangelistName || currentUser?.displayName || 'an Evangelist'
            );
            const isExpanded = !!expandedNotes[recId];
            const hasLongNotes = (rec.notes?.length || 0) > 100;

            return (
              <div
                key={recId}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-4 sm:p-5 space-y-3"
              >
                {/* Header row with Name, phone, and quick actions */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div
                    onClick={() => onSelectRecord(rec)}
                    className="cursor-pointer group flex-1"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-[#0F2744] transition-colors">
                        {rec.fullName}
                      </h3>
                      {rec.isNewConvert && (
                        <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold px-2 py-0.2 rounded flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-rose-600" />
                          <span>New Convert</span>
                        </span>
                      )}
                      {rec.respondedWell && (
                        <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold px-2 py-0.2 rounded">
                          Responded Well
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          rec.followedUp
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {rec.followedUp ? 'Followed Up' : 'Pending'}
                      </span>
                      {rec.isEstablished && (
                        <span className="bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold px-2 py-0.2 rounded">
                          Established
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-700 mt-1 font-mono">
                      {rec.phone}
                    </p>
                  </div>

                  {/* Actions: Call, Action A: WhatsApp — Send Message, Action B: WhatsApp — Share Sermon File, Delete, Details */}
                  <div className="flex items-center gap-1.5 pt-1 sm:pt-0 flex-shrink-0 flex-wrap">
                    <a
                      href={telLink}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
                      title="Direct Phone Call"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      <span>Call</span>
                    </a>

                    {/* WhatsApp Action: Official logo + short label 'WhatsApp' */}
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
                      title="WhatsApp: Opens WhatsApp chat with personalized greeting"
                    >
                      <WhatsAppIcon className="w-4 h-4 flex-shrink-0" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Action B: WhatsApp — Share Sermon File */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareSermonRecord(rec);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
                      title="WhatsApp — Share Sermon File: Opens WhatsApp DM with document attachment instructions"
                    >
                      <FileAudio className="w-3.5 h-3.5 text-teal-600" />
                      <span>WhatsApp — Share Sermon File</span>
                    </button>

                    {/* Delete button with confirmation */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteRecord(rec);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onSelectRecord(rec)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="View full details and notes"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Programs, Recorded by, and Date */}
                <div
                  onClick={() => onSelectRecord(rec)}
                  className="cursor-pointer space-y-2 pt-2 border-t border-slate-100 text-xs"
                >
                  {/* Programs Invited */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 font-medium mr-1">Invited to:</span>
                    {rec.programs && rec.programs.length > 0 ? (
                      rec.programs.map((p) => (
                        <span
                          key={p}
                          className={`rounded-full px-2.5 py-0.5 font-medium text-[11px] ${getProgramBadgeStyle(String(p))}`}
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
                          className="mt-1 text-[11px] font-semibold text-[#0F2744] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Show less' : 'Read more'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Recorded by and Date on own lines */}
                  <div className="space-y-0.5 pt-1 text-slate-600">
                    <div>
                      Recorded by: <span className="font-semibold text-slate-900">{rec.evangelistName}</span>
                    </div>
                    <div>
                      Date: <span className="font-medium text-slate-800">{formatDateDisplay(rec.date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        records={records}
      />

      {/* WhatsApp — Share Sermon File Modal (Action B) */}
      {shareSermonRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-teal-800">
                <FileAudio className="w-5 h-5 flex-shrink-0" />
                <h3 className="font-bold text-base text-slate-900">
                  WhatsApp — Share Sermon File
                </h3>
              </div>
              <button
                onClick={() => setShareSermonRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-800">
                Recipient: <span className="text-[#0F2744] font-bold">{shareSermonRecord.fullName}</span> ({shareSermonRecord.phone})
              </div>
              <div className="text-slate-600 font-medium">
                Sermon: Knowing God — Apostle Joseph Ibrahim (35.8 MB MP3)
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p className="font-bold text-slate-900">
                Manual Document Attachment Instructions:
              </p>
              <ol className="space-y-1.5 list-decimal list-inside bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
                <li>Tap <strong>Open WhatsApp DM</strong> below to open {shareSermonRecord.fullName}'s chat.</li>
                <li>Tap the attachment icon (<strong>📎</strong> or <strong>+</strong>) in WhatsApp.</li>
                <li>Select <strong>Document</strong> (WhatsApp caps audio at 16 MB, but permits Documents up to 2 GB; this sermon is 35.8 MB).</li>
                <li>Choose the sermon audio file (<code>Knowing_God_Apostle_Joseph_Ibrahim.mp3</code>) and send manually.</li>
              </ol>
            </div>

            <div className="pt-2 space-y-2">
              <a
                href={getDirectWhatsAppDmUrl(shareSermonRecord.phone)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareSermonRecord(null)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[44px]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>1. Open {shareSermonRecord.fullName}'s WhatsApp DM</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <a
                href={GLM_SERMONS[0]?.audioUrl || '/assets/aistudio/Knowing_God_2babf39d.mp3'}
                download="Knowing_God_Apostle_Joseph_Ibrahim.mp3"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-2 transition-colors min-h-[40px]"
                title="Download MP3 file if not yet stored on your phone"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download Sermon MP3 (Save to Phone if needed)</span>
              </a>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setShareSermonRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
