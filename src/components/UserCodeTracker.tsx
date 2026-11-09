import React from 'react';
import { PlusIcon } from './Iconsax';
import { Language } from '../types';
import { translations } from '../lib/i18n';
import { formatNumber } from '../lib/validation';

interface UserCodeTrackerProps {
  userCode: string | null;
  userCodeCopies: number;
  language: Language;
  onOpenShareModal: () => void;
}

export const UserCodeTracker: React.FC<UserCodeTrackerProps> = ({
  userCode,
  userCodeCopies,
  language,
  onOpenShareModal,
}) => {
  const t = translations[language];

  const displayCode = userCode || 'NG-80ASTXfp';
  const displayCopies = userCode ? userCodeCopies : 197;

  return (
    <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-5 py-1">
      <div className="rounded-lg bg-white dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-white/[0.05] px-3 py-1.5 flex items-center justify-between gap-3 text-xs flex-wrap shadow-2xs transition-colors duration-200">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-600 dark:text-zinc-400 font-medium text-[11px] sm:text-xs">{t.userCodeBannerTitle}</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-emerald-400 tracking-wider text-xs sm:text-[13px]">
              {displayCode}
            </span>
          </div>

          <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline-block">·</span>

          <span className="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs">
            {t.userCodeBannerVisible}
          </span>

          <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline-block">·</span>

          <span className="text-zinc-700 dark:text-zinc-300 font-mono font-semibold text-[11px] sm:text-xs tabular-nums">
            {formatNumber(displayCopies, language)} {t.userCodeBannerViews}
          </span>
        </div>

        <button
          onClick={onOpenShareModal}
          className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
        >
          <PlusIcon size={12} color="currentColor" />
          <span>{t.userCodeBannerAddAnother}</span>
        </button>
      </div>
    </div>
  );
};
