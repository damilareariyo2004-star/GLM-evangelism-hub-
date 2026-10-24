import React from 'react';
import { Lock, Unlock, Cloud, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  recordsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuth,
  recordsCount
}) => {
  return (
    <header className="bg-[#0B1E38] text-white border-b border-slate-800/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 py-3 sm:py-3.5">
        <div className="flex items-center justify-between gap-3">
          {/* Logo and Titles */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src="/assets/aistudio/IMG-20261015-WA0010_bc047986.jpg"
                alt="Gospel Labor Ministry Logo"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-contain bg-white p-0.5 shadow-xs border border-white/20 flex-shrink-0"
              />
              <span
                className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0B1E38]"
                title="Cloud Connected"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white leading-tight truncate">
                GLM Evangelism Hub
              </h1>
              <p className="text-[11px] sm:text-xs font-medium tracking-wider text-slate-300 uppercase truncate">
                Gospel Labor Ministry
              </p>
            </div>
          </div>

          {/* Right Status / Worker Access Controls */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Cloud Sync indicator */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 border border-slate-700/60">
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span>{recordsCount} {recordsCount === 1 ? 'Record' : 'Records'}</span>
              </div>
            )}

            {/* Worker Account / Sign In Button */}
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[40px] ${
                currentUser
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
              }`}
              title={currentUser ? `Signed in as ${currentUser.email || currentUser.displayName}` : 'Sign in as evangelism worker'}
            >
              {currentUser ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-slate-950 flex-shrink-0" />
                  <span className="hidden sm:inline font-bold truncate max-w-[130px]">
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'Worker Active'}
                  </span>
                  <span className="sm:hidden font-bold">Account</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                  <span className="hidden sm:inline">Worker Sign In</span>
                  <span className="sm:hidden">Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
