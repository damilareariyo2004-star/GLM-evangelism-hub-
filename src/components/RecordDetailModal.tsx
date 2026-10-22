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
  AlertCircle
} from 'lucide-react';
import { EvangelismRecord, ChurchProgram, CHURCH_PROGRAMS } from '../types';
import { getTelLink, getWhatsAppLink } from '../utils/phoneUtils';
import { formatDateDisplay, getTodayFormatted } from '../utils/dateUtils';

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

  // Edit state
  const [fullName, setFullName] = useState(record.fullName);
  const [phone, setPhone] = useState(record.phone);
  const [programs, setPrograms] = useState<ChurchProgram[]>(record.programs || []);
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
    await onUpdateRecord(record.id!, {
      followedUp: nextState,
      followUpNotes:
        followUpNotes +
        (followUpNotes ? '\n' : '') +
        `• [${today}] Status updated to: ${nextState ? 'Followed up' : 'Pending'}`
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
  const waLink = getWhatsAppLink(phone, fullName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-black text-[#1E5AA8]">
                {isEditing ? 'Edit Contact' : fullName}
              </h3>
              {record.isNewConvert && (
                <span className="bg-red-100 text-[#E02020] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#E02020]" />
                  New Convert
                </span>
              )}
            </div>
            {/* Requirement 5: Recorded by on its own line */}
            <p className="text-xs text-slate-700 mt-1 font-semibold">
              Recorded by: <span className="text-[#1E5AA8] font-bold">{record.evangelistName}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Date: <span className="font-semibold text-slate-700">{formatDateDisplay(record.date)}</span>
            </p>
          </div>

          <div className="flex items-center gap-1">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-slate-500 hover:text-[#1E5AA8] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Edit Record"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert (Requirement 9) */}
        {showDeleteConfirm ? (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-[#E02020] font-black text-sm">
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
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold bg-[#E02020] hover:bg-[#C51616] text-white rounded-xl shadow-xs cursor-pointer"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-xl border-slate-300 focus:border-[#1E5AA8] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-xl border-slate-300 focus:border-[#1E5AA8] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Church Programs Invited To</label>
              <div className="grid grid-cols-2 gap-2">
                {CHURCH_PROGRAMS.map((prog) => {
                  const isSelected = programs.includes(prog);
                  return (
                    <button
                      type="button"
                      key={prog}
                      onClick={() => handleToggleProgram(prog)}
                      className={`text-xs p-2.5 rounded-xl border font-bold text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-[#1E5AA8] text-[#1E5AA8]'
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
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewConvert}
                  onChange={(e) => setIsNewConvert(e.target.checked)}
                  className="rounded text-[#E02020] focus:ring-red-500 accent-[#E02020]"
                />
                <span className="text-xs font-bold text-slate-800">New Convert</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={respondedWell}
                  onChange={(e) => setRespondedWell(e.target.checked)}
                  className="rounded text-[#F7931E] focus:ring-orange-500 accent-[#F7931E]"
                />
                <span className="text-xs font-bold text-slate-800">Responded Well</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm border rounded-xl border-slate-300 focus:border-[#1E5AA8] outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-[#E02020] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-extrabold bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer border border-orange-300"
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
            {/* Direct Calling & WhatsApp Bar */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={telLink}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1E5AA8] hover:bg-[#15427D] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call Person</span>
              </a>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
                title="Open WhatsApp with Nigerian 234 international number"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Overview Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Phone / Contact:</span>
                <span className="font-extrabold text-[#1E5AA8]">{phone}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Follow-Up Status:</span>
                <button
                  onClick={handleQuickToggleFollowUp}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    followedUp
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                      : 'bg-orange-100 text-[#E07F0E] border border-orange-300 hover:bg-orange-200'
                  }`}
                  title="Click to toggle follow-up status"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{followedUp ? 'Followed Up' : 'Mark as Followed Up'}</span>
                </button>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Response:</span>
                <span className={`font-bold ${record.respondedWell ? 'text-[#E07F0E]' : 'text-slate-600'}`}>
                  {record.respondedWell ? 'Responded Warmly / Well' : 'Neutral / Busy'}
                </span>
              </div>

              <div className="py-1">
                <span className="text-slate-500 font-semibold block mb-1">Programs Invited To:</span>
                <div className="flex flex-wrap gap-1.5">
                  {record.programs && record.programs.length > 0 ? (
                    record.programs.map((p) => (
                      <span
                        key={p}
                        className="text-xs font-bold bg-white border border-slate-300 text-slate-800 px-2.5 py-0.5 rounded-lg"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-xs">No specific program</span>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {record.notes && (
              <div className="bg-orange-50/50 rounded-xl p-3.5 border border-orange-200">
                <span className="text-[11px] font-bold text-[#E07F0E] uppercase tracking-wider block mb-1">
                  Outreach Notes & Requests
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {record.notes}
                </p>
              </div>
            )}

            {/* Follow-up Notes & Log */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-extrabold text-[#1E5AA8] uppercase tracking-wider block">
                Worker Follow-Up History
              </span>

              {followUpNotes ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-mono max-h-36 overflow-y-auto">
                  {followUpNotes}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No worker follow-up notes logged yet.
                </p>
              )}

              {/* Add Follow-Up Note Form */}
              <form onSubmit={handleAddFollowUpNote} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={newWorkerNote}
                  onChange={(e) => setNewWorkerNote(e.target.value)}
                  placeholder="Log follow-up call, prayer, or church attendance..."
                  className="flex-1 px-3 py-2 text-xs border rounded-xl border-slate-300 focus:border-[#1E5AA8] outline-none"
                />
                <button
                  type="submit"
                  disabled={!newWorkerNote.trim() || isSaving}
                  className="px-4 py-2 text-xs font-black bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 rounded-xl disabled:opacity-50 cursor-pointer flex-shrink-0 border border-orange-300"
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
                className="text-xs text-[#E02020] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
