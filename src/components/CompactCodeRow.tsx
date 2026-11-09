import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CopyIcon, OpenNusukIcon, TickCircleIcon } from './Iconsax';
import { NusukCode, Language } from '../types';
import { translations } from '../lib/i18n';
import { formatNumber, formatTimeAgo } from '../lib/validation';

interface CompactCodeRowProps {
  codeItem: NusukCode;
  language: Language;
  onCopy: (id: string, code: string) => void;
  onOpenNusukGuide: (code: string) => void;
}

export const CompactCodeRow: React.FC<CompactCodeRowProps> = ({
  codeItem,
  language,
  onCopy,
  onOpenNusukGuide,
}) => {
  const t = translations[language];
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeItem.code);
    setCopied(true);
    onCopy(codeItem.id, codeItem.code);

    try {
      confetti({
        particleCount: 14,
        spread: 30,
        origin: { y: 0.4 },
        colors: ['#10b981', '#34d399', '#d4af37'],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/70 border border-zinc-200/70 dark:border-white/[0.05] hover:border-zinc-300 dark:hover:border-white/[0.1] px-3 py-2 flex items-center justify-between gap-3 transition-colors shadow-2xs">
      {/* Code and Contributor Info */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-zinc-100 tracking-wide truncate tabular-nums">
            {codeItem.code}
          </span>
          {codeItem.status === 'verified' && (
            <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.06] px-1 py-0.1 rounded font-medium shrink-0">
              {t.cardVerifiedTag}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
          {codeItem.nickname && (
            <span className="text-zinc-600 dark:text-zinc-400 font-medium truncate">{codeItem.nickname}</span>
          )}
          {codeItem.nickname && <span>·</span>}
          <span>{formatTimeAgo(codeItem.createdAt, language)}</span>
          <span>·</span>
          <span className="tabular-nums">{formatNumber(codeItem.copyCount, language)} {t.cardCopiedCount}</span>
        </div>
      </div>

      {/* Buttons - Slim & Ultra-Minimal */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onOpenNusukGuide(codeItem.code)}
          className="h-7 px-2.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
        >
          <OpenNusukIcon size={12} color="currentColor" />
          <span>{language === 'bn' ? 'খুলুন' : 'Open'}</span>
        </button>

        <button
          onClick={handleCopy}
          className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
            copied
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-600 dark:text-zinc-300 border-zinc-200/70 dark:border-white/[0.06]'
          }`}
          title={t.copyBtn}
        >
          {copied ? <TickCircleIcon size={13} color="#ffffff" /> : <CopyIcon size={13} color="currentColor" />}
        </button>
      </div>
    </div>
  );
};
