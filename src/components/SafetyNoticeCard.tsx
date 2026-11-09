import React from 'react';
import { ShieldAlert, ExternalLink, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../lib/i18n';

interface SafetyNoticeCardProps {
  language: Language;
}

export const SafetyNoticeCard: React.FC<SafetyNoticeCardProps> = ({ language }) => {
  const t = translations[language];

  const safetyItems = [
    t.safetyItem1,
    t.safetyItem2,
    t.safetyItem3,
    t.safetyItem4,
    t.safetyItem5,
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-5 py-2 space-y-2">
      {/* Safety Notice Box - Slim */}
      <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-white/[0.06] p-3 shadow-2xs transition-colors duration-200">
        <div className="flex items-center gap-1.5 mb-2">
          <ShieldAlert className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {t.safetyHeading}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
          {safetyItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-1.5 p-1.5 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-white/[0.04]"
            >
              <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500 mt-1.5 shrink-0" />
              <span className="leading-relaxed text-[11px] text-zinc-600 dark:text-zinc-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Official Nusuk Notice & Link - Slim */}
      <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-white/[0.06] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs transition-colors duration-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Official Nusuk Portal</h4>
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1 py-0.1 rounded border border-zinc-200 dark:border-white/[0.06] font-medium">
                {t.disclaimerBadge}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
              {t.disclaimerNotice}
            </p>
          </div>
        </div>

        <a
          href="https://www.nusuk.sa"
          target="_blank"
          rel="noopener noreferrer"
          className="h-7.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-zinc-200/70 dark:border-white/[0.06] text-zinc-800 dark:text-zinc-200 font-medium text-xs flex items-center justify-center gap-1 transition-colors shrink-0"
        >
          <span>{language === 'bn' ? 'অফিশিয়াল ওয়েবসাইট' : 'Official Nusuk Website'}</span>
          <ExternalLink className="w-3 h-3 text-zinc-500" />
        </a>
      </div>
    </div>
  );
};
