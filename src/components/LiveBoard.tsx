import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCw, Clock, ChevronDown, Check, Trophy } from 'lucide-react';
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
 * Clean and stable relative timestamp in Bengali.
 * Dynamically synchronized for the top 2 active rotating cards.
 */
function getBengaliTimeText(createdAt?: string, idx: number = 0, top2Cycle: number = 0): string {
  if (idx === 0) {
    const freshOptions = ['এখনই', '১ সেকেন্ড আগে', '২ সেকেন্ড আগে', '৩ সেকেন্ড আগে'];
    return freshOptions[top2Cycle % freshOptions.length];
  }
  if (idx === 1) {
    const sec = 12 + ((top2Cycle * 7 + 1) % 15); // 12s - 26s
    return `${toBnDigits(sec)} সেকেন্ড আগে`;
  }

  if (!createdAt) {
    if (idx < 5) return `${toBnDigits(idx + 1)} মিনিট আগে`;
    return `${toBnDigits(idx * 2)} মিনিট আগে`;
  }

  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) {
    return 'কিছুক্ষণ আগে';
  }

  const diffSec = Math.floor((Date.now() - createdTime) / 1000);
  if (diffSec <= 10) return 'এখনই';
  if (diffSec < 60) return `${toBnDigits(diffSec)} সেকেন্ড আগে`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${toBnDigits(diffMin)} মিনিট আগে`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    const remMin = diffMin % 60;
    return remMin > 0
      ? `${toBnDigits(diffHour)} ঘণ্টা ${toBnDigits(remMin)} মিনিট আগে`
      : `${toBnDigits(diffHour)} ঘণ্টা আগে`;
  }

  const diffDays = Math.floor(diffHour / 24);
  return `${toBnDigits(diffDays)} দিন আগে`;
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
}) => {
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Pagination state: Exactly 10 codes initial dashboard batch
  const [visibleCount, setVisibleCount] = useState<number>(10);

  // Filter out pinned codes from main live board list & strictly deduplicate
  const deduplicatedCodes = React.useMemo(() => {
    const seen = new Set<string>();
    const result: NusukCode[] = [];
    for (const c of codes) {
      if (!c || !c.code || c.isPinned) continue;
      const clean = (c.normalizedCode || c.code).trim().toUpperCase();
      if (!seen.has(clean)) {
        seen.add(clean);
        result.push(c);
      }
    }
    return result;
  }, [codes]);

  // Check whether a code was explicitly copied or clicked by THIS user
  const isCodeUsed = useCallback(
    (c: NusukCode) => {
      if (!c || !c.code) return false;
      const clean = c.code.trim().toUpperCase();
      return userUsedCodes.includes(clean);
    },
    [userUsedCodes]
  );

  const unpinnedCodes = deduplicatedCodes;
  const usedCodesCount = unpinnedCodes.filter(isCodeUsed).length;

  // Pool of codes eligible for streaming rotation on the first 2 cards:
  // strictly excludes any code copied by this user so their used codes are never rotated into slot 0 or 1!
  const unusedPool = React.useMemo(() => {
    return deduplicatedCodes.filter((c) => !isCodeUsed(c));
  }, [deduplicatedCodes, isCodeUsed]);

  const poolToRotate = unusedPool.length >= 2 ? unusedPool : deduplicatedCodes;

  // Dynamic Cycle State specifically for the first 2 cards ("প্রথম ২ টা কার্ড ঝাপ্টি আপডেট")
  const [top2Cycle, setTop2Cycle] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const advanceTop2Cycle = useCallback(() => {
    if (poolToRotate.length <= 1) return;
    setTop2Cycle((prev) => prev + 1);
  }, [poolToRotate.length]);

  // Periodic natural jhapti update for the first 2 cards (spontaneous intervals: 6s - 10s)
  useEffect(() => {
    if (poolToRotate.length <= 1 || sort !== 'newest') return;

    let timeoutId: NodeJS.Timeout;

    const getNaturalInterval = () => {
      const rand = Math.random();
      if (rand < 0.3) {
        return Math.floor(Math.random() * 1400) + 4800; // 4.8s - 6.2s
      } else if (rand < 0.75) {
        return Math.floor(Math.random() * 2500) + 6800; // 6.8s - 9.3s
      } else {
        return Math.floor(Math.random() * 3000) + 10500; // 10.5s - 13.5s
      }
    };

    const scheduleNext = () => {
      const delay = getNaturalInterval();
      timeoutId = setTimeout(() => {
        if (!isPaused) {
          advanceTop2Cycle();
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [poolToRotate.length, sort, isPaused, advanceTop2Cycle]);

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

  // Reset pagination to 10 when sort changes
  useEffect(() => {
    setVisibleCount(10);
  }, [sort]);

  // Sliced stable list: exactly 10 initial codes, then next 10 on scroll
  const displayCodes = React.useMemo(() => {
    return deduplicatedCodes.slice(0, visibleCount);
  }, [deduplicatedCodes, visibleCount]);

  const hasMore = visibleCount < deduplicatedCodes.length;
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  const loadNext10 = useCallback(() => {
    setIsLoadingNext(true);
    setTimeout(() => {
      setVisibleCount((prev) => {
        if (prev >= deduplicatedCodes.length) return prev;
        return Math.min(prev + 10, deduplicatedCodes.length);
      });
      setIsLoadingNext(false);
    }, 120);
  }, [deduplicatedCodes.length]);


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

        {/* Row 2: কিভাবে সহজে বিজয় হব? (প্রিমিয়াম স্বচ্ছ/ট্রান্সপারেন্ট লাল বাটন) & নতুন আগে ▾ */}
        <div className="flex items-center gap-2 pt-2.5">
          {/* Button 1: 🏆 কিভাবে সহজে বিজয় হব? (প্রিমিয়াম ট্রান্সপারেন্ট লাল বাটন) */}
          <button
            onClick={handleScrollToFooterGuide}
            title="নুসুক উমরাহ চ্যালেঞ্জে সহজে বিজয় হওয়ার পূর্ণাঙ্গ গাইড ও প্রশ্নোত্তর"
            className="flex-1 min-w-0 h-8 sm:h-8.5 px-3 rounded-xl bg-rose-500/[0.08] hover:bg-rose-500/[0.16] active:bg-rose-500/[0.24] dark:bg-rose-500/[0.12] dark:hover:bg-rose-500/[0.22] border border-rose-500/30 dark:border-rose-400/35 text-rose-600 dark:text-rose-400 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer active:scale-95 shadow-xs shadow-rose-500/5 hover:shadow-rose-500/15 backdrop-blur-md"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-400/25 shrink-0" />
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

      {/* 2. Standalone Independent Referral Code Cards Feed (10 on load, 10 more on scroll) */}
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
        ) : displayCodes.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-6 text-center text-xs text-slate-500 dark:text-neutral-400 shadow-sm">
            কোনো কোড পাওয়া যায়নি
          </div>
        ) : (
          <div className="space-y-3">
            {displayCodes.map((item, idx) => {
              const isFirstCard = idx === 0;
              const isSecondCard = idx === 1;

              // রেফারেল কোড এর প্রথম ২ টা কার্ড ঝাপ্টি আপডেট হবে, ৩য় কার্ড থেকে বাকি কার্ডগুলো সম্পূর্ণ স্থির থাকবে
              const resolvedItem =
                sort === 'newest' && poolToRotate.length > 1 && (isFirstCard || isSecondCard)
                  ? poolToRotate[((idx - top2Cycle) % poolToRotate.length + poolToRotate.length) % poolToRotate.length]
                  : item;

              const cardTimeText = getBengaliTimeText(resolvedItem.createdAt, idx, top2Cycle);
              const cardIsUsed = hideUsed && isCodeUsed(resolvedItem);

              return (
                <div key={idx < 2 ? `top2-slot-${idx}` : (item.id || `card-${item.code}-${idx}`)} className="transition-opacity duration-200">
                  <CodeCard
                    codeItem={resolvedItem}
                    cardIndex={idx}
                    isLatest={isFirstCard}
                    hasSpecialBadge={idx === 2 || resolvedItem.code === 'NG-Yc3FWdp5'}
                    displayTimeText={cardTimeText}
                    isUsed={cardIsUsed}
                    onCopy={onCopy}
                    onOpenNusuk={onOpenNusuk}
                    onPauseCycle={handlePauseCycle}
                    onResumeCycle={handleResumeCycle}
                    cycleCount={top2Cycle}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Load Next 10 Codes Button */}
      {hasMore && (
        <div className="pt-3.5 pb-2 flex flex-col items-center justify-center">
          <button
            onClick={loadNext10}
            disabled={isLoadingNext}
            className="w-full sm:w-auto min-w-[280px] px-6 py-3 rounded-2xl text-xs sm:text-[13px] font-bold text-slate-800 dark:text-neutral-100 bg-white hover:bg-slate-50 dark:bg-[#1c1e24] dark:hover:bg-[#232630] border border-slate-200/90 dark:border-[#2b2f3b] hover:border-blue-500/40 dark:hover:border-sky-400/40 shadow-sm shadow-slate-900/5 dark:shadow-black/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 group disabled:opacity-85"
          >
            {isLoadingNext ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-blue-600 dark:text-sky-400" />
                <span>লোড হচ্ছে...</span>
              </>
            ) : (
              <>
                <span>পরবর্তি ১০ টি কোড দেখতে ক্লিক করুন</span>
                <ChevronDown className="w-4 h-4 text-blue-600 dark:text-sky-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

