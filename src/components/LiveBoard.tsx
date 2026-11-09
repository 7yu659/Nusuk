import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCw, Clock, ChevronDown, Check, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NusukCode, CodeSort } from '../types';
import { CodeCard } from './CodeCard';

interface LiveBoardProps {
  codes: NusukCode[];
  userUsedCodes?: string[];
  isLoading: boolean;
  isRefreshing: boolean;
  sort: CodeSort;
  onSortChange: (sort: CodeSort) => void;
  hideUsed: boolean;
  onToggleHideUsed: () => void;
  onRefresh: () => void;
  onCopy: (id: string, code: string) => void;
  onOpenNusuk: (code: string) => void;
  onOpenNotWorkingModal?: () => void;
  onOpenBenefitModal?: () => void;
}

// Helper to format numbers into Bengali digits
function toBnDigits(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

/**
 * Strictly synchronized relative timestamp for each card index.
 * Recalculates dynamically on EVERY single sudden cycle so code and time update
 * in 100% lockstep without any card having a static/frozen timestamp.
 */
function getSynchronizedCardTime(idx: number, cycle: number): string {
  // Card 0: Brand new drop
  if (idx === 0) {
    const freshOptions = ['এখনই', '১ সেকেন্ড আগে', '২ সেকেন্ড আগে', '৩ সেকেন্ড আগে'];
    return freshOptions[(cycle + idx) % freshOptions.length];
  }

  // Card 1: Recently rotated down (11s - 25s)
  if (idx === 1) {
    const sec = 12 + ((cycle * 7 + 1) % 14); // 12 to 25 sec
    return `${toBnDigits(sec)} সেকেন্ড আগে`;
  }

  // Card 2: 32s - 55s
  if (idx === 2) {
    const sec = 32 + ((cycle * 11 + 3) % 24); // 32 to 55 sec
    return `${toBnDigits(sec)} সেকেন্ড আগে`;
  }

  // Card 3: 58s - 1m 25s
  if (idx === 3) {
    const sec = 58 + ((cycle * 5 + 4) % 30);
    if (sec < 60) {
      return `${toBnDigits(sec)} সেকেন্ড আগে`;
    }
    return `১ মিনিট ${toBnDigits(sec - 60)} সেকেন্ড আগে`;
  }

  // Card 4: ~2 minutes
  if (idx === 4) {
    const sec = 10 + ((cycle * 9 + 5) % 45);
    return `২ মিনিট ${toBnDigits(sec)} সেকেন্ড আগে`;
  }

  // Card 5: ~3-4 minutes
  if (idx === 5) {
    const mins = 3 + ((cycle + 1) % 2);
    const sec = 15 + ((cycle * 13) % 40);
    return `${toBnDigits(mins)} মিনিট ${toBnDigits(sec)} সেকেন্ড আগে`;
  }

  // Card 6: ~5-6 minutes
  if (idx === 6) {
    const mins = 5 + ((cycle * 2 + 1) % 2);
    return `${toBnDigits(mins)} মিনিট আগে`;
  }

  // Card 7: ~7-8 minutes
  if (idx === 7) {
    const mins = 7 + ((cycle + 2) % 2);
    return `${toBnDigits(mins)} মিনিট আগে`;
  }

  // Card 8: ~9-11 minutes
  if (idx === 8) {
    const mins = 9 + ((cycle * 3 + 1) % 3);
    return `${toBnDigits(mins)} মিনিট আগে`;
  }

  // Card 9+: Scaled realistically with dynamic cycle jitter so deeper cards never freeze
  const baseMinutes = 12 + (idx - 9) * 3;
  const cycleJitter = ((cycle * 7 + idx * 3) % 4) - 1; // -1, 0, 1, 2
  const totalMinutes = Math.max(12, baseMinutes + cycleJitter);

  if (totalMinutes < 60) {
    return `${toBnDigits(totalMinutes)} মিনিট আগে`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const remMinutes = totalMinutes % 60;
  if (hours < 24) {
    return remMinutes > 0
      ? `${toBnDigits(hours)} ঘণ্টা ${toBnDigits(remMinutes)} মিনিট আগে`
      : `${toBnDigits(hours)} ঘণ্টা আগে`;
  }

  const days = Math.floor(hours / 24);
  return `${toBnDigits(days)} দিন আগে`;
}

export const LiveBoard: React.FC<LiveBoardProps> = ({
  codes,
  userUsedCodes = [],
  isLoading,
  isRefreshing,
  sort,
  onSortChange,
  hideUsed,
  onToggleHideUsed,
  onRefresh,
  onCopy,
  onOpenNusuk,
  onOpenNotWorkingModal,
  onOpenBenefitModal,
}) => {
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Filter out pinned codes from main live board list
  const unpinnedCodes = codes.filter((c) => !c.isPinned);

  // Check whether a code was explicitly copied or clicked by THIS user
  const isCodeUsed = useCallback(
    (c: NusukCode) => {
      if (!c || !c.code) return false;
      const clean = c.code.trim().toUpperCase();
      return userUsedCodes.includes(clean);
    },
    [userUsedCodes]
  );

  const usedCodesCount = unpinnedCodes.filter(isCodeUsed).length;

  // "ব্যবহৃত লুকান মানে ধুসর করে লেখা কেটে দেওয়া একদম হাইড না করা"
  // Keep all unpinned codes in display list; used codes are grayed-out with a strikethrough cut line
  const displayCodes = unpinnedCodes;

  // Pool of codes eligible for top Card 0 fresh drop: strictly excludes any code copied by this user!
  const unusedPool = unpinnedCodes.filter((c) => !isCodeUsed(c));
  const poolToRotate = unusedPool.length > 0 ? unusedPool : unpinnedCodes;

  const totalPages = Math.ceil(displayCodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCodes = displayCodes.slice(startIndex, startIndex + itemsPerPage);

  // Dynamic Cycle State for top card 0 fresh drops
  const [cycleIndex, setCycleIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const advanceCycle = useCallback(() => {
    if (poolToRotate.length === 0) return;
    setCycleIndex((prev) => prev + 1);
  }, [poolToRotate.length]);

  // Periodic sudden rotation: কোনো নির্দিষ্ট টাইম পরে না, যখন তখন হঠাৎ করে (unpredictable spontaneous bursts)
  useEffect(() => {
    if (unpinnedCodes.length === 0 || sort !== 'newest') return;

    let timeoutId: NodeJS.Timeout;

    // Generates truly unpredictable intervals: "যখন তখন হঠাৎ করে"
    const getSuddenRandomDelay = () => {
      const rand = Math.random();
      if (rand < 0.28) {
        // Sudden quick drop: 2.8s to 4.2s
        return Math.floor(Math.random() * 1400) + 2800;
      } else if (rand < 0.65) {
        // Spontaneous normal update: 5.5s to 9s
        return Math.floor(Math.random() * 3500) + 5500;
      } else if (rand < 0.88) {
        // Longer unexpected lull followed by sudden burst: 11s to 18s
        return Math.floor(Math.random() * 7000) + 11000;
      } else {
        // Ultra-rapid live flash: 1.8s to 2.5s
        return Math.floor(Math.random() * 700) + 1800;
      }
    };

    const scheduleNext = () => {
      const delay = getSuddenRandomDelay();
      timeoutId = setTimeout(() => {
        if (!isPaused) {
          advanceCycle();
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [unpinnedCodes.length, sort, isPaused, advanceCycle]);

  const handlePauseCycle = useCallback(() => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 8000);
  }, []);

  const handleResumeCycle = useCallback(() => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  }, []);

  const sortLabels: Record<CodeSort, string> = {
    newest: 'নতুন আগে',
    most_copied: 'বেশি ব্যবহৃত',
    oldest: 'পুরোনো আগে',
  };

  // Smooth scroll down to Nusuk Quiz Footer Guide
  const handleScrollToFooterGuide = () => {
    const footerEl = document.getElementById('nusuk-quiz-footer');
    if (footerEl) {
      footerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-2">
      {/* 1. Standalone Live Board Controls Card */}
      <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-3 sm:p-3.5 shadow-sm shadow-slate-900/5 dark:shadow-black/25 transition-colors">
        {/* Row 1: লাইভ বোর্ড + ⟳ (Refresh in Blue) and ☑ ব্যবহৃত লুকান (২) */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-[#262934]">
          {/* Title + Refresh Button */}
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
              লাইভ বোর্ড
            </h2>
            <button
              onClick={onRefresh}
              title="রিফ্রেশ করুন"
              className="p-1 rounded-lg text-slate-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-[#252831] transition-colors cursor-pointer active:scale-95"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600 dark:text-sky-400' : ''}`} />
            </button>
          </div>

          {/* Checkbox: ব্যবহৃত লুকান (N) - ধুসর ও দাগ কাটা মোড */}
          <button
            onClick={onToggleHideUsed}
            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none transition-colors"
          >
            <div
              className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-colors border ${
                hideUsed
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-[#15161b] border-slate-300 dark:border-[#353946]'
              }`}
            >
              {hideUsed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <span>
              ব্যবহৃত লুকান{' '}
              <span className="text-slate-500 dark:text-neutral-400 font-normal">
                ({toBnDigits(usedCodesCount)})
              </span>
            </span>
          </button>
        </div>

        {/* Row 2: কিভাবে সহজে বিজয় হব? (লাল বাটন) & নতুন আগে ▾ */}
        <div className="flex items-center gap-2 pt-2.5">
          {/* Button 1: 🏆 কিভাবে সহজে বিজয় হব? (লাল বাটন - Red Button) */}
          <button
            onClick={handleScrollToFooterGuide}
            title="নুসুক উমরাহ চ্যালেঞ্জে সহজে বিজয় হওয়ার পূর্ণাঙ্গ গাইড ও প্রশ্নোত্তর"
            className="flex-1 min-w-0 h-8 sm:h-8.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-500 dark:border-rose-600 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer active:scale-95 shadow-sm shadow-rose-600/30"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
            <span className="truncate sm:overflow-visible">কিভাবে সহজে বিজয় হব?</span>
          </button>

          {/* Button 2: 🕒 নতুন আগে ▾ */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#242730] dark:hover:bg-[#2c303c] border border-slate-200/90 dark:border-[#363a48] text-slate-700 dark:text-neutral-200 text-[11px] sm:text-xs font-semibold flex items-center justify-between gap-1.5 whitespace-nowrap transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 shrink-0" />
                <span>{sortLabels[sort]}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500 dark:text-neutral-400 shrink-0" />
            </button>

            {isSortDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsSortDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-40 w-36 rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200 dark:border-[#2b2f3b] shadow-xl py-1.5 text-xs overflow-hidden">
                  {(['newest', 'most_copied', 'oldest'] as CodeSort[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        onSortChange(option);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                        sort === option
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-400 font-bold'
                          : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-[#242730]'
                      }`}
                    >
                      <span>{sortLabels[option]}</span>
                      {sort === option && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Standalone Independent Referral Code Cards Feed */}
      <div className="mt-3 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-4 h-36 animate-pulse"
              />
            ))}
          </div>
        ) : paginatedCodes.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-6 text-center text-xs text-slate-500 dark:text-neutral-400 shadow-sm">
            কোনো কোড পাওয়া যায়নি
          </div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {paginatedCodes.map((item, idx) => {
              // Only Card 0 (top latest drop) rotates through fresh unused codes
              // All other cards (1, 2, 3...) stay 100% stable with their own actual codes!
              const isFirstCard = idx === 0 && currentPage === 1;
              const resolvedItem =
                isFirstCard && sort === 'newest' && poolToRotate.length > 0
                  ? poolToRotate[cycleIndex % poolToRotate.length]
                  : item;

              const cardTimeText = getSynchronizedCardTime(idx, cycleIndex);
              // A code is marked as used (grayed out + middle strike line) IF:
              // 1. THIS user specifically copied/clicked it, AND
              // 2. "ব্যবহৃত লুকান" is active (hideUsed === true)
              const cardIsUsed = hideUsed && isCodeUsed(resolvedItem);

              return (
                <motion.div
                  key={`card-slot-${idx}`}
                  layout="position"
                  initial={{ opacity: 0, y: -16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{
                    duration: 0.35,
                    ease: [0.16, 1, 0.3, 1],
                    layout: { duration: 0.3, ease: 'easeOut' },
                  }}
                >
                  <CodeCard
                    codeItem={resolvedItem}
                    cardIndex={idx}
                    isLatest={isFirstCard}
                    hasSpecialBadge={idx === 2 || resolvedItem.code === 'NG-Yc3FWdp5'}
                    displayTimeText={cardTimeText}
                    isUsed={cardIsUsed}
                    onCopy={onCopy}
                    onOpenNusuk={onOpenNusuk}
                    onTriggerNextCode={idx === 0 ? advanceCycle : undefined}
                    onPauseCycle={handlePauseCycle}
                    onResumeCycle={handleResumeCycle}
                    cycleCount={isFirstCard ? cycleIndex : 0}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* 3. Pagination Controls (Shown when 100+ codes are loaded) */}
      {totalPages > 1 && (
        <div className="mt-5 p-3 rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] flex items-center justify-between gap-2 shadow-xs transition-colors">
          {/* Previous Page */}
          <button
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 320, behavior: 'smooth' });
            }}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentPage === 1
                ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-[#20222a] text-slate-400 dark:text-neutral-500'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#242730] dark:hover:bg-[#2c303c] text-slate-800 dark:text-white border border-slate-200 dark:border-[#363a48]'
            }`}
          >
            « পূর্ববর্তী
          </button>

          {/* Page Indicators */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNo) => (
              <button
                key={pageNo}
                onClick={() => {
                  setCurrentPage(pageNo);
                  window.scrollTo({ top: 320, behavior: 'smooth' });
                }}
                className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                  currentPage === pageNo
                    ? 'bg-[#0070e0] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-[#282a34]'
                }`}
              >
                {pageNo}
              </button>
            ))}
          </div>

          {/* Next Page */}
          <button
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 320, behavior: 'smooth' });
            }}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentPage === totalPages
                ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-[#20222a] text-slate-400 dark:text-neutral-500'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#242730] dark:hover:bg-[#2c303c] text-slate-800 dark:text-white border border-slate-200 dark:border-[#363a48]'
            }`}
          >
            পরবর্তী »
          </button>
        </div>
      )}

      {/* Total Codes Counter Badge */}
      <div className="mt-2.5 text-center text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
        মোট {displayCodes.length}টি কোড • পৃষ্ঠা {currentPage}/{totalPages || 1}
      </div>
    </div>
  );
};
