import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  Edit3,
  Trash2,
  Save,
  AlertCircle,
  FileAudio,
  Download,
  ExternalLink,
  Calendar,
  Clock,
  User,
  Church,
  Send
} from 'lucide-react';
import { EvangelismRecord, ChurchProgram, CHURCH_PROGRAMS } from '../types';
import {
  getTelLink,
  getWhatsAppLink,
  getDirectWhatsAppDmUrl,
  getProgramWhatsAppLink
} from '../utils/phoneUtils';
import { formatDateDisplay, getTodayFormatted } from '../utils/dateUtils';
import { GLM_SERMONS } from '../services/sermonService';
import { WhatsAppIcon } from './BrandIcons';
import { getProgramBadgeStyle } from '../utils/programUtils';

interface RecordDetailModalProps {
  record: EvangelismRecord | null;
  onClose: () => void;
  onUpdateRecord: (id: string, updates: Partial<Omit<EvangelismRecord, 'id'>>) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  onClose,
  onUpdateRecord,
  onDeleteRecord
}) => {
  if (!record || !record.id) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareSermonModal, setShowShareSermonModal] = useState(false);

  // Edit state
  const [fullName, setFullName] = useState(record.fullName);
  const [phone, setPhone] = useState(record.phone);
  const [programs, setPrograms] = useState<(ChurchProgram | string)[]>(record.programs || []);
  const [isNewConvert, setIsNewConvert] = useState(record.isNewConvert);
  const [respondedWell, setRespondedWell] = useState(record.respondedWell);
  const [notes, setNotes] = useState(record.notes || '');
  const [followedUp, setFollowedUp] = useState(record.followedUp);
  const [followUpNotes, setFollowUpNotes] = useState(record.followUpNotes || '');
  const [newWorkerNote, setNewWorkerNote] = useState('');

  const handleToggleProgram = (prog: ChurchProgram) => {
    if (programs.includes(prog)) {
      setPrograms(programs.filter((p) => p !== prog));
    } else {
      setPrograms([...programs, prog]);
    }
  };

  const handleQuickToggleFollowUp = async () => {
    const nextState = !followedUp;
    setFollowedUp(nextState);
    const today = getTodayFormatted();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const appendText = `• [${today} ${time}] Status marked as: ${nextState ? 'Followed up' : 'Pending'}`;
    const updatedNotes = followUpNotes
      ? `${followUpNotes}\n${appendText}`
      : appendText;

    setFollowUpNotes(updatedNotes);
    await onUpdateRecord(record.id!, {
      followedUp: nextState,
      followUpNotes: updatedNotes
    });
  };

  const handleAddFollowUpNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerNote.trim()) return;

    setIsSaving(true);
    const today = getTodayFormatted();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const appendedNotes = followUpNotes
      ? `${followUpNotes}\n• [${today} ${time}] ${newWorkerNote.trim()}`
      : `• [${today} ${time}] ${newWorkerNote.trim()}`;

    setFollowUpNotes(appendedNotes);
    setNewWorkerNote('');

    try {
      await onUpdateRecord(record.id!, {
        followUpNotes: appendedNotes,
        followedUp: true
      });
      setFollowedUp(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateRecord(record.id!, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        programs,
        isNewConvert,
        respondedWell,
        notes: notes.trim(),
        followedUp,
        followUpNotes: followUpNotes.trim()
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await onDeleteRecord(record.id!);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const telLink = getTelLink(phone);
  const waLink = getWhatsAppLink(phone, fullName, record.evangelistName || 'an Evangelist');

  // Parse follow-up notes into timeline events
  const timelineEvents = React.useMemo(() => {
    if (!followUpNotes) return [];
    return followUpNotes
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, idx) => {
        const clean = line.replace(/^[•\-\*]\s*/, '');
        // Check for timestamp pattern like [DD/MM/YYYY HH:mm]
        const match = clean.match(/^\[(.*?)\]\s*(.*)$/);
        if (match) {
          return { id: idx, time: match[1], text: match[2] };
        }
        return { id: idx, time: '', text: clean };
      });
  }, [followUpNotes]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 my-8 max-h-[92vh] overflow-y-auto space-y-5 animate-in fade-in">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900">
                {isEditing ? 'Edit Contact' : fullName}
              </h3>
              {record.isNewConvert && (
                <span className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-rose-600" />
                  <span>New Convert</span>
                </span>
              )}
            </div>
            {/* Recorded by on its own line */}
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Recorded by: <span className="text-slate-900 font-semibold">{record.evangelistName}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Date: <span className="font-medium text-slate-800">{formatDateDisplay(record.date)}</span>
            </p>
          </div>

          <div className="flex items-center gap-1">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Edit Record"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Confirm Delete Record</span>
            </div>
            <p className="text-xs text-slate-700">
              Are you sure you want to delete <strong>{fullName}</strong>'s record? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer min-h-[38px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer min-h-[38px]"
              >
                {isSaving ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        ) : null}

        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSaveFullEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-xl border-slate-300 focus:border-[#0F2744] outline-none min-h-[42px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-xl border-slate-300 focus:border-[#0F2744] outline-none min-h-[42px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Church Programs Invited To</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CHURCH_PROGRAMS.map((prog) => {
                  const isSelected = programs.includes(prog);
                  return (
                    <button
                      type="button"
                      key={prog}
                      onClick={() => handleToggleProgram(prog)}
                      className={`text-xs p-2.5 rounded-xl border font-semibold text-left transition-colors cursor-pointer min-h-[42px] ${
                        isSelected
                          ? 'bg-blue-50 border-[#0F2744] text-[#0F2744]'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {prog}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer min-h-[42px]">
                <input
                  type="checkbox"
                  checked={isNewConvert}
                  onChange={(e) => setIsNewConvert(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                />
                <span className="text-xs font-semibold text-slate-800">New Convert</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer min-h-[42px]">
                <input
                  type="checkbox"
                  checked={respondedWell}
                  onChange={(e) => setRespondedWell(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 accent-amber-600"
                />
                <span className="text-xs font-semibold text-slate-800">Responded Well</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm border rounded-xl border-slate-300 focus:border-[#0F2744] outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-rose-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-4">
            {/* Direct Calling & Two Separate WhatsApp Actions (Android-first responsive grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <a
                href={telLink}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs border border-slate-200 transition-colors min-h-[44px]"
              >
                <Phone className="w-4 h-4 text-slate-600" />
                <span>Call Person</span>
              </a>

              {/* WhatsApp Action */}
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors min-h-[44px]"
                title="WhatsApp: Opens WhatsApp chat with personalized greeting"
              >
                <WhatsAppIcon className="w-4 h-4 flex-shrink-0" />
                <span>WhatsApp</span>
              </a>

              {/* Action B: WhatsApp — Share Sermon File */}
              <button
                type="button"
                onClick={() => setShowShareSermonModal(true)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer min-h-[44px]"
                title="WhatsApp — Share Sermon File: Opens WhatsApp DM with document attachment instructions"
              >
                <FileAudio className="w-4 h-4" />
                <span>WhatsApp — Sermon File</span>
              </button>
            </div>

            {/* Overview Card */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Phone / Contact:</span>
                <span className="font-bold text-slate-900 font-mono">{phone}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Follow-Up Status:</span>
                <button
                  onClick={handleQuickToggleFollowUp}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    followedUp
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                  }`}
                  title="Click to toggle follow-up status"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{followedUp ? 'Followed Up' : 'Mark as Followed Up'}</span>
                </button>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Response:</span>
                <span className={`font-semibold ${record.respondedWell ? 'text-amber-700' : 'text-slate-600'}`}>
                  {record.respondedWell ? 'Responded Warmly / Open' : 'Neutral / Busy'}
                </span>
              </div>

              <div className="py-1">
                <span className="text-slate-500 font-medium block mb-1">Programs Invited To:</span>
                <div className="flex flex-wrap gap-1.5">
                  {record.programs && record.programs.length > 0 ? (
                    record.programs.map((p) => {
                      const progWaLink = getProgramWhatsAppLink(phone, String(p), fullName, record.evangelistName);
                      return (
                        <span
                          key={p}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${getProgramBadgeStyle(String(p))}`}
                        >
                          <span>{p}</span>
                          <a
                            href={progWaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-0.5 rounded transition-opacity hover:opacity-80"
                            title={`Send ${p} invitation via WhatsApp`}
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                          </a>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-slate-400 italic text-xs">No specific program</span>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {record.notes && (
              <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-200/80">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block mb-1">
                  Outreach Notes & Requests
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  "{record.notes}"
                </p>
              </div>
            )}

            {/* Coherent Timeline of Outreach & Follow-Up History */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Outreach & Follow-Up Timeline
              </span>

              <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2">
                {/* Initial Outreach Encounter Node */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-[#0F2744] text-white flex items-center justify-center">
                    <User className="w-2.5 h-2.5" />
                  </div>
                  <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-0.5">
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>Initial Outreach Encounter</span>
                      <span>{formatDateDisplay(record.date)}</span>
                    </div>
                    <p className="text-slate-800 font-semibold">
                      Recorded by {record.evangelistName}
                    </p>
                  </div>
                </div>

                {/* Follow-up Touchpoints */}
                {timelineEvents.length > 0 ? (
                  timelineEvents.map((evt) => (
                    <div key={evt.id} className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </div>
                      <div className="text-xs bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                        {evt.time && (
                          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{evt.time}</span>
                          </div>
                        )}
                        <p className="text-slate-700 leading-relaxed font-sans">
                          {evt.text}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No follow-up touchpoints logged yet. Add your first note below.
                  </p>
                )}
              </div>

              {/* Add Follow-Up Note Form */}
              <form onSubmit={handleAddFollowUpNote} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={newWorkerNote}
                  onChange={(e) => setNewWorkerNote(e.target.value)}
                  placeholder="Log follow-up call, prayer, or church attendance..."
                  className="flex-1 px-3 py-2 text-xs border rounded-xl border-slate-300 focus:border-[#0F2744] outline-none min-h-[42px]"
                />
                <button
                  type="submit"
                  disabled={!newWorkerNote.trim() || isSaving}
                  className="px-4 py-2 text-xs font-bold bg-[#0F2744] hover:bg-[#163861] text-white rounded-xl disabled:opacity-50 cursor-pointer flex-shrink-0 min-h-[42px] transition-colors"
                >
                  Add Note
                </button>
              </form>
            </div>

            {/* Delete button option */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-rose-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp — Share Sermon File Modal (Action B) */}
      {showShareSermonModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-teal-800">
                <FileAudio className="w-5 h-5 flex-shrink-0" />
                <h3 className="font-bold text-base text-slate-900">
                  WhatsApp — Share Sermon File
                </h3>
              </div>
              <button
                onClick={() => setShowShareSermonModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-800">
                Recipient: <span className="text-[#0F2744] font-bold">{fullName}</span> ({phone})
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
                <li>Tap <strong>Open WhatsApp DM</strong> below to open {fullName}'s chat.</li>
                <li>Tap the attachment icon (<strong>📎</strong> or <strong>+</strong>) in WhatsApp.</li>
                <li>Select <strong>Document</strong> (WhatsApp caps audio at 16 MB, but permits Documents up to 2 GB; this sermon is 35.8 MB).</li>
                <li>Choose the sermon audio file (<code>Knowing_God_Apostle_Joseph_Ibrahim.mp3</code>) and send manually.</li>
              </ol>
            </div>

            <div className="pt-2 space-y-2">
              <a
                href={getDirectWhatsAppDmUrl(phone)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareSermonModal(false)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[44px]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>1. Open {fullName}'s WhatsApp DM</span>
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
                onClick={() => setShowShareSermonModal(false)}
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
