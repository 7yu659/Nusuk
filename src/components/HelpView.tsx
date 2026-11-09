import React from 'react';
import { Smartphone, ShieldAlert, ExternalLink } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../lib/i18n';

interface HelpViewProps {
  language: Language;
}

export const HelpView: React.FC<HelpViewProps> = ({ language }) => {
  const t = translations[language];

  return (
    <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-5 py-2.5 space-y-2.5">
      {/* 5-Step Visual Walkthrough - Slim */}
      <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-white/[0.06] p-3.5 transition-colors shadow-2xs">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-6.5 h-6.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {t.appGuideTitle}
          </h3>
        </div>

        <div className="space-y-1.5">
          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.04] flex items-start gap-2">
            <div className="w-4.5 h-4.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t.step1Title}</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{t.step1Desc}</p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.04] flex items-start gap-2">
            <div className="w-4.5 h-4.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t.step2Title}</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{t.step2Desc}</p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.04] flex items-start gap-2">
            <div className="w-4.5 h-4.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t.step3Title}</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{t.step3Desc}</p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.04] flex items-start gap-2">
            <div className="w-4.5 h-4.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              4
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t.step4Title}</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{t.step4Desc}</p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.04] flex items-start gap-2">
            <div className="w-4.5 h-4.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              5
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t.step5Title}</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{t.step5Desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice in Help - Slim */}
      <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-white/[0.06] p-3.5 transition-colors shadow-2xs">
        <div className="flex items-center gap-1.5 mb-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{t.safetyHeading}</h3>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2.5">
          {t.disclaimerNotice}
        </p>
        <div>
          <a
            href="https://www.nusuk.sa"
            target="_blank"
            rel="noopener noreferrer"
            className="h-7.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium text-xs inline-flex items-center gap-1"
          >
            <span>{t.openNusukAppBtn}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
