import React, { useState, useEffect } from 'react';
import { AppStats } from '../types';
import { formatNumber } from '../lib/validation';

interface StatsBarProps {
  stats: AppStats | null;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  // 1. কোড শেয়ার (Code Shares): মাঝে মধ্যে অল্প অল্প করে অটোমেটিক বাড়তেই থাকবে
  const [totalCodes, setTotalCodes] = useState<number>(() => {
    const saved = localStorage.getItem('nusuk_live_total_codes');
    const base = stats?.totalCodes || 128;
    return saved ? Math.max(parseInt(saved, 10), base) : base;
  });
  const [codeTick, setCodeTick] = useState(false);

  // 2. জন সক্রিয় (Active Users): কিছু সময় পর পর অটো বাড়বে কমবে
  const [activeUsers, setActiveUsers] = useState<number>(() => {
    return stats?.activeUsers || 19;
  });
  const [userTick, setUserTick] = useState(false);

  // 3. ভিজিট (Visits): মুহুর্তে মুহুর্তে ২/৩/ করতে বাড়তেই থাকবে বর্তমান সংখ্যা থেকে
  const [uniqueVisits, setUniqueVisits] = useState<number>(() => {
    const saved = localStorage.getItem('nusuk_live_visits');
    const base = stats?.uniqueVisitors || 1840;
    return saved ? Math.max(parseInt(saved, 10), base) : base;
  });
  const [visitTick, setVisitTick] = useState(false);

  // Sync if external stats prop increases
  useEffect(() => {
    if (stats?.totalCodes && stats.totalCodes > totalCodes) {
      setTotalCodes(stats.totalCodes);
      localStorage.setItem('nusuk_live_total_codes', String(stats.totalCodes));
    }
  }, [stats?.totalCodes]);

  useEffect(() => {
    if (stats?.uniqueVisitors && stats.uniqueVisitors > uniqueVisits) {
      setUniqueVisits(stats.uniqueVisitors);
      localStorage.setItem('nusuk_live_visits', String(stats.uniqueVisitors));
    }
  }, [stats?.uniqueVisitors]);

  // -------------------------------------------------------------
  // ১. কোড শেয়ার: মাঝে মধ্যে অল্প অল্প করে অটো বাড়বে (প্রতি ১৮-২৮ সেকেন্ডে +১ বা +২)
  // -------------------------------------------------------------
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleNextCodeIncrement = () => {
      // Random interval between 18s and 28s
      const delay = Math.floor(Math.random() * 10000) + 18000;
      timeoutId = setTimeout(() => {
        setTotalCodes((prev) => {
          const increment = Math.random() < 0.8 ? 1 : 2;
          const next = prev + increment;
          try {
            localStorage.setItem('nusuk_live_total_codes', String(next));
          } catch {}
          return next;
        });
        setCodeTick(true);
        setTimeout(() => setCodeTick(false), 500);

        scheduleNextCodeIncrement();
      }, delay);
    };

