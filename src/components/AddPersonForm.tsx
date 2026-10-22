import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  CheckCircle2,
  Sparkles,
  Phone,
  User,
  Calendar,
  HeartHandshake,
  Church,
  RotateCcw,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { ChurchProgram, CHURCH_PROGRAMS, EvangelismRecord } from '../types';
import { validatePhoneNumber, normalizePhoneForComparison } from '../utils/phoneUtils';
import { getTodayFormatted, formatDateDisplay } from '../utils/dateUtils';

interface AddPersonFormProps {
  existingRecords: EvangelismRecord[];
  onSubmitRecord: (record: Omit<EvangelismRecord, 'id'>) => Promise<string>;
  onNavigateToRecords: () => void;
  onNavigateToDashboard: () => void;
}

export const AddPersonForm: React.FC<AddPersonFormProps> = ({
  existingRecords,
  onSubmitRecord,
  onNavigateToRecords,
  onNavigateToDashboard
}) => {
  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState<ChurchProgram[]>(['Sunday Service']);
  const [isNewConvert, setIsNewConvert] = useState(false);
  const [respondedWell, setRespondedWell] = useState(true);
  const [notes, setNotes] = useState('');
  const [evangelistName, setEvangelistName] = useState('');
  const [date, setDate] = useState(() => getTodayFormatted());

  // Submission & Validation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phoneValidationError, setPhoneValidationError] = useState<string | null>(null);
  const [lastSubmittedRecord, setLastSubmittedRecord] = useState<Omit<EvangelismRecord, 'id'> | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-load last entered evangelist name from localStorage
  useEffect(() => {
    try {
      const savedEvangelist = localStorage.getItem('glm_last_evangelist');
      if (savedEvangelist) {
        setEvangelistName(savedEvangelist);
      }
    } catch {
      // ignore
    }
  }, []);

  // Duplicate Phone Number Check
  const duplicateRecordMatch = useMemo(() => {
    if (!phone || phone.trim().length < 6) return null;
    const normalizedInput = normalizePhoneForComparison(phone);
    if (!normalizedInput) return null;

    return existingRecords.find(
      (r) => normalizePhoneForComparison(r.phone) === normalizedInput
    );
  }, [phone, existingRecords]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (phoneValidationError) {
      setPhoneValidationError(null);
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleToggleProgram = (prog: ChurchProgram) => {
    if (selectedPrograms.includes(prog)) {
      setSelectedPrograms(selectedPrograms.filter((p) => p !== prog));
    } else {
      setSelectedPrograms([...selectedPrograms, prog]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPhoneValidationError(null);

    // Validate Full Name
    if (!fullName.trim()) {
      setErrorMessage('Please enter the full name of the person met.');
      return;
    }

    // Validate Phone Number
    const phoneCheck = validatePhoneNumber(phone);
    if (!phoneCheck.isValid) {
      setPhoneValidationError(phoneCheck.message || 'Please enter a valid phone number.');
      setErrorMessage(phoneCheck.message || 'Please enter a valid phone number.');
      return;
    }

    // Validate Evangelist Name
    if (!evangelistName.trim()) {
      setErrorMessage("Please enter the evangelist's name (who recorded this).");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save evangelist name to localStorage for convenience
      try {
        localStorage.setItem('glm_last_evangelist', evangelistName.trim());
      } catch {
        // ignore
      }

      const recordData: Omit<EvangelismRecord, 'id'> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        programs: selectedPrograms,
        isNewConvert,
        respondedWell,
        notes: notes.trim(),
        evangelistName: evangelistName.trim(),
        date: date || getTodayFormatted(),
        followedUp: false,
        followUpNotes: ''
      };

      await onSubmitRecord(recordData);
      setLastSubmittedRecord(recordData);
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to save record. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setFullName('');
    setPhone('');
    setSelectedPrograms(['Sunday Service']);
    setIsNewConvert(false);
    setRespondedWell(true);
    setNotes('');
    setIsSuccess(false);
    setLastSubmittedRecord(null);
    setErrorMessage(null);
    setPhoneValidationError(null);
    setDate(getTodayFormatted());
  };

  if (isSuccess && lastSubmittedRecord) {
    return (
      <div className="max-w-xl mx-auto py-4 px-2 pb-24 sm:pb-12">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md text-center space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#1E5AA8]">
              Record Saved Successfully!
            </h2>
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">{lastSubmittedRecord.fullName}</strong> has been saved to the GLM database.
            </p>
          </div>

          {/* Quick Summary Card */}
          <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-200 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
              <span className="text-slate-500 font-medium">Contact:</span>
              <span className="font-bold text-[#1E5AA8]">{lastSubmittedRecord.phone}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
              <span className="text-slate-500 font-medium">New Convert:</span>
              <span className={`font-bold ${lastSubmittedRecord.isNewConvert ? 'text-[#E02020]' : 'text-slate-700'}`}>
                {lastSubmittedRecord.isNewConvert ? 'Yes! Praise God' : 'No'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
              <span className="text-slate-500 font-medium">Responded Well:</span>
              <span className="font-semibold text-slate-700">{lastSubmittedRecord.respondedWell ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
              <span className="text-slate-500 font-medium">Date (DD/MM/YYYY):</span>
              <span className="font-semibold text-slate-800">{formatDateDisplay(lastSubmittedRecord.date)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
              <span className="text-slate-500 font-medium">Invited Programs:</span>
              <span className="font-semibold text-[#1E5AA8] text-right">
                {lastSubmittedRecord.programs.length > 0 ? lastSubmittedRecord.programs.join(', ') : 'None selected'}
              </span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-slate-500 font-medium">Evangelist:</span>
              <span className="font-semibold text-slate-800">{lastSubmittedRecord.evangelistName}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleResetForNext}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 font-extrabold text-sm shadow-md transition-all active:scale-98 cursor-pointer border border-orange-300"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Record Another Person</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onNavigateToRecords}
                className="py-2.5 px-3 rounded-xl bg-[#1E5AA8] hover:bg-[#15427D] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                View in Records
              </button>
              <button
                onClick={onNavigateToDashboard}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 sm:pb-12">
      {/* Top Title */}
      <div className="mb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#E02020] uppercase tracking-wider">
          <Church className="w-4 h-4" />
          <span>Evangelism Field Record</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1E5AA8]">
          Record Person Met
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Capture contact information, salvation decision, program invitations, and follow-up notes.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#E02020] text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span><strong>Error:</strong> {errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-6">
        {/* Full Name & Phone Number */}
        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              Full Name <span className="text-[#E02020] font-black">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sister Grace Adebayo"
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 focus:border-[#1E5AA8] focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              Phone Number / Contact <span className="text-[#E02020] font-black">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={handlePhoneChange}
                placeholder="e.g. 08081234567 or +234..."
                className={`w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                  phoneValidationError
                    ? 'border-red-400 bg-red-50/30 focus:ring-red-500/20'
                    : 'border-slate-300 focus:border-[#1E5AA8] focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
            </div>

            {phoneValidationError && (
              <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{phoneValidationError}</span>
              </p>
            )}

            {/* Requirement 9: Warning if phone number already exists */}
            {duplicateRecordMatch && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F7931E] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#E07F0E]">Warning: Duplicate phone number!</span>
                  <p className="mt-0.5 text-slate-700">
                    This contact is already recorded for <strong>{duplicateRecordMatch.fullName}</strong> on {formatDateDisplay(duplicateRecordMatch.date)} by <em>{duplicateRecordMatch.evangelistName}</em>.
                  </p>
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-500 mt-1">
              Supports Nigerian local format (e.g. 0808...) or international (+234...). Automatically formatted for WhatsApp.
            </p>
          </div>
        </div>

        {/* Invited to (select one or more) - Full text, never truncated */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
            Invited to: <span className="text-slate-500 font-normal">(select one or more)</span>
          </label>
          <p className="text-xs text-slate-500 mb-2.5">
            Tap to select the church programs this person was invited to attend:
          </p>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5">
            {CHURCH_PROGRAMS.map((prog) => {
              const isSelected = selectedPrograms.includes(prog);
              return (
                <button
                  type="button"
                  key={prog}
                  onClick={() => handleToggleProgram(prog)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 border-[#1E5AA8] text-[#1E5AA8] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-bold whitespace-normal">{prog}</span>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ml-2 ${
                      isSelected
                        ? 'bg-[#1E5AA8] border-[#15427D] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* New Convert? (Yes/No Toggle) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                New Convert?
              </label>
              <p className="text-xs text-slate-500">
                Did this soul pray to accept Jesus Christ as Lord and Saviour?
              </p>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setIsNewConvert(false)}
                className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  !isNewConvert
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setIsNewConvert(true)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isNewConvert
                    ? 'bg-[#E02020] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Yes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Responded Well Box (Checkbox + notes textarea) */}
        <div className="bg-orange-50/40 border border-orange-200 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-3">
            <input
              id="respondedWell"
              type="checkbox"
              checked={respondedWell}
              onChange={(e) => setRespondedWell(e.target.checked)}
              className="w-5 h-5 rounded text-[#F7931E] focus:ring-orange-500 border-slate-300 accent-[#F7931E] cursor-pointer"
            />
            <label htmlFor="respondedWell" className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 cursor-pointer">
              <HeartHandshake className="w-4 h-4 text-[#E07F0E]" />
              <span>Responded well</span>
            </label>
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs font-bold text-slate-700 mb-1">
              Follow-up Details & Notes:
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prayer requests, residence area, spiritual questions, best time to call..."
              className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:border-[#1E5AA8] focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-y"
            />
          </div>
        </div>

        {/* Evangelist Name & Date (DD/MM/YYYY) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label htmlFor="evangelistName" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              Evangelist's Name <span className="text-[#E02020] font-black">*</span>
            </label>
            <input
              id="evangelistName"
              type="text"
              required
              value={evangelistName}
              onChange={(e) => setEvangelistName(e.target.value)}
              placeholder="e.g. Brother Emmanuel"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#1E5AA8] focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Who recorded this person (saved on this phone).
            </p>
          </div>

          <div>
            <label htmlFor="date" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              Date (DD/MM/YYYY) <span className="text-slate-400 font-normal">(auto-filled)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="date"
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                pattern="\d{2}/\d{2}/\d{4}"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#1E5AA8] focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 outline-none font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Format: DD/MM/YYYY (e.g. {getTodayFormatted()})
            </p>
          </div>
        </div>

        {/* Submit Button in Flame Orange */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 font-extrabold text-sm sm:text-base shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed border border-orange-300"
          >
            {isSubmitting ? (
              <span>Saving Soul Record...</span>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-slate-950" />
                <span>Save Evangelism Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
