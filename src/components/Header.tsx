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
    <header className="bg-gradient-to-r from-[#15427D] via-[#1E5AA8] to-[#15427D] text-white shadow-md border-b-2 border-[#E02020] sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Logo and Titles - never clipped */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src="/assets/aistudio/IMG-20261015-WA0010_bc047986.jpg"
                alt="Gospel Labor Ministry Logo"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-contain bg-white p-0.5 shadow-sm border-2 border-white/40 flex-shrink-0"
              />
              <span
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#1E5AA8]"
                title="Cloud Connected"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                GLM Evangelism Hub
              </h1>
              <p className="text-xs sm:text-sm font-semibold tracking-wide text-orange-200 uppercase">
                Gospel Labor Ministry
              </p>
            </div>
          </div>

          {/* Right Status / Worker Access Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Cloud Sync indicator */}
            {currentUser && (
              <div className="hidden xs:flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full text-xs font-medium text-white border border-white/20">
                <Cloud className="w-3.5 h-3.5 text-orange-300" />
                <span>{recordsCount} Recorded</span>
              </div>
            )}

            {/* Worker Account / Sign In Button */}
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer ${
                currentUser
                  ? 'bg-[#F7931E] text-slate-950 hover:bg-[#e07f0e] border border-orange-300'
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/30'
              }`}
              title={currentUser ? `Signed in as ${currentUser.email || currentUser.displayName}` : 'Sign in as evangelism worker'}
            >
              {currentUser ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-slate-950" />
                  <span className="hidden sm:inline font-bold">
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'Worker Active'}
                  </span>
                  <span className="sm:hidden">Account</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-orange-300" />
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
