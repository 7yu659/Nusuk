import React, { useState } from 'react';
import { KeyIcon, PlusIcon } from './Iconsax';
import { Language } from '../types';
import { translations } from '../lib/i18n';

interface QuickShareBannerProps {
  language: Language;
  onOpenShareModal: (initialCode?: string) => void;
}

export const QuickShareBanner: React.FC<QuickShareBannerProps> = ({
  language,
  onOpenShareModal,
}) => {
  const t = translations[language];
  const [quickInput, setQuickInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenShareModal(quickInput);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-5 pt-1.5 pb-1">
      <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-white/[0.06] p-2.5 sm:p-3 shadow-2xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-white/[0.06] flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0">
              <KeyIcon size={14} color="currentColor" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {t.quickShareHeading}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t.quickShareSub}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-1.5 w-full sm:w-auto">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value.toUpperCase())}
              placeholder={t.quickSharePlaceholder}
              className="flex-1 sm:w-44 h-7.5 px-2.5 rounded-lg bg-zinc-50 dark:bg-[#07090b] border border-zinc-200/80 dark:border-white/[0.08] text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 tracking-wider uppercase transition-colors"
            />
            <button
              type="submit"
              className="h-7.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium text-xs flex items-center gap-1 transition-all shrink-0 cursor-pointer active:scale-95 shadow-2xs"
            >
              <PlusIcon size={12} color="currentColor" />
              <span>{t.shareCodeBtn}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
