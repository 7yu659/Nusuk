import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { KeyIcon, CopyIcon, OpenNusukIcon, TickCircleIcon } from './Iconsax';
import { NusukCode, Language } from '../types';
import { translations } from '../lib/i18n';
import { formatNumber } from '../lib/validation';

interface HeroNextCodeCardProps {
  currentKey: NusukCode | null;
  language: Language;
  onCopy: (id: string, code: string) => void;
  onOpenNusuk: (code: string) => void;
  onNextKey: () => void;
  viewedCount: number;
}

export const HeroNextCodeCard: React.FC<HeroNextCodeCardProps> = ({
  currentKey,
  language,
  onCopy,
  onOpenNusuk,
  onNextKey,
  viewedCount,
}) => {
  const t = translations[language];
  const [copied, setCopied] = useState(false);

  if (!currentKey) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(currentKey.code);
    setCopied(true);
    onCopy(currentKey.id, currentKey.code);

    try {
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { y: 0.35 },
        colors: ['#10b981', '#34d399', '#d4af37'],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  const handleOpenNusukClick = () => {
    navigator.clipboard.writeText(currentKey.code);
    onOpenNusuk(currentKey.code);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-5 py-2">
      <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-white/[0.07] p-3.5 sm:p-4 shadow-2xs transition-colors duration-200">
        {/* Top Header Tag */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-white/[0.06] text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <KeyIcon size={14} color="currentColor" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {t.nextCodeHeading}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 px-1.5 py-0.2 rounded font-semibold">
                  READY
                </span>
              </div>
            </div>
          </div>

          {/* Next Code cycle button - Slim */}
          <button
            onClick={onNextKey}
            className="h-7 px-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/[0.06] text-xs font-medium flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
            title="Get next code"
          >
            <span>{t.nextCodeBtn}</span>
          </button>
        </div>

        {/* Monospace Code Display - Slim & Refined */}
        <div className="my-2 py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-lg bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/60 dark:border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors">
          <div>
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-zinc-900 dark:text-zinc-100 select-all selection:bg-emerald-500/20 tabular-nums flex items-center overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={currentKey.code}
                  className="flex items-center"
                  initial={{ y: 9, opacity: 0, filter: 'blur(3px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ y: -9, opacity: 0, filter: 'blur(3px)' }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  {currentKey.code.split('').map((char, index) => (
                    <motion.span
                      key={`${currentKey.code}-${index}`}
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.22,
                        delay: index * 0.015,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="inline-block"
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
              {currentKey.nickname && (
                <span>{t.cardSharedBy}: <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{currentKey.nickname}</strong></span>
              )}
              {currentKey.nickname && <span>·</span>}
              <span className="tabular-nums">{formatNumber(currentKey.copyCount, language)} {t.cardCopiedCount}</span>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:block text-right tabular-nums">
            <span>{formatNumber(viewedCount, language)} {language === 'bn' ? 'টি কোড ট্রাই করেছেন' : 'keys explored'}</span>
          </div>
        </div>

        {/* Action Buttons: Slim & Ultra-Minimal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* Open in Nusuk Button */}
          <button
            onClick={handleOpenNusukClick}
            className="h-8.5 sm:h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs sm:text-[13px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
          >
            <OpenNusukIcon size={15} color="currentColor" />
            <span>{t.openInNusukBtn}</span>
          </button>

          {/* Copy Key Button */}
          <button
            onClick={handleCopy}
            className={`h-8.5 sm:h-9 rounded-lg font-medium text-xs sm:text-[13px] flex items-center justify-center gap-1.5 border transition-all cursor-pointer active:scale-[0.98] ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 border-zinc-200/80 dark:border-white/[0.08]'
            }`}
          >
            {copied ? (
              <>
                <TickCircleIcon size={15} color="#ffffff" />
                <span>{t.copiedText}</span>
              </>
            ) : (
              <>
                <CopyIcon size={15} color="currentColor" className="text-zinc-500 dark:text-zinc-400" />
                <span>{t.cardCopyCodeBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
