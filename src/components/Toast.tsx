import React from 'react';
import { TickCircleIcon } from './Iconsax';
import { AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  subMessage?: string;
  type?: 'success' | 'error';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  subMessage,
  type = 'success',
}) => {
  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="rounded-xl bg-white/95 dark:bg-[#0e182e]/95 border border-slate-200/90 dark:border-[#1e2d4d] shadow-xl px-3.5 py-2 flex items-center gap-2.5 min-w-[240px] max-w-sm backdrop-blur-md transition-colors">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            type === 'success'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
          }`}
        >
          {type === 'success' ? (
            <TickCircleIcon size={14} color="currentColor" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{message}</p>
          {subMessage && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{subMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};
