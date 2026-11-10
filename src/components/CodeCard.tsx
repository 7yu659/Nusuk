import React, { useState, useEffect, useRef } from 'react';
import { Copy, ExternalLink, Check, Zap, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { NusukCode } from '../types';

interface CodeCardProps {
  codeItem: NusukCode;
  cardIndex?: number;
  isLatest?: boolean;
  hasSpecialBadge?: boolean;
  displayTimeText: string;
  isUsed?: boolean;
  onCopy: (id: string, code: string) => void;
  onOpenNusuk: (code: string) => void;
  onTriggerNextCode?: () => void;
  onPauseCycle?: () => void;
  onResumeCycle?: () => void;
  cycleCount?: number;
}

export const CodeCard: React.FC<CodeCardProps> = ({
  codeItem,
  cardIndex = 0,
  isLatest = false,
  hasSpecialBadge = false,
  displayTimeText,
  isUsed = false,
  onCopy,
  onOpenNusuk,
  onTriggerNextCode,
  onPauseCycle,
  onResumeCycle,
  cycleCount = 0,
}) => {
  const [copied, setCopied] = useState(false);

  // Card 0 is the 1st card; Card 1 is the 2nd card
  const isFirstCard = cardIndex === 0;
  const isSecondCard = cardIndex === 1;

  // Track code updates & cycle changes
  const [isCodeUpdated, setIsCodeUpdated] = useState(false);
  const [isSecondUpdated, setIsSecondUpdated] = useState(false);
  const prevCodeRef = useRef(codeItem.code);
  const prevCycleRef = useRef(cycleCount);

  // Initial highlight on mount for the 1st card
  useEffect(() => {
    if (isFirstCard && isLatest) {
      setIsCodeUpdated(true);
      const timer = setTimeout(() => {
        setIsCodeUpdated(false);
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [isFirstCard, isLatest]);

  // Highlight whenever code updates or cycle changes (first 2 cards jhapti update)
  useEffect(() => {
    const codeChanged = prevCodeRef.current !== codeItem.code;
    const cycleChanged = prevCycleRef.current !== cycleCount;

    if (codeChanged || cycleChanged) {
      prevCodeRef.current = codeItem.code;
      prevCycleRef.current = cycleCount;
      if (isFirstCard) {
        setIsCodeUpdated(true);
        const timeout = setTimeout(() => {
          setIsCodeUpdated(false);
        }, 2400);
        return () => clearTimeout(timeout);
      } else if (isSecondCard) {
        setIsSecondUpdated(true);
        const timeout = setTimeout(() => {
          setIsSecondUpdated(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [codeItem.code, cycleCount, isFirstCard, isSecondCard]);

  // Highlight happens on the first 2 cards during jhapti transitions
  const isHighlighted = isFirstCard && isCodeUpdated && !isUsed;
  const isSecondHighlighted = isSecondCard && isSecondUpdated && !isUsed;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeItem.code);
    setCopied(true);
    onCopy(codeItem.id, codeItem.code);

    if (onPauseCycle) onPauseCycle();

    try {
      confetti({
        particleCount: 22,
        spread: 40,
        origin: { y: 0.35 },
        colors: ['#0070e0', '#38bdf8', '#0ea5e9', '#60a5fa', '#10b981'],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  const handleOpenNusukClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeItem.code);
    onOpenNusuk(codeItem.code);
  };

  const handleManualCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTriggerNextCode) onTriggerNextCode();
  };

  return (
    <div
      onMouseEnter={onPauseCycle}
      onMouseLeave={onResumeCycle}
      className={`rounded-2xl border p-3 sm:p-3.5 shadow-sm transition-all duration-300 relative overflow-hidden ${
        isUsed
          ? 'bg-slate-100/90 dark:bg-[#15161b] border-slate-300/90 dark:border-[#252834] opacity-60 dark:opacity-50 saturate-50 shadow-slate-900/5'
          : isHighlighted
          ? 'bg-white dark:bg-[#1c1e24] border-blue-500 dark:border-sky-400 ring-2 ring-blue-500/50 dark:ring-sky-400/50 shadow-md shadow-blue-500/20'
          : isSecondHighlighted
          ? 'bg-white dark:bg-[#1c1e24] border-blue-400/60 dark:border-sky-400/50 ring-1 ring-blue-400/25 dark:ring-sky-400/25 shadow-sm shadow-blue-500/10'
          : 'bg-white dark:bg-[#1c1e24] border-slate-200/90 dark:border-[#2b2f3b] hover:border-blue-400/40 dark:hover:border-blue-500/30 shadow-slate-900/5 dark:shadow-black/25'
      }`}
    >
      {/* Top Row: • রেফারেল কোড + [সর্বশেষ] + [ব্যবহৃত / নতুন কোড] + টাইম */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Blue bullet + রেফারেল কোড */}
          <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-slate-700 dark:text-neutral-300 font-medium">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isUsed ? 'bg-slate-400 dark:bg-neutral-500' : isHighlighted ? 'bg-blue-600 dark:bg-sky-400 ring-2 ring-blue-400/40' : 'bg-blue-600 dark:bg-sky-400'
              }`}
            />
            <span className={isUsed ? 'text-slate-500 dark:text-neutral-400 line-through decoration-rose-500/60' : ''}>
              রেফারেল কোড
            </span>
          </div>

          {/* Green "সর্বশেষ" badge for the top card (only if not used) */}
          {isLatest && !isUsed && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#064e3b] text-emerald-800 dark:text-[#34d399] border border-emerald-200 dark:border-[#059669]/50 tracking-wide shrink-0">
              সর্বশেষ
            </span>
          )}

          {/* If Used: red/rose "ব্যবহৃত" badge */}
          {isUsed && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100/90 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-900/60 tracking-tight shrink-0 flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>ব্যবহৃত</span>
            </span>
          )}

          {/* Subtle "নতুন কোড" pill appearing smoothly ONLY on 1st card when highlighted and not used */}
          <AnimatePresence>
            {isHighlighted && !isUsed && (
              <motion.span
                key={`badge-${codeItem.code}-${cycleCount}`}
                initial={{ opacity: 0, scale: 0.8, x: -3 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-sky-300 border border-blue-400/80 dark:border-blue-500/60 tracking-tight shrink-0 flex items-center gap-1 shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-sky-400 animate-ping inline-block" />
                <span>নতুন কোড</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Timestamp on Top */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-neutral-400 shrink-0">

          <span
            className={`w-1.5 h-1.5 rounded-full inline-block transition-colors ${
              isUsed
                ? 'bg-slate-400'
                : isHighlighted
                ? 'bg-blue-600 dark:bg-sky-400 animate-ping ring-2 ring-blue-400/40'
                : 'bg-emerald-500 animate-ping'
            }`}
          />
          <AnimatePresence mode="wait">
            <motion.span
              key={`${codeItem.code}-${displayTimeText}`}
              initial={{ opacity: 0.15, y: -4, filter: 'blur(1.5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0.15, y: 4, filter: 'blur(1.5px)' }}
              transition={{
                duration: 0.28,
                delay: cardIndex * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="tabular-nums font-medium text-slate-500 dark:text-neutral-400"
            >
              {displayTimeText}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Middle Row: Inset Well with Monospace Code + Strikethrough if used */}
      <div
        className={`relative my-2 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2.5 transition-all duration-300 overflow-hidden ${
          isUsed
            ? 'bg-slate-200/60 dark:bg-[#101217] border border-slate-300/80 dark:border-[#22242d]'
            : isHighlighted
            ? 'border border-blue-500/80 dark:border-sky-400/80 ring-2 ring-blue-500/35 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
            : isSecondHighlighted
            ? 'border border-blue-400/50 dark:border-sky-400/50 ring-1 ring-blue-400/20 bg-blue-50/25 dark:bg-blue-950/25 shadow-2xs'
            : 'bg-slate-50 dark:bg-[#121316] border border-slate-200/80 dark:border-[#252832]'
        }`}
      >
        {/* Subtle Blue Shimmer Sheen Sweep ONLY on 1st card when highlighted */}
        <AnimatePresence>
          {isHighlighted && !isUsed && (
            <motion.div
              key={`shimmer-${codeItem.code}-${cycleCount}`}
              initial={{ x: '-100%', opacity: 0.8 }}
              animate={{ x: '220%', opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/35 dark:via-sky-400/30 to-transparent rounded-xl"
            />
          )}
        </AnimatePresence>

        {/* Monospace Code with Distinct Strikethrough if isUsed is true */}
        <div className="font-mono text-lg sm:text-xl font-bold tracking-wider select-all truncate tabular-nums flex items-center min-h-[28px] overflow-hidden">
          {isUsed ? (
            /* Used Code: Grayed out and middle line strikethrough */
            <div className="relative inline-flex items-center min-h-[28px] max-w-full">
              <span className="font-mono text-lg sm:text-xl font-bold tracking-wider text-slate-400 dark:text-neutral-500 line-through decoration-rose-500 dark:decoration-rose-400 decoration-[3px] select-all truncate tabular-nums">
                {codeItem.code}
              </span>
              {/* Distinct centered horizontal cut line across the code */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2.5px] bg-rose-500/85 dark:bg-rose-400/90 rounded-full pointer-events-none shadow-xs" />
            </div>
          ) : isFirstCard ? (
            /* ১ম কার্ড: ক্যারেক্টার স্লাইড এনিমেশন */
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={codeItem.code}
                className="flex items-center text-blue-700 dark:text-sky-400"
                initial={{ y: 9, opacity: 0, filter: 'blur(3px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ y: -9, opacity: 0, filter: 'blur(3px)' }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                {codeItem.code.split('').map((char, index) => (
                  <motion.span
                    key={`${codeItem.code}-${index}`}
                    initial={{ opacity: 0, y: 7, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
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
          ) : (
            /* বাকি কার্ডগুলো: হাইলাইট ছাড়া সুন্দর ঝাপ্টি দিয়ে ট্রানজিশন */
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={codeItem.code}
                initial={{ y: -7, opacity: 0.2, filter: 'blur(1.5px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ y: 7, opacity: 0.2, filter: 'blur(1.5px)' }}
                transition={{
                  duration: 0.28,
                  delay: cardIndex * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block tracking-wider font-mono text-blue-700 dark:text-sky-400"
              >
                {codeItem.code}
              </motion.span>
            </AnimatePresence>
          )}
        </div>

        {/* Right side inside code box */}
        {isUsed ? (
          <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-100/90 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
            <Check className="w-3.5 h-3.5 stroke-[2.8]" />
            <span>ব্যবহৃত</span>
          </div>
        ) : hasSpecialBadge ? (
          <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-100/90 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-sky-300 text-[11px] font-bold">
            <Zap className="w-3 h-3 text-[#0070e0] dark:text-sky-400 fill-current" />
            <span>সুপার ভেরিফাইড</span>
          </div>
        ) : (
          <div className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
            <span>ভেরিফাইড</span>
          </div>
        )}
      </div>

      {/* Bottom Row: 2 CTA Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* Button 1: কপি করুন / ব্যবহৃত */}
        <button
          onClick={handleCopy}
          className={`h-9 sm:h-9.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs ${
            copied
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : isUsed
              ? 'bg-slate-200/90 dark:bg-[#20232c] text-slate-600 dark:text-neutral-400 border border-slate-300 dark:border-[#2f3340]'
              : 'bg-[#0070e0] hover:bg-[#0060c0] text-white shadow-sm shadow-blue-500/25 hover:shadow-md'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>কপি হয়েছে!</span>
            </>
          ) : isUsed ? (
            <>
              <Check className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 stroke-[2.8]" />
              <span>ব্যবহৃত কোড</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 stroke-[2.2]" />
              <span>কপি করুন</span>
            </>
          )}
        </button>

        {/* Button 2: নুসুক অ্যাপ */}
        <button
          onClick={handleOpenNusukClick}
          title="নুসুক অ্যাপ"
          className={`h-9 sm:h-9.5 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs ${
            isUsed
              ? 'bg-slate-100/90 dark:bg-[#1a1c22] border-slate-200 dark:border-[#282a34] text-slate-500 dark:text-neutral-500'
              : 'border-slate-200 dark:border-[#323644] bg-slate-100 hover:bg-slate-200/80 dark:bg-[#22252e] dark:hover:bg-[#2b2f3a] text-slate-800 dark:text-neutral-200'
          }`}
        >
          <span>নুসুক অ্যাপ</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
        </button>
      </div>
    </div>
  );
};