    scheduleNextCodeIncrement();
    return () => clearTimeout(timeoutId);
  }, []);

  // -------------------------------------------------------------
  // ২. জন সক্রিয়: কিছু সময় পর পর অটো বাড়বে এবং কমবে (প্রতি ৫-৮ সেকেন্ডে ±১ বা ±২)
  // -------------------------------------------------------------
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleUserFluctuation = () => {
      // Interval between 5.5s and 8.5s
      const delay = Math.floor(Math.random() * 3000) + 5500;
      timeoutId = setTimeout(() => {
        setActiveUsers((prev) => {
          let delta = 0;
          if (prev <= 15) {
            delta = Math.floor(Math.random() * 2) + 1; // +1 or +2
          } else if (prev >= 34) {
            delta = -(Math.floor(Math.random() * 2) + 1); // -1 or -2
          } else {
            const variations = [-2, -1, 1, 2, -1, 1];
            delta = variations[Math.floor(Math.random() * variations.length)];
          }
          const next = Math.max(14, Math.min(38, prev + delta));
          return next;
        });
        setUserTick(true);
        setTimeout(() => setUserTick(false), 500);

        scheduleUserFluctuation();
      }, delay);
    };

    scheduleUserFluctuation();
    return () => clearTimeout(timeoutId);
  }, []);

  // -------------------------------------------------------------
  // ৩. ভিজিট: মুহুর্তে মুহুর্তে ২/৩/ করতে বাড়তেই থাকবে বর্তমান সংখ্যা থেকে
  //    (প্রতি ১.৫ - ২.৪ সেকেন্ডে অবিরাম +২ বা +৩ করে বাড়বে)
  // -------------------------------------------------------------
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleVisitIncrement = () => {
      // Rapid real-time moment-by-moment interval: 1400ms - 2300ms
      const delay = Math.floor(Math.random() * 900) + 1400;
      timeoutId = setTimeout(() => {
        setUniqueVisits((prev) => {
          // Increment by exactly 2 or 3 as instructed
          const step = Math.random() < 0.5 ? 2 : 3;
          const next = prev + step;
          try {
            localStorage.setItem('nusuk_live_visits', String(next));
          } catch {}
          return next;
        });
        setVisitTick(true);
        setTimeout(() => setVisitTick(false), 400);

        scheduleVisitIncrement();
      }, delay);
    };

    scheduleVisitIncrement();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 pt-2.5 pb-1">
      <div className="rounded-2xl sm:rounded-full bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] px-3 sm:px-5 py-2 sm:py-2.5 shadow-sm shadow-slate-900/5 dark:shadow-black/20 transition-colors">
        {/* Strictly single line: whitespace-nowrap, flex-nowrap, centered metrics */}
        <div className="flex items-center justify-between sm:justify-center gap-1.5 sm:gap-4 flex-nowrap whitespace-nowrap text-[11px] xs:text-xs sm:text-sm text-slate-700 dark:text-neutral-300 select-none overflow-hidden">
          {/* ১. কোড শেয়ার (মাঝে মধ্যে অল্প অল্প করে বাড়ে) */}
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`font-bold text-blue-600 dark:text-sky-400 tabular-nums transition-transform duration-300 inline-block ${
                codeTick ? 'scale-110 text-blue-500 dark:text-sky-300' : ''
              }`}
            >
              {formatNumber(totalCodes, 'bn')}+
            </span>
            <span className="text-slate-500 dark:text-neutral-400 font-medium">কোড শেয়ার</span>
          </div>

          {/* Separator Bullet */}
          <span className="text-slate-300 dark:text-neutral-600 shrink-0 font-bold">•</span>

          {/* ২. জন সক্রিয় (কিছু সময় পর পর বাড়ে কমে) */}
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`font-bold text-blue-600 dark:text-sky-400 tabular-nums transition-transform duration-300 inline-block ${
                userTick ? 'scale-110 text-emerald-600 dark:text-emerald-400' : ''
              }`}
            >
              {formatNumber(activeUsers, 'bn')}
            </span>
            <span className="text-slate-500 dark:text-neutral-400 font-medium">জন সক্রিয়</span>
          </div>

          {/* Separator Bullet */}
          <span className="text-slate-300 dark:text-neutral-600 shrink-0 font-bold">•</span>

          {/* ৩. ভিজিট (মুহুর্তে মুহুর্তে ২/৩ করে বাড়ে) */}
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`font-bold text-blue-600 dark:text-sky-400 tabular-nums transition-transform duration-200 inline-block ${
                visitTick ? 'scale-105 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            >
              {formatNumber(uniqueVisits.toLocaleString('en-US'), 'bn')}+
            </span>
            <span className="text-slate-500 dark:text-neutral-400 font-medium">ভিজিট</span>
          </div>
        </div>
      </div>
    </div>
  );
};

