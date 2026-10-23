import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  X,
  CheckCircle2,
  Users,
  Sparkles,
  HeartHandshake,
  Download,
  Filter
} from 'lucide-react';
import { EvangelismRecord, DateRangePreset } from '../types';
import {
  filterRecordsByDateRange,
  getPresetDateBounds,
  downloadRecordsCsv,
  normalizeDateToYmd
} from '../utils/csvExport';
import { formatDateDisplay } from '../utils/dateUtils';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: EvangelismRecord[];
  workerName?: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  records,
  workerName
}) => {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('this_week');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 7);
    return today.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Calculate filtered records
  const filteredRecords = useMemo(() => {
    return filterRecordsByDateRange(records, {
      preset: selectedPreset,
      startDate: customStartDate,
      endDate: customEndDate
    });
  }, [records, selectedPreset, customStartDate, customEndDate]);

  // Calculate summary metrics for the chosen range
  const summary = useMemo(() => {
    const total = filteredRecords.length;
    const newConverts = filteredRecords.filter((r) => r.isNewConvert).length;
    const respondedWell = filteredRecords.filter((r) => r.respondedWell).length;
    const followedUp = filteredRecords.filter((r) => r.followedUp).length;
    return { total, newConverts, respondedWell, followedUp };
  }, [filteredRecords]);

  // Compute active date range text for UI display
  const dateRangeDisplay = useMemo(() => {
    if (selectedPreset === 'all') {
      return 'All Saved Outreach Records (All Time)';
    }
    if (selectedPreset === 'custom') {
      return `${formatDateDisplay(customStartDate)} to ${formatDateDisplay(customEndDate)}`;
    }
    const bounds = getPresetDateBounds(selectedPreset);
    return `${formatDateDisplay(bounds.startDate)} to ${formatDateDisplay(bounds.endDate)}`;
  }, [selectedPreset, customStartDate, customEndDate]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const presetSlug = selectedPreset.replace('_', '-');
    const filename = `glm-outreach-report-${presetSlug}-${todayStr}.csv`;
    downloadRecordsCsv(filteredRecords, filename);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E5AA8] to-[#16437E] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close export dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase bg-[#E02020] text-white px-2 py-0.5 rounded-full">
                GLM Evangelism Hub
              </span>
              <h2 id="export-modal-title" className="text-lg sm:text-xl font-black text-white">
                Export Weekly Outreach Report
              </h2>
            </div>
          </div>
          <p className="text-xs text-blue-100 mt-1">
            Generate an official RFC 4180 CSV spreadsheet of your evangelism contacts for weekly ministry reporting.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1E5AA8]" />
              <span>Select Reporting Period</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPreset('this_week')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                  selectedPreset === 'this_week'
                    ? 'bg-[#1E5AA8] text-white border-[#1E5AA8] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                This Week
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreset('last_7_days')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                  selectedPreset === 'last_7_days'
                    ? 'bg-[#1E5AA8] text-white border-[#1E5AA8] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Last 7 Days
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreset('this_month')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                  selectedPreset === 'this_month'
                    ? 'bg-[#1E5AA8] text-white border-[#1E5AA8] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                This Month
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreset('all')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                  selectedPreset === 'all'
                    ? 'bg-[#1E5AA8] text-white border-[#1E5AA8] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Records
              </button>
            </div>

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedPreset(selectedPreset === 'custom' ? 'this_week' : 'custom')}
                className={`text-xs font-bold inline-flex items-center gap-1 cursor-pointer underline transition-colors ${
                  selectedPreset === 'custom' ? 'text-[#E02020]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>{selectedPreset === 'custom' ? 'Switch back to standard presets' : 'Use custom date range instead'}</span>
              </button>
            </div>
          </div>

          {/* Custom Date Range Pickers (if custom selected) */}
          {selectedPreset === 'custom' && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="text-xs font-bold text-[#1E5AA8]">Choose Custom Date Range</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Start Date:
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-[#1E5AA8]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    End Date:
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-[#1E5AA8]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Live Preview Metrics */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">Selected Window:</span>
              <span className="font-black text-[#1E5AA8] bg-blue-100/70 px-2 py-0.5 rounded-md text-[11px]">
                {dateRangeDisplay}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1 text-center">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-base sm:text-lg font-black text-[#1E5AA8]">{summary.total}</div>
                <div className="text-[10px] font-bold text-slate-500">Souls</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-base sm:text-lg font-black text-amber-600">{summary.newConverts}</div>
                <div className="text-[10px] font-bold text-slate-500">Converts</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-base sm:text-lg font-black text-emerald-600">{summary.respondedWell}</div>
                <div className="text-[10px] font-bold text-slate-500">Positive</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-base sm:text-lg font-black text-purple-600">{summary.followedUp}</div>
                <div className="text-[10px] font-bold text-slate-500">Followed Up</div>
              </div>
            </div>

            {summary.total === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center font-medium">
                No outreach records found in this selected date period. Switch presets or record more souls.
              </p>
            )}
          </div>

          {/* Sample records list preview if records exist */}
          {summary.total > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Records Included Preview ({Math.min(3, summary.total)} of {summary.total}):
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {filteredRecords.slice(0, 3).map((r) => (
                  <div
                    key={r.id || r.phone}
                    className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-slate-200"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{r.fullName}</div>
                      <div className="text-[11px] text-slate-500">{r.phone}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-slate-600 block">
                        {formatDateDisplay(r.date)}
                      </span>
                      {r.isNewConvert && (
                        <span className="inline-block text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
                          New Convert
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={summary.total === 0}
            className="px-5 py-2.5 text-xs font-black bg-[#1E5AA8] hover:bg-[#16437E] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV ({summary.total} {summary.total === 1 ? 'Record' : 'Records'})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
