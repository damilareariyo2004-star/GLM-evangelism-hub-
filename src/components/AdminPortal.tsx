import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Sparkles,
  CheckCircle2,
  Church,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Filter,
  FileSpreadsheet,
  ArrowLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Clock,
  LogOut,
  AlertCircle,
  CheckSquare,
  Square,
  Trash2,
  UserMinus,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Download,
  Check,
  AlertTriangle,
  X
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  EvangelismRecord,
  AdminTab,
  WorkerSummary,
  ChurchProgram,
  CHURCH_PROGRAMS,
  RemovedWorker
} from '../types';
import {
  formatDateDisplay,
  compareDatesDesc,
  isDateInLastDays,
  isDateInThisWeek,
  isDateInLastWeek,
  normalizeDateToYmd
} from '../utils/dateUtils';
import { downloadRecordsCsv } from '../utils/csvExport';
import { getProgramBadgeStyle } from '../utils/programUtils';
import { WhatsAppIcon } from './BrandIcons';
import { getWhatsAppLink, getTelLink } from '../utils/phoneUtils';
import {
  subscribeToRemovedWorkers,
  removeWorkers,
  restoreWorkerAccess
} from '../services/recordService';

interface AdminPortalProps {
  currentUser: User | null;
  records: EvangelismRecord[];
  onSelectRecord: (record: EvangelismRecord) => void;
  onExitAdmin: () => void;
  onUpdateRecord: (id: string, updates: Partial<Omit<EvangelismRecord, 'id' | 'workerUid'>>) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  records,
  onSelectRecord,
  onExitAdmin
}) => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [selectedWorkerUid, setSelectedWorkerUid] = useState<string | null>(null);

  // All Records search & filters
  const [recordSearch, setRecordSearch] = useState('');
  const [filterWorker, setFilterWorker] = useState<string>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'followed_up' | 'established'>('all');

  // Workers search & status filter
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerStatusFilter, setWorkerStatusFilter] = useState<'all' | 'active' | 'not_active'>('all');

  // Removed Workers state & subscription
  const [removedWorkers, setRemovedWorkers] = useState<RemovedWorker[]>([]);
  const [isRemovedSectionOpen, setIsRemovedSectionOpen] = useState(false);

  // Multi-select mode for workers
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());

  // Removal confirmation modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [workersPendingRemoval, setWorkersPendingRemoval] = useState<WorkerSummary[]>([]);
  const [alsoDeleteRecords, setAlsoDeleteRecords] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [actionToast, setActionToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Real-time listener for removed workers
  useEffect(() => {
    const unsubscribe = subscribeToRemovedWorkers(
      (list) => {
        setRemovedWorkers(list);
      },
      (err) => {
        console.warn('Failed to listen to removedWorkers:', err);
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!actionToast) return;
    const timer = setTimeout(() => {
      setActionToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [actionToast]);

  const removedWorkerUids = useMemo(() => {
    return new Set(removedWorkers.map((rw) => rw.workerUid));
  }, [removedWorkers]);

  // Compute workers grouping and statistics from records
  const workers: WorkerSummary[] = useMemo(() => {
    const map = new Map<string, {
      workerUid: string;
      workerEmail: string;
      workerName: string;
      records: EvangelismRecord[];
    }>();

    for (const rec of records) {
      const uid = rec.workerUid || 'unknown';
      if (!map.has(uid)) {
        map.set(uid, {
          workerUid: uid,
          workerEmail: rec.workerEmail || '',
          workerName: rec.evangelistName || rec.workerEmail?.split('@')[0] || 'Church Worker',
          records: []
        });
      }
      map.get(uid)!.records.push(rec);
    }

    const result: WorkerSummary[] = [];

    map.forEach((data) => {
      const recs = data.records;
      const totalRecorded = recs.length;
      let recordedThisWeek = 0;
      let newConverts = 0;
      let followedUpCount = 0;
      let establishedCount = 0;
      let latestYmd = '';
      let latestDateStr = '';

      for (const r of recs) {
        if (isDateInThisWeek(r.date)) recordedThisWeek++;
        if (r.isNewConvert) newConverts++;
        if (r.followedUp) followedUpCount++;
        if (r.isEstablished) establishedCount++;

        const ymd = normalizeDateToYmd(r.date);
        if (ymd && (!latestYmd || ymd > latestYmd)) {
          latestYmd = ymd;
          latestDateStr = r.date;
        }
      }

      const followedUpPercent = totalRecorded > 0 ? Math.round((followedUpCount / totalRecorded) * 100) : 0;
      const isActive = latestDateStr ? isDateInLastDays(latestDateStr, 7) : false;

      result.push({
        workerUid: data.workerUid,
        workerEmail: data.workerEmail,
        workerName: data.workerName,
        totalRecorded,
        recordedThisWeek,
        newConverts,
        followedUpCount,
        followedUpPercent,
        establishedCount,
        lastRecordedDate: latestDateStr || 'No records',
        lastRecordedYmd: latestYmd,
        isActive
      });
    });

    // Filter out removed workers and sort by last activity (most recent first)
    return result
      .filter((w) => !removedWorkerUids.has(w.workerUid))
      .sort((a, b) => (b.lastRecordedYmd || '').localeCompare(a.lastRecordedYmd || ''));
  }, [records, removedWorkerUids]);

  // Removed workers enriched with retained record count
  const removedWorkersWithCounts = useMemo(() => {
    return removedWorkers.map((rw) => {
      const retainedRecordsCount = records.filter((r) => r.workerUid === rw.workerUid).length;
      return {
        ...rw,
        retainedRecordsCount
      };
    });
  }, [removedWorkers, records]);

  // Pending workers records for removal confirmation
  const pendingWorkerUids = useMemo(() => {
    return new Set(workersPendingRemoval.map((w) => w.workerUid));
  }, [workersPendingRemoval]);

  const pendingWorkersRecords = useMemo(() => {
    return records.filter((r) => pendingWorkerUids.has(r.workerUid));
  }, [records, pendingWorkerUids]);

  const openRemovalModal = (workersToTarget: WorkerSummary[]) => {
    setWorkersPendingRemoval(workersToTarget);
    setAlsoDeleteRecords(false);
    setDeleteConfirmText('');
    setIsConfirmModalOpen(true);
  };

  const toggleSelectWorker = (workerUid: string) => {
    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (next.has(workerUid)) {
        next.delete(workerUid);
      } else {
        next.add(workerUid);
      }
      return next;
    });
  };

  const handleSelectAllWorkers = () => {
    setSelectedUids(new Set(filteredWorkers.map((w) => w.workerUid)));
  };

  const handleClearSelection = () => {
    setSelectedUids(new Set());
  };

  const handleDownloadBackupCsv = () => {
    downloadRecordsCsv(pendingWorkersRecords, 'glm-removed-workers-records-backup.csv', { includeWorker: true });
  };

  const handleConfirmRemoval = async () => {
    if (workersPendingRemoval.length === 0) return;
    if (alsoDeleteRecords && deleteConfirmText.trim() !== 'DELETE') return;

    setIsRemoving(true);
    try {
      const adminIdentity = currentUser?.email || currentUser?.uid || 'Administrator';
      await removeWorkers(
        adminIdentity,
        workersPendingRemoval.map((w) => ({
          workerUid: w.workerUid,
          workerEmail: w.workerEmail,
          workerName: w.workerName
        })),
        alsoDeleteRecords,
        records
      );

      const count = workersPendingRemoval.length;
      setActionToast({
        type: 'success',
        message: `${count} worker${count > 1 ? 's' : ''} removed successfully.${alsoDeleteRecords ? ' Associated records permanently deleted.' : ' Existing records preserved in Hub.'}`
      });

      setSelectedUids(new Set());
      setIsSelectMode(false);
      setIsConfirmModalOpen(false);
      if (selectedWorkerUid && pendingWorkerUids.has(selectedWorkerUid)) {
        setSelectedWorkerUid(null);
      }
    } catch (err: unknown) {
      console.error('Error removing worker(s):', err);
      setActionToast({
        type: 'error',
        message: 'Failed to remove worker(s). Please check your connection and admin permissions.'
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRestoreAccess = async (workerUid: string, workerName?: string) => {
    try {
      await restoreWorkerAccess(workerUid);
      setActionToast({
        type: 'success',
        message: `Access restored for ${workerName || 'worker'}.`
      });
    } catch (err) {
      console.error('Error restoring worker access:', err);
      setActionToast({
        type: 'error',
        message: 'Failed to restore worker access.'
      });
    }
  };

  // High-level overview statistics
  const overviewStats = useMemo(() => {
    const totalWorkers = workers.length;
    const totalRecords = records.length;
    const totalNewConverts = records.filter((r) => r.isNewConvert).length;
    const totalFollowedUp = records.filter((r) => r.followedUp).length;
    const totalEstablished = records.filter((r) => r.isEstablished).length;
    const notActiveWorkersCount = workers.filter((w) => !w.isActive).length;
    const activeWorkersCount = workers.filter((w) => w.isActive).length;

    // Outreach pacing: this week vs last week
    const thisWeekOutreach = records.filter((r) => isDateInThisWeek(r.date)).length;
    const lastWeekOutreach = records.filter((r) => isDateInLastWeek(r.date)).length;

    const diff = thisWeekOutreach - lastWeekOutreach;
    const percentChange =
      lastWeekOutreach > 0
        ? Math.round(((thisWeekOutreach - lastWeekOutreach) / lastWeekOutreach) * 100)
        : thisWeekOutreach > 0
        ? 100
        : 0;

    return {
      totalWorkers,
      totalRecords,
      totalNewConverts,
      totalFollowedUp,
      totalEstablished,
      notActiveWorkersCount,
      activeWorkersCount,
      thisWeekOutreach,
      lastWeekOutreach,
      diff,
      percentChange
    };
  }, [workers, records]);

  // Selected worker details & drill-down records
  const selectedWorker = useMemo(() => {
    if (!selectedWorkerUid) return null;
    return workers.find((w) => w.workerUid === selectedWorkerUid) || null;
  }, [selectedWorkerUid, workers]);

  const selectedWorkerRecords = useMemo(() => {
    if (!selectedWorkerUid) return [];
    return records
      .filter((r) => r.workerUid === selectedWorkerUid)
      .sort((a, b) => compareDatesDesc(a.date, b.date, a.createdAt, b.createdAt));
  }, [selectedWorkerUid, records]);

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (workerStatusFilter === 'active' && !w.isActive) return false;
      if (workerStatusFilter === 'not_active' && w.isActive) return false;
      if (workerSearch.trim()) {
        const q = workerSearch.toLowerCase().trim();
        return (
          w.workerName.toLowerCase().includes(q) ||
          w.workerEmail.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [workers, workerStatusFilter, workerSearch]);

  // Filtered All Records list
  const filteredAllRecords = useMemo(() => {
    let list = [...records];

    if (filterWorker !== 'all') {
      list = list.filter((r) => r.workerUid === filterWorker);
    }

    if (filterProgram !== 'all') {
      list = list.filter((r) => Array.isArray(r.programs) && r.programs.includes(filterProgram));
    }

    if (filterStatus === 'pending') {
      list = list.filter((r) => !r.followedUp && !r.isEstablished);
    } else if (filterStatus === 'followed_up') {
      list = list.filter((r) => r.followedUp);
    } else if (filterStatus === 'established') {
      list = list.filter((r) => r.isEstablished);
    }

    if (recordSearch.trim()) {
      const q = recordSearch.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.evangelistName.toLowerCase().includes(q) ||
          (r.workerEmail && r.workerEmail.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => compareDatesDesc(a.date, b.date, a.createdAt, b.createdAt));
  }, [records, filterWorker, filterProgram, filterStatus, recordSearch]);

  const handleExportAdminCsv = () => {
    downloadRecordsCsv(filteredAllRecords, 'glm-admin-all-records.csv', { includeWorker: true });
  };

  return (
    <div className="space-y-5 pb-24 max-w-5xl mx-auto animate-in fade-in">
      {/* Admin Sticky Navigation Header */}
      <div className="bg-[#0F2744] text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-blue-900/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600/20 border border-rose-500/40 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Admin Console</h1>
                <span className="bg-rose-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Logged in as <span className="font-semibold text-white">{currentUser?.email}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onExitAdmin}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white text-xs font-bold transition-colors cursor-pointer min-h-[40px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Admin Mode</span>
          </button>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex bg-slate-900/60 p-1 rounded-2xl max-w-md w-full">
          <button
            type="button"
            onClick={() => {
              setCurrentTab('overview');
              setSelectedWorkerUid(null);
            }}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5 ${
              currentTab === 'overview'
                ? 'bg-white text-[#0F2744] shadow-md'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentTab('workers');
              setSelectedWorkerUid(null);
            }}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5 ${
              currentTab === 'workers'
                ? 'bg-white text-[#0F2744] shadow-md'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <span>Workers</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${currentTab === 'workers' ? 'bg-blue-100 text-[#0F2744]' : 'bg-white/20 text-white'}`}>
              {workers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentTab('all_records');
              setSelectedWorkerUid(null);
            }}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5 ${
              currentTab === 'all_records'
                ? 'bg-white text-[#0F2744] shadow-md'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <span>All Records</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${currentTab === 'all_records' ? 'bg-blue-100 text-[#0F2744]' : 'bg-white/20 text-white'}`}>
              {records.length}
            </span>
          </button>
        </div>
      </div>

      {/* SECTION A: OVERVIEW */}
      {currentTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Top 5 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Workers</span>
              <p className="text-2xl font-black text-slate-900">{overviewStats.totalWorkers}</p>
              <span className="text-[11px] text-slate-500">Registered</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Recorded</span>
              <p className="text-2xl font-black text-[#0F2744]">{overviewStats.totalRecords}</p>
              <span className="text-[11px] text-slate-500">Total Souls</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Converts</span>
              <p className="text-2xl font-black text-rose-600">{overviewStats.totalNewConverts}</p>
              <span className="text-[11px] text-slate-500">Born Again</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Followed Up</span>
              <p className="text-2xl font-black text-emerald-700">{overviewStats.totalFollowedUp}</p>
              <span className="text-[11px] text-slate-500">
                {overviewStats.totalRecords > 0 ? Math.round((overviewStats.totalFollowedUp / overviewStats.totalRecords) * 100) : 0}% contacted
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Established</span>
              <p className="text-2xl font-black text-purple-800">{overviewStats.totalEstablished}</p>
              <span className="text-[11px] text-purple-600">In Fellowship</span>
            </div>
          </div>

          {/* This Week vs Last Week Outreach Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Weekly Outreach Velocity</h3>
                  <p className="text-xs text-slate-500">This week vs previous week outreach records</p>
                </div>
                <div className={`p-2 rounded-xl flex items-center justify-center ${overviewStats.diff >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {overviewStats.diff >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-[#0F2744] uppercase tracking-wider block">This Week</span>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{overviewStats.thisWeekOutreach}</p>
                  <span className="text-[11px] text-slate-600">Souls recorded</span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Last Week</span>
                  <p className="text-2xl font-black text-slate-700 mt-0.5">{overviewStats.lastWeekOutreach}</p>
                  <span className="text-[11px] text-slate-600">Souls recorded</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <span>Pace comparison:</span>
                <span className={`font-bold ${overviewStats.diff >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {overviewStats.diff >= 0 ? `+${overviewStats.diff} records (${overviewStats.percentChange >= 0 ? '+' : ''}${overviewStats.percentChange}%)` : `${overviewStats.diff} records (${overviewStats.percentChange}%)`}
                </span>
              </div>
            </div>

            {/* Worker Health & Inactivity Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Worker Activity (Last 7 Days)</h3>
                  <p className="text-xs text-slate-500">Active outreach engagement monitoring</p>
                </div>
                <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Active Workers</span>
                  <p className="text-2xl font-black text-emerald-800 mt-0.5">{overviewStats.activeWorkersCount}</p>
                  <span className="text-[11px] text-emerald-700">Recorded in last 7 days</span>
                </div>

                <div className="p-3.5 bg-red-50/80 border border-red-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block">Not Active</span>
                  <p className="text-2xl font-black text-red-700 mt-0.5">{overviewStats.notActiveWorkersCount}</p>
                  <span className="text-[11px] text-red-700">No records in 7+ days</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span>
                  Tip: Tap the <strong>Workers</strong> tab above to inspect individual worker outreach logs or encourage not-active workers.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: WORKERS (or Worker Drilldown) */}
      {currentTab === 'workers' && (
        <div className="space-y-4 animate-in fade-in">
          {selectedWorker ? (
            /* Worker Drilldown View */
            <div className="space-y-4 animate-in fade-in">
              <button
                type="button"
                onClick={() => setSelectedWorkerUid(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F2744] hover:underline cursor-pointer min-h-[36px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Workers</span>
              </button>

              {/* Worker Header Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-slate-900">{selectedWorker.workerName}</h2>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          selectedWorker.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {selectedWorker.isActive ? 'Active' : 'Not active'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedWorker.workerEmail || selectedWorker.workerUid}</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      Last active: <strong className="text-slate-800">{formatDateDisplay(selectedWorker.lastRecordedDate)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => openRemovalModal([selectedWorker])}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-xs font-bold transition-all cursor-pointer min-h-[38px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove worker</span>
                    </button>
                  </div>
                </div>

                {/* Worker Stats Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total</span>
                    <p className="text-lg font-black text-slate-900">{selectedWorker.totalRecorded}</p>
                  </div>
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                    <span className="text-[10px] font-bold text-[#0F2744] uppercase">This Week</span>
                    <p className="text-lg font-black text-[#0F2744]">{selectedWorker.recordedThisWeek}</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Converts</span>
                    <p className="text-lg font-black text-rose-700">{selectedWorker.newConverts}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Followed Up</span>
                    <p className="text-lg font-black text-emerald-800">{selectedWorker.followedUpPercent}%</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-800 uppercase">Established</span>
                    <p className="text-lg font-black text-purple-800">{selectedWorker.establishedCount}</p>
                  </div>
                </div>
              </div>

              {/* Records list for this worker */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Records Logged by {selectedWorker.workerName} ({selectedWorkerRecords.length})
                </h3>

                {selectedWorkerRecords.length === 0 ? (
                  <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    No outreach records logged by this worker yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedWorkerRecords.map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => onSelectRecord(rec)}
                        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-900">{rec.fullName}</h4>
                            {rec.isNewConvert && (
                              <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                New Convert
                              </span>
                            )}
                            {rec.isEstablished && (
                              <span className="bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                Established
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                rec.followedUp
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {rec.followedUp ? 'Followed Up' : 'Pending'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-mono">{rec.phone}</p>
                          <p className="text-[11px] text-slate-400">Date: {formatDateDisplay(rec.date)}</p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="text-xs font-semibold text-[#0F2744] hover:underline">
                            Inspect &amp; Edit →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Workers List Grid */
            <div className="space-y-3">
              {/* Workers Search & Status Filter & Select Mode Toggle */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    placeholder="Search worker by name or email..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 outline-none focus:border-[#0F2744]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-500 mr-1">Status:</span>
                    <button
                      type="button"
                      onClick={() => setWorkerStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        workerStatusFilter === 'all'
                          ? 'bg-[#0F2744] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      All ({workers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkerStatusFilter('active')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        workerStatusFilter === 'active'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      Active ({overviewStats.activeWorkersCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkerStatusFilter('not_active')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        workerStatusFilter === 'not_active'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      Not active ({overviewStats.notActiveWorkersCount})
                    </button>
                  </div>

                  {/* Select Mode Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectMode(!isSelectMode);
                      setSelectedUids(new Set());
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[34px] flex items-center gap-1.5 border ${
                      isSelectMode
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{isSelectMode ? 'Cancel' : 'Select'}</span>
                  </button>
                </div>
              </div>

              {/* Multi-Select Action Toolbar when Select Mode is Active */}
              {isSelectMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-[#0F2744]">
                      {selectedUids.size} worker{selectedUids.size !== 1 ? 's' : ''} selected
                    </span>
                    <span className="text-xs text-blue-300">|</span>
                    <button
                      type="button"
                      onClick={handleSelectAllWorkers}
                      className="text-xs text-[#0F2744] hover:underline font-bold cursor-pointer"
                    >
                      Select all ({filteredWorkers.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-xs text-slate-500 hover:underline font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={selectedUids.size === 0}
                    onClick={() => {
                      const targets = filteredWorkers.filter((w) => selectedUids.has(w.workerUid));
                      openRemovalModal(targets);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors cursor-pointer shadow-xs min-h-[36px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove selected ({selectedUids.size})</span>
                  </button>
                </div>
              )}

              {filteredWorkers.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-700">No workers match the selected criteria.</p>
                  <p className="text-xs text-slate-500">As workers record souls in outreach, they will appear here automatically.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredWorkers.map((w) => (
                    <div
                      key={w.workerUid}
                      onClick={() => {
                        if (isSelectMode) {
                          toggleSelectWorker(w.workerUid);
                        } else {
                          setSelectedWorkerUid(w.workerUid);
                        }
                      }}
                      className={`bg-white rounded-3xl p-5 border shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3.5 relative ${
                        isSelectMode && selectedUids.has(w.workerUid)
                          ? 'border-[#0F2744] ring-2 ring-[#0F2744]/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {isSelectMode && (
                            <div className="pt-0.5 flex-shrink-0 text-[#0F2744]">
                              {selectedUids.has(w.workerUid) ? (
                                <CheckSquare className="w-5 h-5 text-[#0F2744]" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-300" />
                              )}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-base text-slate-900 leading-snug truncate">{w.workerName}</h4>
                            <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{w.workerEmail || w.workerUid}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                              w.isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {w.isActive ? 'Active' : 'Not active'}
                          </span>
                          {!isSelectMode && !w.isActive && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRemovalModal([w]);
                              }}
                              className="text-[11px] font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total</span>
                          <span className="font-bold text-slate-900 text-sm">{w.totalRecorded}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">This Week</span>
                          <span className="font-bold text-[#0F2744] text-sm">{w.recordedThisWeek}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Converts</span>
                          <span className="font-bold text-rose-600 text-sm">{w.newConverts}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Follow-up</span>
                          <span className="font-bold text-emerald-700 text-sm">{w.followedUpPercent}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Established</span>
                          <span className="font-bold text-purple-700 text-sm">{w.establishedCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Last Active</span>
                          <span className="font-medium text-slate-700 text-[11px] truncate block">{formatDateDisplay(w.lastRecordedDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-semibold text-[#0F2744] pt-1">
                        <span>{isSelectMode ? 'Click to select / unselect' : 'View records log'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Collapsed Removed Workers Section at bottom of Workers */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs mt-4">
                <button
                  type="button"
                  onClick={() => setIsRemovedSectionOpen(!isRemovedSectionOpen)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <UserX className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        Removed workers ({removedWorkers.length})
                      </span>
                      <p className="text-[11px] text-slate-400">Workers whose outreach access has been revoked</p>
                    </div>
                  </div>
                  {isRemovedSectionOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isRemovedSectionOpen && (
                  <div className="p-4 pt-0 border-t border-slate-100 space-y-2.5">
                    {removedWorkersWithCounts.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500">
                        No workers have been removed.
                      </div>
                    ) : (
                      removedWorkersWithCounts.map((rw) => (
                        <div
                          key={rw.workerUid}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 gap-3"
                        >
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-sm text-slate-900">{rw.workerName || 'Church Worker'}</h5>
                            <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{rw.workerEmail || rw.workerUid}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                              <span>Removed: {formatDateDisplay(rw.removedAt)}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">{rw.retainedRecordsCount} record{rw.retainedRecordsCount !== 1 ? 's' : ''} preserved in Hub</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRestoreAccess(rw.workerUid, rw.workerName)}
                            className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-[#0F2744] hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer shadow-2xs min-h-[36px]"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#0F2744]" />
                            <span>Restore access</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION C: ALL RECORDS */}
      {currentTab === 'all_records' && (
        <div className="space-y-3.5 animate-in fade-in">
          {/* Search, Worker Filter, Program Filter, Status Filter & Export */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full sm:flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  placeholder="Search soul name, phone, or worker..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 outline-none focus:border-[#0F2744]"
                />
              </div>

              {/* CSV Export Button with Worker column */}
              <button
                type="button"
                onClick={handleExportAdminCsv}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer min-h-[40px]"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV (with Worker)</span>
              </button>
            </div>

            {/* Filter Dropdowns row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter by Worker:</label>
                <select
                  value={filterWorker}
                  onChange={(e) => setFilterWorker(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#0F2744]"
                >
                  <option value="all">All Workers ({workers.length})</option>
                  {workers.map((w) => (
                    <option key={w.workerUid} value={w.workerUid}>
                      {w.workerName} ({w.totalRecorded})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter by Program:</label>
                <select
                  value={filterProgram}
                  onChange={(e) => setFilterProgram(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#0F2744]"
                >
                  <option value="all">All Programs</option>
                  {CHURCH_PROGRAMS.map((prog) => (
                    <option key={prog} value={prog}>
                      {prog}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#0F2744]"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Follow-up</option>
                  <option value="followed_up">Followed Up</option>
                  <option value="established">Established</option>
                </select>
              </div>
            </div>
          </div>

          {/* Records Counter */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
            <span>Showing {filteredAllRecords.length} records</span>
          </div>

          {/* All Records Cards */}
          {filteredAllRecords.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">No records found matching filters.</p>
              <p className="text-xs text-slate-500">Try adjusting your search query or reset the filters above.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAllRecords.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onSelectRecord(rec)}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">{rec.fullName}</h4>
                      {rec.isNewConvert && (
                        <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-rose-600" />
                          <span>New Convert</span>
                        </span>
                      )}
                      {rec.isEstablished && (
                        <span className="bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                          <Church className="w-2.5 h-2.5 text-purple-700" />
                          <span>Established</span>
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          rec.followedUp
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {rec.followedUp ? 'Followed Up' : 'Pending'}
                      </span>
                      {removedWorkerUids.has(rec.workerUid) && (
                        <span className="bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <UserX className="w-2.5 h-2.5 text-amber-700" />
                          <span>Removed worker</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span className="font-mono font-semibold text-slate-800">{rec.phone}</span>
                      <span>•</span>
                      <span>Worker: <strong className="text-slate-800">{rec.evangelistName || rec.workerEmail}</strong></span>
                      <span>•</span>
                      <span>Date: {formatDateDisplay(rec.date)}</span>
                    </div>

                    {rec.programs && rec.programs.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {rec.programs.map((p) => (
                          <span
                            key={p}
                            className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${getProgramBadgeStyle(String(p))}`}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <span className="text-xs font-semibold text-[#0F2744] hover:underline">
                      View / Edit Record →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Notification Toast */}
      {actionToast && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2 ${
          actionToast.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {actionToast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Worker Removal Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative space-y-4 my-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Remove Worker Access ({workersPendingRemoval.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Revoke outreach privileges and manage preserved records
                </p>
              </div>
            </div>

            {/* List of workers being removed */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Workers to be removed:</span>
              <div className="max-h-36 overflow-y-auto space-y-1 p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                {workersPendingRemoval.map((w) => (
                  <div key={w.workerUid} className="flex items-center justify-between text-xs py-0.5">
                    <span className="font-bold text-slate-900">{w.workerName}</span>
                    <span className="text-[11px] font-mono text-slate-500">{w.workerEmail || w.workerUid}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notice about removal */}
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Removing a worker adds their UID to <code className="font-mono text-rose-700 bg-rose-50 px-1 py-0.2 rounded">removedWorkers</code>, which blocks them from reading, creating, or editing outreach records upon sign-in. Firebase Auth accounts are not deleted.
            </p>

            {/* Optional Checkbox: Permanently Delete Records */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={alsoDeleteRecords}
                onChange={(e) => {
                  setAlsoDeleteRecords(e.target.checked);
                  if (!e.target.checked) setDeleteConfirmText('');
                }}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-slate-900 block">
                  Also permanently delete this worker's records
                </span>
                <span className="text-slate-500 block">
                  Existing records are KEPT by default ({pendingWorkersRecords.length} records). Check this box only if you want to permanently erase them.
                </span>
              </div>
            </label>

            {/* Safeguards when Also Delete Records is ticked */}
            {alsoDeleteRecords && (
              <div className="space-y-3 p-4 bg-rose-50/80 border border-rose-200 rounded-2xl text-xs animate-in fade-in">
                <div className="flex items-start gap-2 text-rose-800">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <p className="font-bold">
                    This will permanently delete {pendingWorkersRecords.length} outreach records in batches of up to 500!
                  </p>
                </div>

                {pendingWorkersRecords.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={handleDownloadBackupCsv}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Download records (CSV) backup</span>
                    </button>
                  </div>
                )}

                <div className="space-y-1 pt-1">
                  <label className="block text-xs font-bold text-rose-900">
                    To proceed, please type <span className="font-mono bg-rose-200 px-1 py-0.2 rounded text-rose-950">DELETE</span> below:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full p-2.5 rounded-xl border border-rose-300 bg-white focus:border-rose-600 text-xs font-mono outline-none uppercase font-bold"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer min-h-[42px]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isRemoving || (alsoDeleteRecords && deleteConfirmText.trim() !== 'DELETE')}
                onClick={handleConfirmRemoval}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-2 min-h-[42px]"
              >
                {isRemoving ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{alsoDeleteRecords ? 'Delete Records & Remove' : 'Confirm Removal'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
