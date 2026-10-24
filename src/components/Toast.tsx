import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'error';
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-sm"
    >
      {toast.type === 'error' ? (
        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
      ) : toast.type === 'info' ? (
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      )}
      <span className="text-xs sm:text-sm font-medium">{toast.text}</span>
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
