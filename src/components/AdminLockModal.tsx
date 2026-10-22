import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, X, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface AdminLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessUnlock: () => void;
}

export const DEFAULT_WORKER_PASSCODE = 'glm2026';

export const AdminLockModal: React.FC<AdminLockModalProps> = ({
  isOpen,
  onClose,
  onSuccessUnlock
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const storedCode = localStorage.getItem('glm_worker_passcode') || DEFAULT_WORKER_PASSCODE;

    if (passcode.trim().toLowerCase() === storedCode.toLowerCase()) {
      if (rememberMe) {
        localStorage.setItem('glm_worker_unlocked', 'true');
      } else {
        sessionStorage.setItem('glm_worker_unlocked', 'true');
      }
      onSuccessUnlock();
      onClose();
    } else {
      setError('Incorrect worker passcode. Please check with your evangelism leader.');
    }
  };

  const handleQuickDemoPasscode = () => {
    setPasscode(DEFAULT_WORKER_PASSCODE);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo and Titles */}
        <div className="text-center space-y-2 pt-1">
          <div className="inline-block p-1 rounded-full bg-white shadow-md border-2 border-red-500 mx-auto">
            <img
              src="/assets/aistudio/IMG-20261015-WA0010_bc047986.jpg"
              alt="Gospel Labor Ministry"
              className="w-16 h-16 rounded-full object-contain"
            />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#1E5AA8]">
              Church Worker Login
            </h3>
            <p className="text-xs font-bold text-[#E02020] uppercase tracking-wider mt-0.5">
              Gospel Labor Ministry
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
            Personal phone numbers and follow-up notes are protected so only authorized church workers can view contacts.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[#E02020] text-xs flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label htmlFor="workerPasscode" className="block text-xs font-bold text-slate-800 mb-1.5">
              Worker Password:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="workerPasscode"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#1E5AA8] focus:ring-2 focus:ring-blue-500/20 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick Demo Helper */}
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Default password: <code className="bg-slate-100 text-[#1E5AA8] px-1.5 py-0.5 rounded font-mono font-bold">glm2026</code>
              </span>
              <button
                type="button"
                onClick={handleQuickDemoPasscode}
                className="text-[#1E5AA8] hover:underline font-bold cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="rememberWorker"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-[#1E5AA8] focus:ring-blue-500 accent-[#1E5AA8] cursor-pointer"
            />
            <label htmlFor="rememberWorker" className="text-xs text-slate-700 font-medium cursor-pointer">
              Remember login on this device
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer border border-orange-300 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>Login as Church Worker</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
