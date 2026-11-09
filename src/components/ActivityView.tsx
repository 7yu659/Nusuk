import React from 'react';
import { BarChart3, Users, Copy, TrendingUp, Sparkles } from 'lucide-react';
import { AppStats, Language, NusukCode } from '../types';
import { translations } from '../lib/i18n';
import { formatNumber } from '../lib/validation';

interface ActivityViewProps {
  stats: AppStats | null;
  topCodes: NusukCode[];
  language: Language;
  onCopy: (id: string, code: string) => void;
  onOpenNusukGuide: (code: string) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  stats,
  topCodes,
  language,
  onCopy,
}) => {
  const t = translations[language];

  return (
    <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-5 py-2.5 space-y-3">
      {/* Metric Cards - Slim */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-white/[0.06] p-3 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-medium">{t.statsCodeShared}</span>
            <Sparkles className="w-3 h-3 text-zinc-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatNumber(stats?.totalCodes ?? 128, language)}+
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>+24 {language === 'bn' ? 'আজকে' : 'today'}</span>
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-white/[0.06] p-3 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-medium">{t.statsActiveUsers}</span>
            <Users className="w-3 h-3 text-zinc-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatNumber(stats?.activeUsers ?? 18, language)}
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {language === 'bn' ? 'লাইভ ব্যবহারকারী' : 'Live participants'}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-white/[0.06] p-3 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-medium">{t.statsSuccessfulCopies}</span>
            <Copy className="w-3 h-3 text-zinc-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatNumber(stats?.totalCopies ?? 5420, language)}+
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            {language === 'bn' ? 'সফল কপি' : 'Total copies'}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-white/[0.06] p-3 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-medium">{t.statsTotalVisits}</span>
            <BarChart3 className="w-3 h-3 text-zinc-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatNumber(stats?.uniqueVisitors ?? 1480, language)}+
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {language === 'bn' ? 'কমিউনিটি পরিদর্শণ' : 'Community visits'}
          </p>
        </div>
      </div>

      {/* Leaderboard - Slim */}
      <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-white/[0.06] p-3.5 transition-colors shadow-2xs">
        <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2.5">
          {language === 'bn' ? 'সর্বাধিক ব্যবহৃত ও জনপ্রিয় কি' : 'Most Popular Community Keys'}
        </h3>
        <div className="space-y-1">
          {topCodes.slice(0, 6).map((c, i) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-white/[0.04]"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 text-center font-mono font-bold text-xs text-zinc-400 dark:text-zinc-500">
                  #{i + 1}
                </span>
                <div>
                  <span className="font-mono text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-200 tabular-nums">{c.code}</span>
                  {c.nickname && (
                    <span className="text-[11px] text-zinc-400 ml-1.5 font-normal">
                      ({c.nickname})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                  {formatNumber(c.copyCount, language)} {t.cardCopiedCount}
                </span>
                <button
                  onClick={() => onCopy(c.id, c.code)}
                  className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-xs font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-200/70 dark:border-white/[0.06] cursor-pointer transition-colors"
                >
                  {t.copyBtn}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
