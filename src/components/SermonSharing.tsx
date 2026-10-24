import React, { useState, useRef } from 'react';
import { Play, Pause, Download, Volume2 } from 'lucide-react';
import { WhatsAppIcon, TelegramIcon } from './BrandIcons';
import { Toast, ToastMessage } from './Toast';
import { EvangelismRecord } from '../types';

/**
 * Array of GLM Telegram Sermons (title, number).
 * Easily expandable: just add `{ title: '...', number: 1234 }` here.
 */
export interface SermonMessageItem {
  title: string;
  number: number;
}

export const GLM_MESSAGES_LIST: SermonMessageItem[] = [
  { title: 'No Darkness at All', number: 1737 },
  { title: 'Born Again', number: 1426 },
  { title: "Sin and God's Love", number: 294 },
  { title: 'New Foundation', number: 956 },
  { title: 'Rebirth', number: 1184 },
  { title: 'Knowing God', number: 1331 }
];

export function buildTelegramUrl(postNumber: number): string {
  return `https://t.me/glmchannel/${postNumber}`;
}

export function buildWhatsAppText(postNumber: number): string {
  return `🎧 Gospel Labour Ministry (GLM) Sermon\n\n🔗 Listen to the sermon on Telegram:\nhttps://t.me/glmchannel/${postNumber}\n\nMay you be blessed and transformed as you listen!`;
}

export function buildWhatsAppShareUrl(postNumber: number): string {
  const text = buildWhatsAppText(postNumber);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

interface SermonSharingProps {
  records?: EvangelismRecord[];
  onBackToDashboard?: () => void;
}

function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const SermonSharing: React.FC<SermonSharingProps> = ({ onBackToDashboard }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Audio Playback state for verification/testing only
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(5399); // 1:29:59
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const testAudioUrl = '/assets/aistudio/Knowing_God_2babf39d.mp3';

  const handleTelegramClick = (title: string, number: number) => {
    setToast({
      id: 'tg-' + Date.now(),
      text: `Opening Telegram for "${title}"...`,
      type: 'info'
    });
    window.open(buildTelegramUrl(number), '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppClick = (title: string, number: number) => {
    setToast({
      id: 'wa-' + Date.now(),
      text: `Opening WhatsApp for "${title}"...`,
      type: 'info'
    });
    window.open(buildWhatsAppShareUrl(number), '_blank', 'noopener,noreferrer');
  };

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsAudioLoading(true);
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsAudioLoading(false);
        })
        .catch((err) => {
          console.warn('Audio playback error:', err);
          setIsPlaying(false);
          setIsAudioLoading(false);
        });
    }
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-12 max-w-4xl mx-auto">
      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Screen Header: Page title "Messages" (24px, bold) with a small count badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-bold text-slate-900 tracking-tight leading-none">
            Messages
          </h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {GLM_MESSAGES_LIST.length}
          </span>
        </div>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="text-xs font-semibold text-[#0F2744] hover:text-blue-700 cursor-pointer min-h-[44px] flex items-center px-1"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>

      {/* Vertical list of message cards, 12px gap (gap-3 = 12px) */}
      <div className="flex flex-col gap-3">
        {GLM_MESSAGES_LIST.map((msg) => (
          <div
            key={msg.number}
            className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-xs p-4 flex items-center justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
          >
            {/* Left: 40px circle in primary color at 10% opacity with message number */}
            <div className="w-10 h-10 rounded-full bg-[#0F2744]/10 text-[#0F2744] font-bold text-sm flex items-center justify-center flex-shrink-0">
              {msg.number}
            </div>

            {/* Middle: Title only, 16px, semibold, single line. No description or sub-text. */}
            <div className="flex-1 min-w-0 pr-2">
              <span className="text-[16px] font-semibold text-slate-900 truncate block">
                {msg.title}
              </span>
            </div>

            {/* Right: Two round 44px icon buttons, icons only with no text */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Telegram icon: opens https://t.me/glmchannel/<number> */}
              <button
                type="button"
                onClick={() => handleTelegramClick(msg.title, msg.number)}
                className="w-11 h-11 rounded-full flex items-center justify-center border border-sky-200 bg-sky-50/70 hover:bg-sky-100 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title="Open on Telegram"
                aria-label={`Open ${msg.title} on Telegram`}
              >
                <TelegramIcon className="w-5 h-5 flex-shrink-0" />
              </button>

              {/* WhatsApp icon: opens https://wa.me/?text=<encoded message> */}
              <button
                type="button"
                onClick={() => handleWhatsAppClick(msg.title, msg.number)}
                className="w-11 h-11 rounded-full flex items-center justify-center border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title="Send on WhatsApp"
                aria-label={`Send ${msg.title} on WhatsApp`}
              >
                <WhatsAppIcon className="w-5 h-5 flex-shrink-0" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Website Audio Playback for Testing Only */}
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-3 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#0F2744]" />
            <span className="text-xs sm:text-sm font-semibold text-slate-900">
              Audio Playback (Testing Only)
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Retained to verify that sermon audio loads and plays on this device.
        </p>

        <audio
          ref={audioRef}
          src={testAudioUrl}
          preload="metadata"
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration) {
              setDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => setIsPlaying(false)}
        />

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F2744] hover:bg-[#1E5AA8] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer min-h-[44px]"
            aria-label={isPlaying ? 'Pause audio test' : 'Play audio test'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Audio Test</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{isAudioLoading ? 'Loading...' : 'Play Audio Test'}</span>
              </>
            )}
          </button>

          <a
            href={testAudioUrl}
            download="Knowing_God_Apostle_Joseph_Ibrahim.mp3"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Download MP3</span>
          </a>
        </div>
      </div>
    </div>
  );
};
