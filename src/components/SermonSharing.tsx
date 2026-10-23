import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  MessageCircle,
  Download,
  ExternalLink,
  Play,
  Pause,
  Calendar,
  BookOpen,
  User,
  Radio,
  Tag,
  Check,
  AlertCircle,
  FileAudio,
  Send,
  Info,
  X,
  Volume2,
  Clock,
  Layers,
  Users
} from 'lucide-react';
import { Sermon, EvangelismRecord } from '../types';
import {
  GLM_SERMONS,
  SERMON_CATEGORIES,
  SermonCategory,
  searchSermons,
  getSermonWhatsAppShareUrl,
  getSermonTelegramWhatsAppMessage
} from '../services/sermonService';
import { formatDateDisplay } from '../utils/dateUtils';
import { formatWhatsAppNumber } from '../utils/phoneUtils';

interface SermonSharingProps {
  records?: EvangelismRecord[];
  onBackToDashboard?: () => void;
}

function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export const SermonSharing: React.FC<SermonSharingProps> = ({
  records = [],
  onBackToDashboard
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SermonCategory>('All');

  // WhatsApp Library Share Modal state
  const [sharingSermon, setSharingSermon] = useState<Sermon | null>(null);
  const [selectedContactPhone, setSelectedContactPhone] = useState<string>('');

  // Audio Playback state (for verification/testing only)
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(5399); // 1:29:59 duration
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);

  // Feedback notifications
  const [actionFeedback, setActionFeedback] = useState<{
    id: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
  } | null>(null);

  // DOM Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredSermons = useMemo(() => {
    return searchSermons(GLM_SERMONS, searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const activeSermon = GLM_SERMONS[0]; // Knowing God by Apostle Joseph Ibrahim
  const rawAudioUrl = activeSermon?.audioUrl || '/assets/aistudio/Knowing_God_2babf39d.mp3';

  // Absolute URL resolution for robust cross-origin/iframe media loading
  const resolvedAudioUrl = useMemo(() => {
    if (typeof window === 'undefined') return rawAudioUrl;
    try {
      return new URL(rawAudioUrl, window.location.href).href;
    } catch {
      return rawAudioUrl;
    }
  }, [rawAudioUrl]);

  const showNotification = (
    id: string,
    message: string,
    type: 'success' | 'info' | 'error' | 'warning' = 'info'
  ) => {
    setActionFeedback({ id, message, type });
    setTimeout(() => {
      setActionFeedback((curr) => (curr?.id === id ? null : curr));
    }, 6000);
  };

  // Pre-load the sermon audio into a Blob URL in background for 100% reliable test playback
  useEffect(() => {
    let isCancelled = false;

    fetch(rawAudioUrl)
      .then(async (response) => {
        if (!response.ok) throw new Error('Audio asset network response failed');
        const blob = await response.blob();
        if (!isCancelled) {
          const bUrl = URL.createObjectURL(new Blob([blob], { type: 'audio/mpeg' }));
          setAudioBlobUrl(bUrl);
        }
      })
      .catch((err) => {
        console.log('Background audio preload note:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [rawAudioUrl]);

  // Audio Player Event Handlers for Testing & Verification
  const handleTogglePlay = async () => {
    if (!audioRef.current) return;
    setAudioError(null);

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setIsAudioLoading(true);

    try {
      if (audioRef.current.readyState === 0 || !audioRef.current.currentSrc) {
        audioRef.current.load();
      }
      await audioRef.current.play();
      setIsPlaying(true);
      setIsAudioLoading(false);
    } catch (err: unknown) {
      console.warn('Initial play note, trying fallback blob:', err);
      try {
        let playSrc = audioBlobUrl;
        if (!playSrc) {
          const res = await fetch(resolvedAudioUrl);
          if (res.ok) {
            const b = await res.blob();
            playSrc = URL.createObjectURL(b);
            setAudioBlobUrl(playSrc);
          }
        }

        if (audioRef.current && playSrc) {
          audioRef.current.src = playSrc;
          audioRef.current.load();
          await audioRef.current.play();
          setIsPlaying(true);
          setIsAudioLoading(false);
          return;
        }
      } catch (fallbackErr) {
        console.error('Audio play error:', fallbackErr);
      }

      setIsPlaying(false);
      setIsAudioLoading(false);
      setAudioError(
        'Audio playback could not be started automatically. Use standard browser controls below or download the MP3.'
      );
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
    setIsAudioLoading(false);
  };

  // WhatsApp Library Share Handler: Opens WhatsApp DM with the prefilled Telegram sermon card
  const handleConfirmWhatsAppShare = () => {
    if (!sharingSermon) return;
    const url = getSermonWhatsAppShareUrl(sharingSermon, selectedContactPhone || undefined);
    window.open(url, '_blank', 'noopener,noreferrer');

    const recipientLabel = selectedContactPhone
      ? records.find((r) => r.phone === selectedContactPhone)?.fullName || selectedContactPhone
      : 'WhatsApp';

    showNotification(
      sharingSermon.id,
      `Opening WhatsApp chat with ${recipientLabel} prefilled with Knowing God Telegram link...`,
      'success'
    );
    setSharingSermon(null);
    setSelectedContactPhone('');
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E5AA8] via-[#16437E] to-[#0E2E5C] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-[#E02020]/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-6 w-32 h-32 bg-[#F7931E]/20 rounded-full blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase bg-[#E02020] text-white px-2.5 py-0.5 rounded-full shadow-xs">
                Gospel Labour Ministry
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-orange-200 bg-white/10 px-2 py-0.5 rounded-full">
                <Radio className="w-3 h-3 text-[#F7931E] animate-pulse" />
                <span>t.me/glmchannel</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Telegram Message Library
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              Official messages and sermon posts from the Gospel Labour Ministry Telegram channel. Share verified sermon links directly with your outreach contacts via WhatsApp so they can listen and grow.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 self-start md:self-center">
            <a
              href="https://t.me/glmchannel/1331"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 text-xs font-black shadow-md border border-orange-300 transition-all cursor-pointer active:scale-95"
              title="Open exact Knowing God post on Telegram"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>Exact Post (t.me/glmchannel/1331)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <a
              href="https://t.me/glmchannel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all backdrop-blur-xs cursor-pointer"
            >
              <Radio className="w-4 h-4 text-sky-300" />
              <span>Official Channel</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in shadow-xs ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : actionFeedback.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : actionFeedback.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-300'
              : 'bg-blue-50 text-blue-800 border-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
            {actionFeedback.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
            {actionFeedback.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
            {actionFeedback.type === 'info' && <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Topic Filters */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Telegram messages by title, scripture (e.g. Daniel 11:32), or minister..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#1E5AA8] focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1 flex-shrink-0">
            <Tag className="w-3 h-3 text-[#1E5AA8]" />
            <span>Topics:</span>
          </span>
          {SERMON_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#1E5AA8] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Telegram Message Entries */}
      {filteredSermons.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-[#1E5AA8] flex items-center justify-center">
            <FileAudio className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Messages Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or select "All" topics to browse the Telegram library.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 rounded-xl bg-[#1E5AA8] text-white text-xs font-bold cursor-pointer hover:bg-[#16437E] transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredSermons.map((sermon) => {
            const ministerName = sermon.minister || sermon.speaker || 'Apostle Joseph Ibrahim';
            const durationText = sermon.duration || sermon.durationFormatted || '1:29:59';
            const exactPostUrl = sermon.postUrl || sermon.telegramPostUrl || 'https://t.me/glmchannel/1331';
            const channelUrl = sermon.channelUrl || 'https://t.me/glmchannel';

            return (
              <div
                key={sermon.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs hover:shadow-md transition-all space-y-5"
              >
                {/* Header Information */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {sermon.series && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-[#E07F0E] px-2.5 py-0.5 rounded-md border border-orange-200 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#E07F0E]" />
                          <span>Series: {sermon.series}</span>
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] px-2.5 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                        <Send className="w-3 h-3 text-[#1E5AA8]" />
                        <span>t.me/glmchannel</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{durationText}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDateDisplay(sermon.date)}</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#1E5AA8] leading-tight">
                      {sermon.title}
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                      <User className="w-4 h-4 text-[#E02020]" />
                      <span>Minister: {ministerName}</span>
                    </p>
                  </div>

                  {sermon.scripture && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 inline-flex">
                      <BookOpen className="w-4 h-4 text-[#1E5AA8]" />
                      <span>Scripture: {sermon.scripture}</span>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {sermon.description}
                  </p>

                  {/* Channel and Exact Post links */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-1 text-slate-700">
                      <span className="font-bold text-slate-500">Official Telegram channel:</span>
                      <a
                        href={channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1E5AA8] font-mono hover:underline font-bold"
                      >
                        {channelUrl}
                      </a>
                    </div>
                    <div className="flex items-center gap-1 text-slate-700">
                      <span className="font-bold text-slate-500">Exact individual post:</span>
                      <a
                        href={exactPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1E5AA8] font-mono hover:underline font-bold"
                      >
                        {exactPostUrl}
                      </a>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sermon.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Primary Actions: Open Exact Telegram Post & WhatsApp Share from Library */}
                <div className="bg-gradient-to-br from-blue-50/60 to-slate-50 rounded-2xl p-5 border-2 border-blue-200 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#1E5AA8] text-white flex items-center justify-center font-black shadow-xs">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          Telegram Post Sharing & Direct Access
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Shares the verified Telegram post link (t.me/glmchannel/1331) and notes so souls can listen directly on Telegram.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {/* Action 1: Open Exact Telegram Post */}
                    <a
                      href={exactPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl bg-[#1E5AA8] hover:bg-[#15427D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      title="Open the exact individual sermon post in Telegram"
                    >
                      <Send className="w-4 h-4 text-sky-200" />
                      <span>Open Exact Telegram Post</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>

                    {/* Action 2: WhatsApp Sharing from the Library */}
                    <button
                      type="button"
                      onClick={() => setSharingSermon(sermon)}
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      title="Share Knowing God Telegram message with an outreach contact on WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Share Telegram Post on WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Website Audio Playback (Verification & Testing Only) */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#1E5AA8]" />
                      <span className="text-xs font-black text-slate-800">
                        Website Audio Playback (Verification & Testing Only)
                      </span>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-slate-500">
                      <span>{formatAudioTime(currentTime)}</span> / <span>{formatAudioTime(duration)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal">
                    This basic control is retained solely for testing that the genuine sermon audio loads and plays on this device. Workers do not need to listen to sermons on the website as part of their normal outreach workflow.
                  </p>

                  {/* Hidden streaming audio element wired to the test button */}
                  <audio
                    ref={audioRef}
                    preload="auto"
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onCanPlay={() => setIsAudioLoading(false)}
                    onPlaying={() => {
                      setIsPlaying(true);
                      setIsAudioLoading(false);
                    }}
                    onEnded={() => setIsPlaying(false)}
                    onError={() => {
                      if (!isPlaying) {
                        setIsPlaying(false);
                        setIsAudioLoading(false);
                      }
                    }}
                    className="hidden"
                  >
                    {audioBlobUrl && <source src={audioBlobUrl} type="audio/mpeg" />}
                    <source src={resolvedAudioUrl} type="audio/mpeg" />
                    <source src={sermon.audioUrl} type="audio/mpeg" />
                  </audio>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                        isPlaying
                          ? 'bg-[#E02020] text-white hover:bg-[#C51616]'
                          : 'bg-[#1E5AA8] text-white hover:bg-[#15427D]'
                      }`}
                      aria-label={isPlaying ? 'Pause test audio' : 'Play test audio'}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-white" />
                          <span>Pause Audio Test</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{isAudioLoading ? 'Loading Audio...' : 'Play Audio Test'}</span>
                        </>
                      )}
                    </button>

                    <a
                      href={sermon.audioUrl || '/assets/aistudio/Knowing_God_2babf39d.mp3'}
                      download="Knowing_God_Apostle_Joseph_Ibrahim.mp3"
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition-colors"
                      title="Download MP3 file"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Download MP3 (35.8 MB)</span>
                    </a>
                  </div>

                  {audioError && (
                    <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center justify-between gap-2">
                      <span>{audioError}</span>
                      <button
                        type="button"
                        onClick={handleTogglePlay}
                        className="font-bold underline cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Standard native controls */}
                  <div className="pt-2 border-t border-slate-200">
                    <audio
                      controls
                      preload="metadata"
                      playsInline
                      className="w-full h-8 rounded-lg"
                      src={audioBlobUrl || resolvedAudioUrl}
                    >
                      {audioBlobUrl && <source src={audioBlobUrl} type="audio/mpeg" />}
                      <source src={resolvedAudioUrl} type="audio/mpeg" />
                    </audio>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WhatsApp Sharing from Library Modal (Allows selecting an outreach contact or general share) */}
      {sharingSermon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <MessageCircle className="w-5 h-5 flex-shrink-0" />
                <h3 className="font-black text-base text-slate-900">
                  Share Telegram Post on WhatsApp
                </h3>
              </div>
              <button
                onClick={() => setSharingSermon(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select an outreach contact to send this Telegram sermon directly to their WhatsApp DM, or tap <strong>Open WhatsApp Share</strong> to choose any recipient in WhatsApp.
            </p>

            {/* Contact selector from existing outreach records */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#1E5AA8]" />
                <span>Select Outreach Contact (Optional):</span>
              </label>

              {records.length > 0 ? (
                <select
                  value={selectedContactPhone}
                  onChange={(e) => setSelectedContactPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-medium outline-none focus:border-[#1E5AA8]"
                >
                  <option value="">General WhatsApp Share (Choose contact in WhatsApp)</option>
                  {records.map((rec) => (
                    <option key={rec.id || rec.phone} value={rec.phone}>
                      {rec.fullName} — {rec.phone}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                  No outreach records recorded yet. You can still use the General WhatsApp Share below.
                </div>
              )}
            </div>

            {/* Message Preview */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Prefilled WhatsApp Message Preview:
              </span>
              <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                {getSermonTelegramWhatsAppMessage(sharingSermon)}
              </pre>
            </div>

            <div className="text-[11px] text-slate-500 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900">
              Note: This shares the verified Telegram message link (t.me/glmchannel/1331). The recipient will listen directly on Telegram. You can edit the message in WhatsApp before sending.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSharingSermon(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWhatsAppShare}
                className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {selectedContactPhone ? 'Open WhatsApp DM with Contact' : 'Open WhatsApp Share'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
